// @ts-nocheck
import { imgEditor } from "../index.ts";
import { bringToFront, updateScaleControlPoints } from "../utils/utils.js";

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
  const dims = line._calcDimensions() || {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  };
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

function calculateStraightLineWithArrowHeads(
  startX,
  startY,
  endX,
  endY,
  startHead = true,
  endHead = true,
  strokeWidth = 8
) {
  const finalX = endX;
  const finalY = endY;

  const arrowSize = 20; // Length of triangle side
  const arrowAngle = Math.atan2(endY - startY, endX - startX);

  // Calculate equilateral triangle for start arrowhead
  const startArrowPoints = startHead
    ? [
        [
          startX + arrowSize * Math.cos(arrowAngle - Math.PI / 6),
          startY + arrowSize * Math.sin(arrowAngle - Math.PI / 6),
        ],
        [
          startX + arrowSize * Math.cos(arrowAngle + Math.PI / 6),
          startY + arrowSize * Math.sin(arrowAngle + Math.PI / 6),
        ],
        [startX, startY], // Tip of arrow
      ]
    : [];

  // Calculate equilateral triangle for end arrowhead
  const endArrowPoints = endHead
    ? [
        [
          finalX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
          finalY - arrowSize * Math.sin(arrowAngle - Math.PI / 6),
        ],
        [
          finalX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
          finalY - arrowSize * Math.sin(arrowAngle + Math.PI / 6),
        ],
        [finalX, finalY], // Tip of arrow
      ]
    : [];

  const path = [];

  // Calculate number of internal lines based on strokeWidth for denser fill
  const lineCount = Math.max(5, Math.ceil(arrowSize / (strokeWidth * 0.3)));

  // Start arrowhead (triangle outline without strokeDashArray)
  if (startHead) {
    path.push(
      ["M", startArrowPoints[0][0], startArrowPoints[0][1]],
      ["L", startArrowPoints[1][0], startArrowPoints[1][1]],
      ["L", startArrowPoints[2][0], startArrowPoints[2][1]],
      ["Z"] // Close path for triangle outline
    );
    // Add internal lines for visual fill effect (apply strokeDashArray)
    for (let i = 1; i <= lineCount; i++) {
      const t = i / (lineCount + 1);
      const x1 =
        startArrowPoints[0][0] +
        t * (startArrowPoints[1][0] - startArrowPoints[0][0]);
      const y1 =
        startArrowPoints[0][1] +
        t * (startArrowPoints[1][1] - startArrowPoints[0][1]);
      const x2 =
        startArrowPoints[2][0] +
        t * (startArrowPoints[1][0] - startArrowPoints[2][0]);
      const y2 =
        startArrowPoints[2][1] +
        t * (startArrowPoints[1][1] - startArrowPoints[2][1]);
      path.push(["M", x1, y1], ["L", x2, y2]);
    }
  }

  // Main line (apply strokeDashArray)
  path.push(["M", startX, startY], ["L", finalX, finalY]);

  // End arrowhead (triangle outline without strokeDashArray)
  if (endHead) {
    path.push(
      ["M", endArrowPoints[0][0], endArrowPoints[0][1]],
      ["L", endArrowPoints[1][0], endArrowPoints[1][1]],
      ["L", endArrowPoints[2][0], endArrowPoints[2][1]],
      ["Z"] // Close path for triangle outline
    );
    // Add internal lines for visual fill effect (apply strokeDashArray)
    for (let i = 1; i <= lineCount; i++) {
      const t = i / (lineCount + 1);
      const x1 =
        endArrowPoints[0][0] +
        t * (endArrowPoints[1][0] - endArrowPoints[0][0]);
      const y1 =
        endArrowPoints[0][1] +
        t * (endArrowPoints[1][1] - endArrowPoints[0][1]);
      const x2 =
        endArrowPoints[2][0] +
        t * (endArrowPoints[1][0] - endArrowPoints[2][0]);
      const y2 =
        endArrowPoints[2][1] +
        t * (endArrowPoints[1][1] - endArrowPoints[2][1]);
      path.push(["M", x1, y1], ["L", x2, y2]);
    }
  }

  return path;
}

function calculateCurvedLineWithArrowHeads(
  startX,
  startY,
  endX,
  endY,
  startHead = true,
  endHead = true,
  strokeWidth = 8
) {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const startAngle = Math.atan2(midY - startY, midX - startX);
  const endAngle = Math.atan2(endY - midY, endX - midX);
  const arrowSize = 20; // Length of triangle side

  // Calculate equilateral triangle for start arrowhead
  const startArrowPoints = startHead
    ? [
        [
          startX + arrowSize * Math.cos(startAngle - Math.PI / 6),
          startY + arrowSize * Math.sin(startAngle - Math.PI / 6),
        ],
        [
          startX + arrowSize * Math.cos(startAngle + Math.PI / 6),
          startY + arrowSize * Math.sin(startAngle + Math.PI / 6),
        ],
        [startX, startY], // Tip of arrow
      ]
    : [];

  // Calculate equilateral triangle for end arrowhead
  const endArrowPoints = endHead
    ? [
        [
          endX - arrowSize * Math.cos(endAngle - Math.PI / 6),
          endY - arrowSize * Math.sin(endAngle - Math.PI / 6),
        ],
        [
          endX - arrowSize * Math.cos(endAngle + Math.PI / 6),
          endY - arrowSize * Math.sin(endAngle + Math.PI / 6),
        ],
        [endX, endY], // Tip of arrow
      ]
    : [];

  const path = [];

  // Calculate number of internal lines based on strokeWidth for denser fill
  const lineCount = Math.max(5, Math.ceil(arrowSize / (strokeWidth * 0.3)));

  // Start arrowhead (triangle outline without strokeDashArray)
  if (startHead) {
    path.push(
      ["M", startArrowPoints[0][0], startArrowPoints[0][1]],
      ["L", startArrowPoints[1][0], startArrowPoints[1][1]],
      ["L", startArrowPoints[2][0], startArrowPoints[2][1]],
      ["Z"] // Close path for triangle outline
    );
    // Add internal lines for visual fill effect (apply strokeDashArray)
    for (let i = 1; i <= lineCount; i++) {
      const t = i / (lineCount + 1);
      const x1 =
        startArrowPoints[0][0] +
        t * (startArrowPoints[1][0] - startArrowPoints[0][0]);
      const y1 =
        startArrowPoints[0][1] +
        t * (startArrowPoints[1][1] - startArrowPoints[0][1]);
      const x2 =
        startArrowPoints[2][0] +
        t * (startArrowPoints[1][0] - startArrowPoints[2][0]);
      const y2 =
        startArrowPoints[2][1] +
        t * (startArrowPoints[1][1] - startArrowPoints[2][1]);
      path.push(["M", x1, y1], ["L", x2, y2]);
    }
  }

  // Curved line (apply strokeDashArray)
  path.push(["M", startX, startY], ["Q", midX, midY, endX, endY]);

  // End arrowhead (triangle outline without strokeDashArray)
  if (endHead) {
    path.push(
      ["M", endArrowPoints[0][0], endArrowPoints[0][1]],
      ["L", endArrowPoints[1][0], endArrowPoints[1][1]],
      ["L", endArrowPoints[2][0], endArrowPoints[2][1]],
      ["Z"] // Close path for triangle outline
    );
    // Add internal lines for visual fill effect (apply strokeDashArray)
    for (let i = 1; i <= lineCount; i++) {
      const t = i / (lineCount + 1);
      const x1 =
        endArrowPoints[0][0] +
        t * (endArrowPoints[1][0] - endArrowPoints[0][0]);
      const y1 =
        endArrowPoints[0][1] +
        t * (endArrowPoints[1][1] - endArrowPoints[0][1]);
      const x2 =
        endArrowPoints[2][0] +
        t * (endArrowPoints[1][0] - endArrowPoints[2][0]);
      const y2 =
        endArrowPoints[2][1] +
        t * (endArrowPoints[1][1] - endArrowPoints[2][1]);
      path.push(["M", x1, y1], ["L", x2, y2]);
    }
  }

  return path;
}

function getEndPoint(path) {
  return { x: path[path.length - 20][1], y: path[path.length - 20][2] };
}

function bindControlPoints(line, controlPoints) {
  const lineTransform = line.calcTransformMatrix();
  const invertedLineTransform = fabric.util.invertTransform(lineTransform);

  controlPoints.forEach((point) => {
    const pointTransform = point.calcTransformMatrix();
    point.relationship = fabric.util.multiplyTransformMatrices(
      invertedLineTransform,
      pointTransform
    );
  });

  line.off("moving");
  line.on("moving", () => updateControlPoints(line));
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
  const strokeWidth = line.strokeWidth || 8;

  const startX = p0.left - p0.offsetX;
  const startY = p0.top - p0.offsetY;
  const endX = p2.left - p2.offsetX;
  const endY = p2.top - p2.offsetY;

  if (p1) {
    const midX = p1.left - p1.offsetX;
    const midY = p1.top - p1.offsetY;

    const startAngle = Math.atan2(midY - startY, midX - startX);
    const endAngle = Math.atan2(endY - midY, endX - midX);
    const arrowSize = 20;

    const startArrowPoints = line.startHead
      ? [
          [
            startX + arrowSize * Math.cos(startAngle - Math.PI / 6),
            startY + arrowSize * Math.sin(startAngle - Math.PI / 6),
          ],
          [
            startX + arrowSize * Math.cos(startAngle + Math.PI / 6),
            startY + arrowSize * Math.sin(startAngle + Math.PI / 6),
          ],
          [startX, startY],
        ]
      : [];

    const endArrowPoints = line.endHead
      ? [
          [
            endX - arrowSize * Math.cos(endAngle - Math.PI / 6),
            endY - arrowSize * Math.sin(endAngle - Math.PI / 6),
          ],
          [
            endX - arrowSize * Math.cos(endAngle + Math.PI / 6),
            endY - arrowSize * Math.sin(endAngle + Math.PI / 6),
          ],
          [endX, endY],
        ]
      : [];

    const path = [];

    // Calculate number of internal lines based on strokeWidth for denser fill
    const lineCount = Math.max(5, Math.ceil(arrowSize / (strokeWidth * 0.3)));

    if (line.startHead) {
      path.push(
        ["M", startArrowPoints[0][0], startArrowPoints[0][1]],
        ["L", startArrowPoints[1][0], startArrowPoints[1][1]],
        ["L", startArrowPoints[2][0], startArrowPoints[2][1]],
        ["Z"]
      );
      // Add internal lines for visual fill effect (apply strokeDashArray)
      for (let i = 1; i <= lineCount; i++) {
        const t = i / (lineCount + 1);
        const x1 =
          startArrowPoints[0][0] +
          t * (startArrowPoints[1][0] - startArrowPoints[0][0]);
        const y1 =
          startArrowPoints[0][1] +
          t * (startArrowPoints[1][1] - startArrowPoints[0][1]);
        const x2 =
          startArrowPoints[2][0] +
          t * (startArrowPoints[1][0] - startArrowPoints[2][0]);
        const y2 =
          startArrowPoints[2][1] +
          t * (startArrowPoints[1][1] - startArrowPoints[2][1]);
        path.push(["M", x1, y1], ["L", x2, y2]);
      }
    }

    path.push(["M", startX, startY], ["Q", midX, midY, endX, endY]);

    if (line.endHead) {
      path.push(
        ["M", endArrowPoints[0][0], endArrowPoints[0][1]],
        ["L", endArrowPoints[1][0], endArrowPoints[1][1]],
        ["L", endArrowPoints[2][0], endArrowPoints[2][1]],
        ["Z"]
      );
      // Add internal lines for visual fill effect (apply strokeDashArray)
      for (let i = 1; i <= lineCount; i++) {
        const t = i / (lineCount + 1);
        const x1 =
          endArrowPoints[0][0] +
          t * (endArrowPoints[1][0] - endArrowPoints[0][0]);
        const y1 =
          endArrowPoints[0][1] +
          t * (endArrowPoints[1][1] - endArrowPoints[0][1]);
        const x2 =
          endArrowPoints[2][0] +
          t * (endArrowPoints[1][0] - endArrowPoints[2][0]);
        const y2 =
          endArrowPoints[2][1] +
          t * (endArrowPoints[1][1] - endArrowPoints[2][1]);
        path.push(["M", x1, y1], ["L", x2, y2]);
      }
    }

    line.path = path;
  } else {
    line.path = calculateStraightLineWithArrowHeads(
      startX,
      startY,
      endX,
      endY,
      line.startHead,
      line.endHead,
      strokeWidth
    );
  }

  setLineDimensions(line);
  line.set({ scaleX: 1, scaleY: 1 });
}

function attachControlPointEvents(fabricCanvas, line, p0, p2, p1) {
  let isControl = false;
  const getCP = () => ({ p0: line.p0, p1: line.p1, p2: line.p2 });

  Object.entries({ p0, p2, p1 }).forEach(([key, point]) => {
    if (!point) return;

    point.on("moving", function () {
      isControl = true;
      updatePathFromControlPoints(line);
      updateLine(line, fabricCanvas);
      bindControlPoints(line, [p0, p2, p1].filter(Boolean));
    });

    point.on("selected", () => {
      Object.values({ p0, p2, p1 }).forEach((p) => {
        p?.set({ visible: true });
        bringToFront(p, fabricCanvas);
      });
      fabricCanvas.renderAll();
    });

    point.on("deselected", () => {
      Object.values({ p0, p2, p1 }).forEach(
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

        let midPoint = null;
        const qIndex = line.path.findIndex((seg) => seg[0] === "Q");
        if (qIndex !== -1) {
          midPoint = { x: line.path[qIndex][1], y: line.path[qIndex][2] };
        } else {
          midPoint = {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2,
          };
        }

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
        bringToFront(p, fabricCanvas);
      });
      isControl = false;
    }
    fabricCanvas.renderAll();
  });

  line.on("deselected", () => {
    Object.values(getCP()).forEach((point) => {
      if (!point.selected) {
        point.set({ visible: false });
      }
    });
    fabricCanvas.renderAll();
  });

  line.on("scaling", function () {
    isControl = true;
    Object.values(getCP()).forEach(
      (point) => point && point.set({ visible: false })
    );
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", () => {
    if (isControl) {
      isControl = false;
      if (fabricCanvas.getActiveObjects().length === 1) {
        const temp = fabricCanvas.getActiveObjects()[0];
        fabricCanvas.discardActiveObject();
        fabricCanvas.setActiveObject(temp);

        if (temp && temp.path) {
          const startPoint = { x: temp.path[0][1], y: temp.path[0][2] };
          const endPoint = getEndPoint(temp.path);

          let midPoint = null;
          const qIndex = temp.path.findIndex((seg) => seg[0] === "Q");
          if (qIndex !== -1) {
            midPoint = { x: temp.path[qIndex][1], y: temp.path[qIndex][2] };
          } else {
            midPoint = {
              x: (startPoint.x + endPoint.x) / 2,
              y: (startPoint.y + endPoint.y) / 2,
            };
          }

          attachControlPoints(
            fabricCanvas,
            temp,
            startPoint,
            endPoint,
            midPoint,
            -(temp.padding || 0),
            -(temp.padding || 0)
          );

          [temp.p0, temp.p2, temp.p1].forEach((p) => {
            p?.set({ visible: true });
            bringToFront(p, fabricCanvas);
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
  if (line.p0) fabricCanvas.remove(line.p0);
  if (line.p2) fabricCanvas.remove(line.p2);
  if (line.p1) fabricCanvas.remove(line.p1);

  if (!moveLeft) {
    moveLeft = 0;
  }

  if (!moveTop) {
    moveTop = 0;
  }

  const p0 = createControlPoint(
    startPoint.x - 7.5 + moveLeft,
    startPoint.y - 7.5 + moveTop,
    line
  );
  p0.name = "p0";
  const p2 = createControlPoint(
    endPoint.x - 7.5 + moveLeft,
    endPoint.y - 7.5 + moveTop,
    line
  );
  p2.name = "p2";
  const p1 = midPoint
    ? createControlPoint(
        midPoint.x - 7.5 + moveLeft,
        midPoint.y - 7.5 + moveTop,
        line,
        true
      )
    : null;
  if (p1) p1.name = "p1";

  line.p0 = p0;
  line.p2 = p2;
  line.p1 = p1;

  fabricCanvas.add(p0, p2);
  if (p1) fabricCanvas.add(p1);

  bindControlPoints(line, [p0, p2, p1].filter(Boolean));
  attachControlPointEvents(fabricCanvas, line, p0, p2, p1);
  updateScaleControlPoints(fabricCanvas);
}

function arrowDrawing(fabricCanvas) {
  let isDrawingArrow = false;
  let lineToDraw = null;
  let pointerPoints;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingArrowMode) return;

    isDrawingArrow = true;
    const pointer = fabricCanvas.getPointer(o.e);
    pointerPoints = [pointer.x, pointer.y, pointer.x, pointer.y];

    // 초기 경로를 곡선으로 설정
    const midX = pointer.x;
    const midY = pointer.y;
    lineToDraw = new fabric.Path(
      [
        ["M", pointerPoints[0], pointerPoints[1]],
        ["Q", midX, midY, pointerPoints[2], pointerPoints[3]],
      ],
      {
        strokeWidth: 2,
        stroke: "#000000",
        fill: "transparent",
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
        isControlPoint: false,
        pathType: "arrow",
        startHead: true,
        endHead: true,
        padding: 6,
      }
    );
    fabricCanvas.add(lineToDraw);
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!isDrawingArrow || !lineToDraw) return;

    const pointer = fabricCanvas.getPointer(o.e);
    const [startX, startY] = pointerPoints;

    lineToDraw.path = o.e.shiftKey
      ? calculateStraightLineWithArrowHeads(
          startX,
          startY,
          pointer.x,
          pointer.y,
          lineToDraw.startHead,
          lineToDraw.endHead
        )
      : calculateCurvedLineWithArrowHeads(
          startX,
          startY,
          pointer.x,
          pointer.y,
          lineToDraw.startHead,
          lineToDraw.endHead
        );

    updateLine(lineToDraw, fabricCanvas);
  });

  fabricCanvas.on("mouse:up", (o) => {
    if (!isDrawingArrow || !lineToDraw) return;

    isDrawingArrow = false;

    if (lineToDraw.path && lineToDraw.path.length > 0) {
      setLineDimensions(lineToDraw);
    }

    const startPoint = { x: lineToDraw.path[2][1], y: lineToDraw.path[2][2] };
    const endPoint = getEndPoint(lineToDraw.path);
    let midPoint = null;
    if (!o.e.shiftKey) {
      const pathIndex = lineToDraw.path.findIndex(
        (segment) => segment[0] === "Q"
      );
      if (pathIndex !== -1) {
        midPoint = {
          x: lineToDraw.path[pathIndex][1],
          y: lineToDraw.path[pathIndex][2],
        };
      } else {
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        midPoint = { x: midX, y: midY };
      }
    }

    attachControlPoints(
      fabricCanvas,
      lineToDraw,
      startPoint,
      endPoint,
      midPoint
    );
    lineToDraw.selectable = true;
    lineToDraw.evented = true;
    fabricCanvas.fire("object:modified");
    fabricCanvas.setActiveObject(lineToDraw);
    imgEditor.setActiveTool("select");
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    [obj.p0, obj.p2, obj.p1].forEach(
      (point) => point && fabricCanvas.remove(point)
    );
  });

  fabricCanvas.on("mouse:down", (o) => {
    if (isDrawingArrow) return;
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
      json.startHead = this.startHead;
      json.endHead = this.endHead;
      return json;
    };
  })(fabric.Path.prototype.toJSON);
}

export {
  arrowDrawing,
  attachControlPoints,
  createControlPoint,
  updateLine,
  setLineDimensions,
  calculateStraightLineWithArrowHeads,
  calculateCurvedLineWithArrowHeads,
  getEndPoint,
  bindControlPoints,
  updateControlPoints,
  updateControlPointsAndPath,
  updatePathFromControlPoints,
  attachControlPointEvents,
};
