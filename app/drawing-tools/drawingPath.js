/**
 * Initialize path drawing on a Fabric.js canvas with midpoint control
 * @param {fabric.Canvas} fabricCanvas - The Fabric.js canvas instance
 */
function pathDrawing(fabricCanvas) {
  let isDrawingPath = false,
    pathToDraw,
    pointer,
    updatedPath,
    isMouseDown = false,
    isDrawingCurve = false,
    rememberX,
    rememberY;

  // Helper function to check if a point is within range
  function inRange(radius, cursorX, cursorY, targetX, targetY) {
    return (
      Math.abs(cursorX - targetX) <= radius &&
      Math.abs(cursorY - targetY) <= radius
    );
  }

  // Helper function to create control points
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

  // Attach control points to path segments
  function attachControlPoints(path) {
    if (!path || !path.path || path.path.length < 2) return;

    // Clear existing control points
    if (path.controlPoints) {
      path.controlPoints.forEach((point) => fabricCanvas.remove(point));
    }
    path.controlPoints = [];

    // Add control points for each segment
    for (let i = 0; i < path.path.length - 1; i++) {
      const start = i === 0 ? path.path[0] : path.path[i];
      const end = path.path[i + 1];

      const startX = start[0] === "M" || start[0] === "L" ? start[1] : start[3];
      const startY = start[0] === "M" || start[0] === "L" ? start[2] : start[4];
      const endX = end[0] === "Q" ? end[3] : end[1];
      const endY = end[0] === "Q" ? end[4] : end[2];

      // Start point
      if (i === 0) {
        const p0 = createControlPoint(startX + -7.5, startY + -7.5, path);
        p0.segmentIndex = i;
        p0.isStart = true;
        path.controlPoints.push(p0);
        fabricCanvas.add(p0);
      }

      // End point
      const p2 = createControlPoint(endX + -7.5, endY + -7.5, path);
      p2.segmentIndex = i;
      path.controlPoints.push(p2);
      fabricCanvas.add(p2);

      // Midpoint for Q curves
      if (end[0] === "Q") {
        const midX = end[1];
        const midY = end[2];
        const p1 = createControlPoint(midX + -7.5, midY + -7.5, path, true);
        p1.segmentIndex = i;
        p1.isMidPoint = true;
        path.controlPoints.push(p1);
        fabricCanvas.add(p1);
      }
    }

    bindControlPoints(path);
    attachControlPointEvents(path);
  }

  // Bind control points to path
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

    path.off("moving").on("moving", () => updateControlPoints(path));
    path.off("rotating").on("rotating", () => updateControlPoints(path));
  }

  // Update control points position
  function updateControlPoints(path) {
    const pathTransform = path.calcTransformMatrix();

    path.controlPoints.forEach((point) => {
      if (!point.relationship) return;

      const newTransform = fabric.util.multiplyTransformMatrices(
        pathTransform,
        point.relationship
      );
      const opt = fabric.util.qrDecompose(newTransform);

      point.set({
        left: opt.translateX + point.offsetX,
        top: opt.translateY + point.offsetY,
        scaleX: 1,
        scaleY: 1,
        angle: opt.angle,
      });
      point.setCoords();
    });

    fabricCanvas.renderAll();
  }

  // Update path based on control point movement
  function updatePathFromControlPoints(path, movedPoint) {
    const segmentIndex = movedPoint.segmentIndex;
    const newX = movedPoint.left - movedPoint.offsetX;
    const newY = movedPoint.top - movedPoint.offsetY;

    if (movedPoint.isStart) {
      path.path[segmentIndex][1] = newX;
      path.path[segmentIndex][2] = newY;
    } else if (movedPoint.isMidPoint) {
      path.path[segmentIndex + 1][1] = newX;
      path.path[segmentIndex + 1][2] = newY;
    } else {
      const segment = path.path[segmentIndex + 1];
      if (segment[0] === "Q") {
        segment[3] = newX;
        segment[4] = newY;
      } else {
        segment[1] = newX;
        segment[2] = newY;
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
    fabricCanvas.renderAll();
  }

  // Attach events to control points
  function attachControlPointEvents(path) {
    path.controlPoints.forEach((point) => {
      point.on("moving", () => {
        updatePathFromControlPoints(path, point);
        bindControlPoints(path);
      });

      point.on("selected", () => {
        path.controlPoints.forEach((p) =>
          p.set({ visible: true }).bringToFront()
        );
        fabricCanvas.renderAll();
      });

      point.on("deselected", () => {
        path.controlPoints.forEach(
          (p) => !p.selected && p.set({ visible: false })
        );
        fabricCanvas.renderAll();
      });
    });

    path.on("selected", () => {
      updateControlPoints(path);
      path.controlPoints.forEach((p) =>
        p.set({ visible: true }).bringToFront()
      );
      fabricCanvas.renderAll();
    });

    path.on("deselected", () => {
      path.controlPoints.forEach(
        (p) => !p.selected && p.set({ visible: false })
      );
      fabricCanvas.renderAll();
    });
  }

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
          // 빛나는 효과 추가
          shadow: new fabric.Shadow({
            color: "rgb(255, 255, 255)",
            blur: 15,
            offsetX: 0,
            offsetY: 0,
            affectStroke: true, // 선에 그림자 효과 적용
          }),
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
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
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
      pathToDraw.setCoords();
      attachControlPoints(pathToDraw);
      fabricCanvas.renderAll();
    }
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!fabricCanvas.isDrawingPathMode || !isDrawingPath) return;

    pointer = fabricCanvas.getPointer(o.e);

    if (!isDrawingCurve) {
      updatedPath = ["L", pointer.x, pointer.y];
    }

    pathToDraw.path.pop();

    if (o.e.shiftKey && !isDrawingCurve) {
      let lastPoint = [...pathToDraw.path].pop();
      let startX = lastPoint[1];
      let startY = lastPoint[2];
      let x2 = pointer.x - startX;
      let y2 = pointer.y - startY;
      let r = Math.sqrt(x2 * x2 + y2 * y2);
      let angle = Math.atan2(y2);

      angle = parseInt(((angle + 7.5) % 360) / 15) * 15;
      let cosx = r * Math.cos((angle * Math.PI) / 180);
      let sinx = r * Math.sin((angle * Math.PI) / 180);
      updatedPath[1] = cosx + startX;
      updatedPath[2] = sinx + startY;
    }

    if (pathToDraw.path.length > 1 && !isDrawingCurve) {
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
        if (p[0] === "Q" && inRange(10, pointer.x, pointer.y, p[3], p[4])) {
          updatedPath[1] = p[3];
          updatedPath[2] = p[4];
          break;
        }
      }
    }

    if (isMouseDown && pathToDraw.path.length > 1) {
      if (!isDrawingCurve) {
        isDrawingCurve = true;
        let lastPath = pathToDraw.path.pop();
        if (lastPath[0] === "Q") {
          updatedPath = [
            "Q",
            lastPath[3],
            lastPath[4],
            lastPath[3],
            lastPath[4],
          ];
          rememberX = lastPath[3];
          rememberY = lastPath[4];
        } else {
          updatedPath = [
            "Q",
            lastPath[1],
            lastPath[2],
            lastPath[1],
            lastPath[2],
          ];
          rememberX = lastPath[1];
          rememberY = lastPath[2];
        }
      } else if (isDrawingCurve) {
        let mouseMoveX = pointer.x - updatedPath[3];
        let mouseMoveY = pointer.y - updatedPath[4];
        updatedPath = [
          "Q",
          rememberX - mouseMoveX,
          rememberY - mouseMoveY,
          rememberX,
          rememberY,
        ];
      }
    }

    pathToDraw.path.push(updatedPath);
    let dims = pathToDraw._calcDimensions();
    pathToDraw.set({
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
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", (o) => {
    if (!fabricCanvas.isDrawingPathMode) {
      isMouseDown = false;
      isDrawingCurve = false;
      return;
    }

    isMouseDown = false;

    if (isDrawingCurve) {
      pointer = fabricCanvas.getPointer(o.e);
      pathToDraw.path.push(["L", pointer.x, pointer.y]);
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
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
      pathToDraw.setCoords();
      attachControlPoints(pathToDraw);
      fabricCanvas.renderAll();
    }

    isDrawingCurve = false;
  });

  const cancelDrawing = () => {
    pathToDraw.path.pop();
    if (pathToDraw.path.length > 1) {
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
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
      attachControlPoints(pathToDraw);
    } else {
      fabricCanvas.remove(pathToDraw);
    }

    fabricCanvas.renderAll();
    fabricCanvas.fire("object:modified");

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

  // Clean up control points when path is removed
  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    if (obj.controlPoints) {
      obj.controlPoints.forEach((point) => fabricCanvas.remove(point));
    }
  });
}

export { pathDrawing };
