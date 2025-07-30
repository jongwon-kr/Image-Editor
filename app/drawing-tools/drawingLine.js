// @ts-nocheck
import { imgEditor } from "../index.ts";
import { updateScaleControlPoints } from "../utils/utils.js";

let isScale = false;
let isControl = false;

function createControlPoint(left, top, line, isMidPoint = false) {
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
    parentLine: line,
    offsetX: -7.5,
    offsetY: -7.5,
  });
}

function updateLine(line, canvas) {
  line.setCoords();
  line.dirty = true;
  canvas.renderAll();
}

function setLineDimensions(line) {
  const dims = line._calcDimensions();
  line
    .set({
      width: dims.width,
      height: dims.height,
      left: dims.left,
      top: dims.top,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top,
      },
      dirty: true,
    })
    .setCoords();
}

function calculateStraightLine(startX, startY, endX, endY) {
  const x2 = endX - startX;
  const y2 = endY - startY;
  const r = Math.sqrt(x2 * x2 + y2 * y2);
  const angle =
    Math.round((((Math.atan2(y2, x2) / Math.PI) * 180 + 7.5) % 360) / 15) * 15;
  const cosx = r * Math.cos((angle * Math.PI) / 180);
  const sinx = r * Math.sin((angle * Math.PI) / 180);
  return [
    ["M", startX, startY],
    ["L", cosx + startX, sinx + startY],
  ];
}

function calculateCurvedLine(startX, startY, endX, endY) {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  return [
    ["M", startX, startY],
    ["Q", midX, midY, endX, endY],
  ];
}

function getEndPoint(path) {
  return path[1][0] === "Q"
    ? { x: path[1][3], y: path[1][4] }
    : { x: path[1][1], y: path[1][2] };
}

function bindControlPoints(line, controlPoints) {
  // line 객체 유효성 확인
  if (!line || !(line instanceof fabric.Object)) {
    console.error("Invalid line object:", line);
    return;
  }

  const lineTransform = line.calcTransformMatrix();
  const invertedLineTransform = fabric.util.invertTransform(lineTransform);

  controlPoints.forEach((point) => {
    if (!point || !(point instanceof fabric.Circle)) {
      console.warn("Invalid control point:", point);
      return;
    }
    const pointTransform = point.calcTransformMatrix();
    point.relationship = fabric.util.multiplyTransformMatrices(
      invertedLineTransform,
      pointTransform
    );
  });

  // 이벤트 바인딩 전 line 객체가 캔버스에 추가되었는지 확인
  if (line.canvas) {
    line.off("moving");
    line.on("moving", () => updateControlPoints(line));
  } else {
    console.warn("Line is not added to canvas, skipping event binding:", line);
  }
}

function updateControlPoints(line) {
  const controlPoints = [line.p0, line.p2, line.p1].filter(Boolean);
  const lineTransform = line.calcTransformMatrix();
  const zoom = imgEditor.canvas.getZoom();
  controlPoints.forEach((point) => {
    if (!point.relationship) return;

    const newTransform = fabric.util.multiplyTransformMatrices(
      lineTransform,
      point.relationship
    );
    const opt = fabric.util.qrDecompose(newTransform);

    point.set({
      left: opt.translateX + point.offsetX / zoom,
      top: opt.translateY + point.offsetY / zoom,
    });
    point.setCoords();
  });

  line._lastLeft = line.left;
  line._lastTop = line.top;
}

function updateControlPointsAndPath(line) {
  const controlPoints = [line.p0, line.p2, line.p1].filter(Boolean);
  const lineTransform = line.calcTransformMatrix();

  controlPoints.forEach((point) => {
    if (!point.relationship) return;

    const newTransform = fabric.util.multiplyTransformMatrices(
      lineTransform,
      point.relationship
    );
    const opt = fabric.util.qrDecompose(newTransform);

    point.set({
      left: opt.translateX,
      top: opt.translateY,
    });
    point.setCoords();
  });

  updatePathFromControlPoints(line);
  line._lastLeft = line.left;
  line._lastTop = line.top;

  line.canvas.renderAll();
}

function updatePathFromControlPoints(line) {
  const p0 = line.p0;
  const p2 = line.p2;
  const p1 = line.p1;

  const startX = p0.left - p0.offsetX;
  const startY = p0.top - p0.offsetY;
  const endX = p2.left - p2.offsetX;
  const endY = p2.top - p2.offsetY;

  if (p1) {
    const midX = p1.left - p1.offsetX;
    const midY = p1.top - p1.offsetY;
    line.path = [
      ["M", startX, startY],
      ["Q", midX, midY, endX, endY],
    ];
  } else {
    line.path = [
      ["M", startX, startY],
      ["L", endX, endY],
    ];
  }
  setLineDimensions(line);
  line.set({ scaleX: 1, scaleY: 1 });
}

function attachControlPointEvents(fabricCanvas, line, p0, p2, p1) {
  isControl = false;

  // 항상 최신 제어점 참조
  const getCP = () => ({ p0: line.p0, p1: line.p1, p2: line.p2 });

  // --- Point(제어점) 이벤트 ---
  [p0, p2, p1].filter(Boolean).forEach((point) => {
    point.on("moving", function () {
      isControl = true;
      updatePathFromControlPoints(line);
      updateLine(line, fabricCanvas);
      bindControlPoints(line, [line.p0, line.p2, line.p1].filter(Boolean));
    });

    point.on("selected", () => {
      Object.values(getCP()).forEach((p) => {
        p?.set({ visible: true });
        fabricCanvas.bringObjectToFront(p);
      });
      fabricCanvas.renderAll();
    });

    point.on("deselected", () => {
      Object.values(getCP()).forEach(
        (p) => !p?.selected && p?.set({ visible: false })
      );
      fabricCanvas.renderAll();
    });

    point.on("mouseup", () => {
      fabricCanvas.setActiveObject(line);
      fabricCanvas.renderAll();
    });
  });

  line.on("selected", () => {
    const controlPoints = getCP();
    if (
      fabricCanvas.getActiveObjects().filter((obj) => !obj.isControlPoint)
        .length > 1
    ) {
      Object.values(controlPoints).forEach((point) => {
        point.set({ visible: false });
      });
    } else {
      if (line.scaleX !== 1 || line.scaleY !== 1) {
        let pathMinX = Infinity,
          pathMaxX = -Infinity,
          pathMinY = Infinity,
          pathMaxY = -Infinity;
        line.path.forEach((seg) => {
          if (seg[0] === "M" || seg[0] === "L") {
            pathMinX = Math.min(pathMinX, seg[1]);
            pathMaxX = Math.max(pathMaxX, seg[1]);
            pathMinY = Math.min(pathMinY, seg[2]);
            pathMaxY = Math.max(pathMaxY, seg[2]);
          } else if (seg[0] === "Q") {
            pathMinX = Math.min(pathMinX, seg[1], seg[3]);
            pathMaxX = Math.max(pathMaxX, seg[1], seg[3]);
            pathMinY = Math.min(pathMinY, seg[2], seg[4]);
            pathMaxY = Math.max(pathMaxY, seg[2], seg[4]);
          }
        });
        const pathWidth = pathMaxX - pathMinX;
        const pathHeight = pathMaxY - pathMinY;

        const scaleX = line.scaleX || 1;
        const scaleY = line.scaleY || 1;
        const oCoords = line.oCoords || {};
        const minX = oCoords.tl ? oCoords.tl.x : line.left || 0;
        const minY = oCoords.tl ? oCoords.tl.y : line.top || 0;
        const maxX = oCoords.br ? oCoords.br.x : line.left || 0;
        const maxY = oCoords.br ? oCoords.br.y : line.top || 0;
        const oCoordsWidth = maxX - minX;
        const oCoordsHeight = maxY - minY;

        let adjustedScaleX = scaleX;
        let adjustedScaleY = scaleY;
        if (
          oCoordsWidth > 0 &&
          oCoordsHeight > 0 &&
          pathWidth > 0 &&
          pathHeight > 0
        ) {
          if (pathWidth * scaleX > oCoordsWidth) {
            adjustedScaleX = oCoordsWidth / pathWidth;
          }
          if (pathHeight * scaleY > oCoordsHeight) {
            adjustedScaleY = oCoordsHeight / pathHeight;
          }
        }
        adjustedScaleX = Math.max(0.01, adjustedScaleX);
        adjustedScaleY = Math.max(0.01, adjustedScaleY);

        const pathLeftOffset = minX + (line.padding || 0);
        const pathTopOffset = minY + (line.padding || 0);

        line.path.forEach((seg) => {
          if (seg[0] === "M" || seg[0] === "L") {
            seg[1] = (seg[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
            seg[2] = (seg[2] - pathMinY) * adjustedScaleY + pathTopOffset;
          } else if (seg[0] === "Q") {
            seg[1] = (seg[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
            seg[2] = (seg[2] - pathMinY) * adjustedScaleY + pathTopOffset;
            seg[3] = (seg[3] - pathMinX) * adjustedScaleX + pathLeftOffset;
            seg[4] = (seg[4] - pathMinY) * adjustedScaleY + pathTopOffset;
          }
        });
        line.set({
          scaleX: 1,
          scaleY: 1,
          left: pathLeftOffset,
          top: pathTopOffset,
        });
        setLineDimensions(line);

        const startPoint = { x: line.path[0][1], y: line.path[0][2] };
        const endPoint = getEndPoint(line.path);
        const midPoint =
          line.path[1][0] === "Q"
            ? { x: line.path[1][1], y: line.path[1][2] }
            : null;
        attachControlPoints(
          fabricCanvas,
          line,
          startPoint,
          endPoint,
          midPoint,
          -(line.padding || 0),
          -(line.padding || 0)
        );
      }

      if (!isControl) {
        updateControlPoints(line);
        fabricCanvas.renderAll();
      }
      Object.values(getCP()).forEach((p) => {
        p?.set({ visible: true });
        fabricCanvas.bringObjectToFront(p);
      });
      isControl = false;
    }
    fabricCanvas.renderAll();
  });

  line.on("deselected", () => {
    Object.values(getCP()).forEach(
      (p) => !p?.selected && p?.set({ visible: false })
    );
    fabricCanvas.renderAll();
  });

  line._lastLeft = line.left;
  line._lastTop = line.top;

  line.on("moving", (e) => {
    if (!e.transform || !e.transform.target) {
      console.warn("e.transform data is incomplete in line moving event", e);
      return;
    }
    line._lastLeft = e.transform.target.left;
    line._lastTop = e.transform.target.top;
    line.left = line._lastLeft;
    line.top = line._lastTop;
  });

  line.on("scaling", function () {
    isScale = true;
    Object.values(getCP()).forEach(
      (point) => point && point.set({ visible: false })
    );
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", () => {
    if (isScale) {
      isScale = false;
      if (fabricCanvas.getActiveObjects().length === 1) {
        const temp = fabricCanvas.getActiveObjects()[0];
        fabricCanvas.discardActiveObject();
        fabricCanvas.setActiveObject(temp);

        if (temp && temp.path) {
          const startPoint = { x: temp.path[0][1], y: temp.path[0][2] };
          const endPoint = getEndPoint(temp.path);
          const midPoint =
            temp.path[1][0] === "Q"
              ? { x: temp.path[1][1], y: temp.path[1][2] }
              : null;
          attachControlPoints(
            fabricCanvas,
            temp,
            startPoint,
            endPoint,
            midPoint
          );

          [temp.p0, temp.p2, temp.p1].forEach((p) => {
            p?.set({ visible: true });
            fabricCanvas.bringObjectToFront(p);
          });
          fabricCanvas.renderAll();
        }
      }
    }
  });
}

function attachControlPoints(
  fabricCanvas,
  line,
  startPoint,
  endPoint,
  midPoint,
  moveLeft,
  moveTop
) {
  // line 객체 유효성 확인
  if (!line || !(line instanceof fabric.Path)) {
    console.error("Invalid line object for attachControlPoints:", line);
    return;
  }

  if (line.p0) fabricCanvas.remove(line.p0);
  if (line.p2) fabricCanvas.remove(line.p2);
  if (line.p1) fabricCanvas.remove(line.p1);

  moveLeft = moveLeft || 0;
  moveTop = moveTop || 0;

  const baseLeft = line.left;
  const baseTop = line.top;

  let p0Left = startPoint.x - 7.5;
  let p0Top = startPoint.y - 7.5;
  if (
    Math.round(p0Left) !== Math.round(baseLeft) ||
    Math.round(p0Top) !== Math.round(baseTop)
  ) {
    p0Left += moveLeft;
    p0Top += moveTop;
  }
  const p0 = createControlPoint(p0Left, p0Top, line);
  p0.name = "p0";

  let p2Left = endPoint.x - 7.5;
  let p2Top = endPoint.y - 7.5;
  if (
    Math.round(p2Left) !== Math.round(baseLeft) ||
    Math.round(p2Top) !== Math.round(baseTop)
  ) {
    p2Left += moveLeft;
    p2Top += moveTop;
  }
  const p2 = createControlPoint(p2Left, p2Top, line);
  p2.name = "p2";

  let p1 = null;
  if (midPoint) {
    let p1Left = midPoint.x - 7.5;
    let p1Top = midPoint.y - 7.5;
    if (
      Math.round(p1Left) !== Math.round(baseLeft) ||
      Math.round(p1Top) !== Math.round(baseTop)
    ) {
      p1Left += moveLeft;
      p1Top += moveTop;
    }
    p1 = createControlPoint(p1Left, p1Top, line, true);
    p1.name = "p1";
  }

  line.p0 = p0;
  line.p2 = p2;
  line.p1 = p1;

  // 캔버스에 제어점 추가 전 캔버스 유효성 확인
  if (!fabricCanvas) {
    console.error("Invalid fabricCanvas:", fabricCanvas);
    return;
  }

  fabricCanvas.add(p0, p2);
  if (p1) fabricCanvas.add(p1);

  bindControlPoints(line, [p0, p2, p1].filter(Boolean));
  attachControlPointEvents(fabricCanvas, line, p0, p2, p1);
  updateScaleControlPoints(fabricCanvas);
}

function lineDrawing(fabricCanvas) {
  let isDrawingLine = false;
  let lineToDraw = null;
  let pointerPoints;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingLineMode) return;

    isDrawingLine = true;
    const pointer = fabricCanvas.getPointer(o.e);
    pointerPoints = [pointer.x, pointer.y, pointer.x, pointer.y];

    lineToDraw = new fabric.Path(
      [
        ["M", pointerPoints[0], pointerPoints[1]],
        ["L", pointerPoints[2], pointerPoints[3]],
      ],
      {
        padding: 6,
        strokeWidth: 2,
        stroke: "#000000",
        strokeUniform: true,
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
        isControlPoint: false,
        pathType: "line",
      }
    );
    fabricCanvas.add(lineToDraw);
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!isDrawingLine || !lineToDraw) return;

    const pointer = fabricCanvas.getPointer(o.e);
    const [startX, startY] = pointerPoints;

    lineToDraw.path = o.e.shiftKey
      ? calculateStraightLine(startX, startY, pointer.x, pointer.y)
      : calculateCurvedLine(startX, startY, pointer.x, pointer.y);

    updateLine(lineToDraw, fabricCanvas);
  });

  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingLine || !lineToDraw) return;

    isDrawingLine = false;
    setLineDimensions(lineToDraw);

    const startPoint = { x: lineToDraw.path[0][1], y: lineToDraw.path[0][2] };
    const endPoint = getEndPoint(lineToDraw.path);
    const midPoint =
      lineToDraw.path[1][0] === "Q"
        ? { x: lineToDraw.path[1][1], y: lineToDraw.path[1][2] }
        : null;

    attachControlPoints(
      fabricCanvas,
      lineToDraw,
      startPoint,
      endPoint,
      midPoint
    );
    lineToDraw.selectable = true;
    lineToDraw.evented = true;
    fabricCanvas.setActiveObject(lineToDraw);
    imgEditor.setActiveTool("select");
    fabricCanvas.fire("object:modified");
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    [obj.p0, obj.p2, obj.p1].forEach(
      (point) => point && fabricCanvas.remove(point)
    );
  });

  fabricCanvas.on("mouse:down", (o) => {
    if (isDrawingLine) return;
    const target = fabricCanvas.findTarget(o.e, false);
    if (target && !target.isControlPoint) fabricCanvas.renderAll();
  });

  fabric.Path.prototype.toJSON = (function (originalFn) {
    return function (propertiesToInclude) {
      const json = originalFn.call(this, propertiesToInclude);
      if (this.p0)
        json.p0 = { left: this.p0.left, top: this.p0.top, name: this.p0.name };
      if (this.p1)
        json.p1 = { left: this.p1.left, top: this.p1.top, name: this.p1.name };
      if (this.p2)
        json.p2 = { left: this.p2.left, top: this.p2.top, name: this.p2.name };
      return json;
    };
  })(fabric.Path.prototype.toJSON);
}

export {
  lineDrawing,
  attachControlPoints,
  createControlPoint,
  updateLine,
  setLineDimensions,
  calculateStraightLine,
  calculateCurvedLine,
  getEndPoint,
  bindControlPoints,
  updateControlPoints,
  updateControlPointsAndPath,
  updatePathFromControlPoints,
  attachControlPointEvents,
};
