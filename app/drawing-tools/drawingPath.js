// @ts-nocheck
import { imgEditor } from "../index.ts";
import { bringToFront, updateScaleControlPoints } from "../utils/utils.js";

let isControl = false;
let isScale = false;

function inRange(radius, cursorX, cursorY, targetX, targetY) {
  return (
    Math.abs(cursorX - targetX) <= radius &&
    Math.abs(cursorY - targetY) <= radius
  );
}

function createControlPoint(left, top, path, isMidPoint = false) {
  return new fabric.Circle({
    left,
    top,
    radius: 6,
    fill: "#fff",
    stroke: isMidPoint ? "rgb(255, 100, 100)" : "rgb(0, 120, 215)",
    strokeWidth: 3,
    selectable: true,
    evented: true,
    isControlPoint: true,
    hoverCursor: "crosshair",
    hasBorders: false,
    hasControls: false,
    visible: false,
    parentPath: path,
    offsetX: -7.5,
    offsetY: -7.5,
  });
}

function attachControlPoints(fabricCanvas, path, moveLeft, moveTop) {
  if (!path || !path.path || path.path.length < 2) return;

  if (path.controlPoints) {
    path.controlPoints.forEach((point) => fabricCanvas.remove(point));
  }

  if (!moveLeft) {
    moveLeft = 0;
  }

  if (!moveTop) {
    moveTop = 0;
  }

  path.controlPoints = [];

  const newPath = [];
  for (let i = 0; i < path.path.length; i++) {
    if (i === 0) {
      newPath.push(path.path[i]);
      continue;
    }
    const prev = path.path[i - 1];
    const curr = path.path[i];
    if (curr[0] === "L") {
      const startX = prev[0] === "M" ? prev[1] : prev[prev.length - 2];
      const startY = prev[0] === "M" ? prev[2] : prev[prev.length - 1];
      const endX = curr[1];
      const endY = curr[2];
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      newPath.push(["Q", midX, midY, endX, endY]);
    } else {
      newPath.push(curr);
    }
  }
  path.path = newPath;

  const firstSegment = path.path[0];
  const lastSegment = path.path[path.path.length - 1];
  const firstX = firstSegment[1];
  const firstY = firstSegment[2];
  const lastX = lastSegment[0] === "Q" ? lastSegment[3] : lastSegment[1];
  const lastY = lastSegment[0] === "Q" ? lastSegment[4] : lastSegment[2];
  const isClosed = inRange(10, firstX, firstY, lastX, lastY);

  for (let i = 0; i < path.path.length - 1; i++) {
    const start = i === 0 ? path.path[0] : path.path[i];
    const end = path.path[i + 1];

    const startX = start[0] === "M" || start[0] === "L" ? start[1] : start[3];
    const startY = start[0] === "M" || start[0] === "L" ? start[2] : start[4];
    const endX = end[0] === "Q" ? end[3] : end[1];
    const endY = end[0] === "Q" ? end[4] : end[2];

    if (i === 0) {
      const p0 = createControlPoint(
        startX - 7.5 + moveLeft,
        startY - 7.5 + moveTop,
        path
      );
      p0.segmentIndex = i;
      p0.isStart = true;
      if (isClosed) {
        p0.isEndPoint = true;
      }
      path.controlPoints.push(p0);
      fabricCanvas.add(p0);
    }

    if (!isClosed || i < path.path.length - 2) {
      const p2 = createControlPoint(
        endX - 7.5 + moveLeft,
        endY - 7.5 + moveTop,
        path
      );
      p2.segmentIndex = i;
      path.controlPoints.push(p2);
      fabricCanvas.add(p2);
    }

    if (end[0] === "Q") {
      const midX = end[1];
      const midY = end[2];
      const p1 = createControlPoint(
        midX - 7.5 + moveLeft,
        midY - 7.5 + moveTop,
        path,
        true
      );
      p1.segmentIndex = i;
      p1.isMidPoint = true;
      path.controlPoints.push(p1);
      fabricCanvas.add(p1);
    }
  }

  if (!path._isEventHandlersAttached) {
    attachPathEventHandlers(fabricCanvas, path);
    path._isEventHandlersAttached = true;
  }

  bindControlPoints(path);
  attachControlPointEvents(fabricCanvas, path);
  updateScaleControlPoints(fabricCanvas);
  fabricCanvas.renderAll();
}

function attachPathEventHandlers(fabricCanvas, path) {
  path.on("selected", function () {
    if (fabricCanvas.getActiveObjects().length > 1) return;

    if (this.scaleX !== 1 || this.scaleY !== 1) {
      applyPathScaling(this, fabricCanvas);
    } else if (!isControl) {
      updateControlPoints(this);
    }

    if (this.controlPoints) {
      this.controlPoints.forEach((p) => {
        p.set({ visible: true });
        bringToFront(p, fabricCanvas);
      });
    }
    isControl = false;
    fabricCanvas.renderAll();
  });

  path.on("deselected", function () {
    if (this.controlPoints) {
      this.controlPoints.forEach(
        (p) => !p.selected && p.set({ visible: false })
      );
    }
    fabricCanvas.renderAll();
  });

  path.on("moving", function () {
    updateControlPoints(this);
    this.controlPoints.forEach((p) => bringToFront(p, fabricCanvas));
    fabricCanvas.renderAll();
  });

  path.on("scaling", function () {
    isScale = true;

    if (this.controlPoints) {
      this.controlPoints.forEach((point) => this.canvas.remove(point));
      this.controlPoints = [];
    }
    this.canvas.renderAll();
  });

  fabricCanvas.on("mouse:up", () => {
    if (isScale) {
      isScale = false;
      if (fabricCanvas.getActiveObjects().length === 1) {
        const temp = fabricCanvas.getActiveObjects()[0];
        fabricCanvas.discardActiveObject();
        fabricCanvas.setActiveObject(temp);
      }
    }
  });
}

function applyPathScaling(path, fabricCanvas) {
  const oCoords = path.oCoords || {};
  const scaleX = path.scaleX || 1;
  const scaleY = path.scaleY || 1;
  const originalLeft = path.left || 0;
  const originalTop = path.top || 0;

  const minX = oCoords.tl ? oCoords.tl.x : originalLeft;
  const maxX = oCoords.br ? oCoords.br.x : originalLeft;
  const minY = oCoords.tl ? oCoords.tl.y : originalTop;
  const maxY = oCoords.br ? oCoords.br.y : originalTop;
  const oCoordsWidth = maxX - minX;
  const oCoordsHeight = maxY - minY;

  const isValidOCoords =
    oCoordsWidth > 0 && oCoordsHeight > 0 && minX !== maxX && minY !== maxY;
  let fallbackBounds;
  if (!isValidOCoords) {
    fallbackBounds = path._calcDimensions();
    fallbackBounds.minX = fallbackBounds.left;
    fallbackBounds.maxX = fallbackBounds.left + fallbackBounds.width;
    fallbackBounds.minY = fallbackBounds.top;
    fallbackBounds.maxY = fallbackBounds.top + fallbackBounds.height;
  }

  let pathMinX = Infinity,
    pathMaxX = -Infinity,
    pathMinY = Infinity,
    pathMaxY = -Infinity;
  path.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      pathMinX = Math.min(pathMinX, segment[1]);
      pathMaxX = Math.max(pathMaxX, segment[1]);
      pathMinY = Math.min(pathMinY, segment[2]);
      pathMaxY = Math.max(pathMaxY, segment[2]);
    } else if (segment[0] === "Q") {
      pathMinX = Math.min(pathMinX, segment[1], segment[3]);
      pathMaxX = Math.max(pathMaxX, segment[1], segment[3]);
      pathMinY = Math.min(pathMinY, segment[2], segment[4]);
      pathMaxY = Math.max(pathMaxY, segment[2], segment[4]);
    }
  });
  const pathWidth = pathMaxX - pathMinX;
  const pathHeight = pathMaxY - pathMinY;

  let adjustedScaleX = scaleX;
  let adjustedScaleY = scaleY;
  if (isValidOCoords && pathWidth > 0 && pathHeight > 0) {
    if (pathWidth * scaleX > oCoordsWidth) {
      adjustedScaleX = oCoordsWidth / pathWidth;
    }
    if (pathHeight * scaleY > oCoordsHeight) {
      adjustedScaleY = oCoordsHeight / pathHeight;
    }
  }
  adjustedScaleX = Math.max(0.01, adjustedScaleX);
  adjustedScaleY = Math.max(0.01, adjustedScaleY);

  const pathLeftOffset = isValidOCoords ? minX : originalLeft;
  const pathTopOffset = isValidOCoords ? minY : originalTop;
  path.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      segment[1] = (segment[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
      segment[2] = (segment[2] - pathMinY) * adjustedScaleY + pathTopOffset;
    } else if (segment[0] === "Q") {
      segment[1] = (segment[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
      segment[2] = (segment[2] - pathMinY) * adjustedScaleY + pathTopOffset;
      segment[3] = (segment[3] - pathMinX) * adjustedScaleX + pathLeftOffset;
      segment[4] = (segment[4] - pathMinY) * adjustedScaleY + pathTopOffset;
    }
  });

  const newLeft = isValidOCoords ? minX : originalLeft;
  const newTop = isValidOCoords ? minY : originalTop;
  path.set({ scaleX: 1, scaleY: 1, left: newLeft, top: newTop });
  updatePathDimensions(path);
  attachControlPoints(fabricCanvas, path);
}

function bindControlPoints(path) {
  const pathTransform = path.calcTransformMatrix();
  const invertedPathTransform = fabric.util.invertTransform(pathTransform);

  path.controlPoints.forEach((point) => {
    const pointTransform = point.calcTransformMatrix();
    point.relationship = fabric.util.multiplyTransformMatrices(
      invertedPathTransform,
      pointTransform
    );
  });
  path.off("moving");
  path.on("moving", () => updateControlPoints(path));
  path.off("rotating");
  path.on("rotating", () => updateControlPoints(path));
}

function updateControlPoints(path) {
  if (!path || !path.controlPoints) return;
  const pathTransform = path.calcTransformMatrix();
  const zoom = imgEditor.canvas.getZoom();

  const firstSegment = path.path[0];
  const lastSegment = path.path[path.path.length - 1];
  const firstX = firstSegment[1];
  const firstY = firstSegment[2];
  const lastX = lastSegment[0] === "Q" ? lastSegment[3] : lastSegment[1];
  const lastY = lastSegment[0] === "Q" ? lastSegment[4] : lastSegment[2];
  const isClosed = inRange(10, firstX, firstY, lastX, lastY);

  path.controlPoints.forEach((point) => {
    if (!point.relationship) return;

    const newTransform = fabric.util.multiplyTransformMatrices(
      pathTransform,
      point.relationship
    );
    const opt = fabric.util.qrDecompose(newTransform);

    point.set({
      left: opt.translateX + point.offsetX / zoom,
      top: opt.translateY + point.offsetY / zoom,
    });
    point.setCoords();

    if (isClosed && point.isEndPoint) {
      const startPoint = path.controlPoints.find((p) => p.isStart);
      if (startPoint) {
        point.set({
          left: startPoint.left,
          top: startPoint.top,
        });
        point.setCoords();
      }
    }
  });

  syncPathWithControlPoints(path, path.canvas, true);
}

function updatePathFromControlPoints(path, movedPoint) {
  if (
    !path ||
    !path.path ||
    !movedPoint ||
    typeof movedPoint.segmentIndex !== "number"
  ) {
    console.warn("Invalid path or movedPoint:", { path, movedPoint });
    return;
  }

  const segmentIndex = movedPoint.segmentIndex;
  const newX = movedPoint.left - movedPoint.offsetX;
  const newY = movedPoint.top - movedPoint.offsetY;

  if (movedPoint.isStart) {
    path.path[segmentIndex][1] = newX;
    path.path[segmentIndex][2] = newY;
    if (movedPoint.isEndPoint) {
      const lastSegment = path.path[path.path.length - 1];
      if (lastSegment[0] === "Q") {
        lastSegment[3] = newX;
        lastSegment[4] = newY;
      } else if (lastSegment[0] === "L") {
        lastSegment[1] = newX;
        lastSegment[2] = newY;
      }
    }
  } else if (
    movedPoint.isMidPoint &&
    segmentIndex + 1 < path.path.length &&
    path.path[segmentIndex + 1][0] === "Q"
  ) {
    path.path[segmentIndex + 1][1] = newX;
    path.path[segmentIndex + 1][2] = newY;
  } else {
    const segment = path.path[segmentIndex + 1];
    if (segment[0] === "Q") {
      segment[3] = newX;
      segment[4] = newY;
      if (
        segmentIndex + 1 === path.path.length - 1 &&
        inRange(10, path.path[0][1], path.path[0][2], segment[3], segment[4])
      ) {
        path.path[0][1] = newX;
        path.path[0][2] = newY;
      }
    } else if (segment[0] === "L") {
      segment[1] = newX;
      segment[2] = newY;
      if (
        segmentIndex + 1 === path.path.length - 1 &&
        inRange(10, path.path[0][1], path.path[0][2], segment[1], segment[2])
      ) {
        path.path[0][1] = newX;
        path.path[0][2] = newY;
      }
    }
  }

  const dims = path._calcDimensions();
  path.set({
    width: dims.width,
    height: dims.height,
    left: dims.left,
    top: dims.top,
    pathOffset: {
      x: dims.width / 2 + dims.left,
      y: dims.height / 2 + dims.top,
    },
    dirty: true,
  });
  path.setCoords();
  if (path.canvas) {
    path.canvas.renderAll();
  }
}

function syncPathWithControlPoints(path, fabricCanvas, isMoving = false) {
  if (!path.controlPoints || !path.path) return;

  const firstSegment = path.path[0];
  const lastSegment = path.path[path.path.length - 1];
  const firstX = firstSegment[1];
  const firstY = firstSegment[2];
  const lastX = lastSegment[0] === "Q" ? lastSegment[3] : lastSegment[1];
  const lastY = lastSegment[0] === "Q" ? lastSegment[4] : lastSegment[2];
  const isClosed = inRange(10, firstX, firstY, lastX, lastY);

  let needsUpdate = false;
  path.controlPoints.forEach((point) => {
    const segmentIndex = point.segmentIndex;
    const actualX = point.left - point.offsetX;
    const actualY = point.top - point.offsetY;

    if (point.isStart) {
      const [cmd, x, y] = path.path[segmentIndex];
      if (x !== actualX || y !== actualY) {
        path.path[segmentIndex][1] = actualX;
        path.path[segmentIndex][2] = actualY;
        if (isClosed) {
          const lastSegment = path.path[path.path.length - 1];
          if (lastSegment[0] === "Q") {
            lastSegment[3] = actualX;
            lastSegment[4] = actualY;
          } else if (lastSegment[0] === "L") {
            lastSegment[1] = actualX;
            lastSegment[2] = actualY;
          }
        }
        needsUpdate = true;
      }
    } else if (point.isMidPoint) {
      const [cmd, midX, midY, endX, endY] = path.path[segmentIndex + 1];
      if (midX !== actualX || midY !== actualY) {
        path.path[segmentIndex + 1][1] = actualX;
        path.path[segmentIndex + 1][2] = actualY;
        needsUpdate = true;
      }
    } else {
      const segment = path.path[segmentIndex + 1];
      const [cmd, x1, y1, x2, y2] =
        segment[0] === "Q"
          ? segment
          : [segment[0], null, null, segment[1], segment[2]];
      if (segment[0] === "Q" && (x2 !== actualX || y2 !== actualY)) {
        segment[3] = actualX;
        segment[4] = actualY;
        if (isClosed && segmentIndex + 1 === path.path.length - 1) {
          path.path[0][1] = actualX;
          path.path[0][2] = actualY;
        }
        needsUpdate = true;
      } else if (segment[0] === "L" && (x1 !== actualX || y1 !== actualY)) {
        segment[1] = actualX;
        segment[2] = actualY;
        if (isClosed && segmentIndex + 1 === path.path.length - 1) {
          path.path[0][1] = actualX;
          path.path[0][2] = actualY;
        }
        needsUpdate = true;
      }
    }
  });

  if (needsUpdate) {
    updatePathDimensions(path);
    if (!isMoving) {
      attachControlPoints(fabricCanvas, path);
    }
  }
}

function attachControlPointEvents(fabricCanvas, path) {
  path.controlPoints.forEach((point) => {
    point.on("moving", () => {
      isControl = true;
      updatePathFromControlPoints(path, point);
      syncPathWithControlPoints(path, fabricCanvas, true);
      bindControlPoints(path);
    });

    point.on("selected", () => {
      path.controlPoints.forEach((p) => {
        p.set({ visible: true });
        bringToFront(p, fabricCanvas);
      });
      fabricCanvas.renderAll();
    });

    point.on("deselected", () => {
      path.controlPoints.forEach(
        (p) => !p.selected && p.set({ visible: false })
      );
      fabricCanvas.renderAll();
    });

    point.on("mouseup", () => {
      fabricCanvas.setActiveObject(path);
      fabricCanvas.renderAll();
    });
  });
}

function updatePathDimensions(path) {
  const dims = path._calcDimensions();
  const props = {
    width: dims.width,
    height: dims.height,
    pathOffset: {
      x: dims.width / 2 + dims.left,
      y: dims.height / 2 + dims.top,
    },
    dirty: true,
  };

  props.left = dims.left;
  props.top = dims.top;

  path.set(props);
  path.setCoords();
}

function pathDrawing(fabricCanvas) {
  let isDrawingPath = false,
    pathToDraw,
    pointer,
    updatedPath,
    isMouseDown = false;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingPathMode) return;

    isMouseDown = true;
    isDrawingPath = true;
    pointer = fabricCanvas.getPointer(o.e);

    if (!pathToDraw) {
      pathToDraw = new fabric.Path(
        `M${pointer.x} ${pointer.y} L${pointer.x} ${pointer.y}`,
        {
          strokeWidth: 2,
          stroke: "#000000",
          fill: false,
          pathType: "polygon",
          padding: 6,
        }
      );
      pathToDraw.selectable = false;
      pathToDraw.evented = false;
      pathToDraw.strokeUniform = true;
      fabricCanvas.add(pathToDraw);
      return;
    }

    if (pathToDraw) {
      pathToDraw.path.push(["L", pointer.x, pointer.y]);
      updatePathDimensions(pathToDraw);
      attachControlPoints(fabricCanvas, pathToDraw);
      fabricCanvas.renderAll();
    }
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!fabricCanvas.isDrawingPathMode || !isDrawingPath) return;

    pointer = fabricCanvas.getPointer(o.e);
    updatedPath = ["L", pointer.x, pointer.y];

    if (o.e.shiftKey) {
      let lastPoint = [...pathToDraw.path].pop();
      let startX = lastPoint[1];
      let startY = lastPoint[2];
      let x2 = pointer.x - startX;
      let y2 = pointer.y - startY;
      let r = Math.sqrt(x2 * x2 + y2 * y2);
      let angle = Math.atan2(y2, x2);

      angle = parseInt(((angle * 180) / Math.PI + 7.5) / 15) * 15;
      let cosx = r * Math.cos((angle * Math.PI) / 180);
      let sinx = r * Math.sin((angle * Math.PI) / 180);
      updatedPath[1] = cosx + startX;
      updatedPath[2] = sinx + startY;
    }

    if (pathToDraw.path.length > 1) {
      let snapPoints = [...pathToDraw.path];
      snapPoints.pop();
      for (let p of snapPoints) {
        if (
          (p[0] === "L" || p[0] === "M") &&
          inRange(10, pointer.x, pointer.y, p[1], p[2])
        ) {
          updatedPath[1] = p[1];
          updatedPath[2] = p[2];
          break;
        }
      }
    }

    pathToDraw.path.pop();
    pathToDraw.path.push(updatedPath);
    updatePathDimensions(pathToDraw);
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", (o) => {
    if (!fabricCanvas.isDrawingPathMode) {
      isMouseDown = false;
      return;
    }

    isMouseDown = false;
    updatePathDimensions(pathToDraw);
    attachControlPoints(fabricCanvas, pathToDraw);
    fabricCanvas.renderAll();
  });

  const cancelDrawing = () => {
    pathToDraw.path.pop();
    if (pathToDraw.path.length > 1) {
      updatePathDimensions(pathToDraw);
      attachControlPoints(fabricCanvas, pathToDraw);

      if (!pathToDraw._hasSelectionHandler) {
        pathToDraw._hasSelectionHandler = true;

        pathToDraw.set({
          selectable: true,
          evented: true,
        });
      }
    } else {
      fabricCanvas.remove(pathToDraw);
    }
    fabricCanvas.setActiveObject(pathToDraw);
    imgEditor.setActiveTool("select");
    fabricCanvas.fire("object:modified");
    fabricCanvas.renderAll();
    pathToDraw = null;
    isDrawingPath = false;
  };

  document.addEventListener("keydown", (e) => {
    if (!isDrawingPath) return;
    const key = e.which || e.keyCode;
    if (key === 27) cancelDrawing();
  });

  document.addEventListener("mousedown", (e) => {
    if (!isDrawingPath) return;
    if (!document.querySelector(".canvas-container").contains(e.target)) {
      cancelDrawing();
    }
  });

  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    if (obj.controlPoints) {
      obj.controlPoints.forEach((point) => fabricCanvas.remove(point));
    }
  });

  fabric.Path.prototype.toJSON = (function (originalFn) {
    return function (propertiesToInclude) {
      const json = originalFn.call(this, propertiesToInclude);
      if (this.controlPoints) {
        json.controlPoints = this.controlPoints.map((point) => ({
          left: point.left,
          top: point.top,
          segmentIndex: point.segmentIndex,
          isStart: point.isStart || false,
          isMidPoint: point.isMidPoint || false,
          offsetX: point.offsetX,
          offsetY: point.offsetY,
        }));
      }
      return json;
    };
  })(fabric.Path.prototype.toJSON);
}

export {
  pathDrawing,
  inRange,
  createControlPoint,
  attachControlPoints,
  bindControlPoints,
  updateControlPoints,
  updatePathFromControlPoints,
  attachControlPointEvents,
  updatePathDimensions,
  syncPathWithControlPoints,
  applyPathScaling,
};
