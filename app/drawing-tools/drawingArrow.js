import { getControlPoint } from "../utils/utils.js";

function arrowDrawing(fabricCanvas) {
  let isDrawingArrow = false;
  let isControl = false;
  let lineToDraw = null;
  let pointerPoints;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingArrowMode) return;

    isDrawingArrow = true;
    const pointer = fabricCanvas.getPointer(o.e);
    pointerPoints = [pointer.x, pointer.y, pointer.x, pointer.y];

    lineToDraw = new fabric.Path(
      [
        ["M", pointerPoints[0], pointerPoints[1]],
        ["L", pointerPoints[2], pointerPoints[3]],
      ],
      {
        strokeWidth: 2,
        stroke: "#000000",
        strokeUniform: true,
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
        isControlPoint: false,
        // 빛나는 효과 추가
        shadow: new fabric.Shadow({
          color: "rgb(255, 225, 0)",
          blur: 15,
          offsetX: 0,
          offsetY: 0,
          affectStroke: true, // 선에 그림자 효과 적용
        }),
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
          pointer.y
        )
      : calculateCurvedLineWithArrowHeads(startX, startY, pointer.x, pointer.y);

    updateLine(lineToDraw, fabricCanvas);
  });

  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingArrow || !lineToDraw) return;

    isDrawingArrow = false;
    setLineDimensions(lineToDraw);

    const startPoint = { x: lineToDraw.path[1][1], y: lineToDraw.path[1][2] }; // 화살표 머리 후 시작점
    const endPoint = getEndPoint(lineToDraw.path);
    const midPoint =
      lineToDraw.path[4][0] === "Q"
        ? { x: lineToDraw.path[4][1], y: lineToDraw.path[4][2] }
        : null;

    attachControlPoints(
      fabricCanvas,
      lineToDraw,
      startPoint,
      endPoint,
      midPoint
    );

    fabricCanvas.fire("object:modified");
    fabricCanvas.renderAll();
  });

  function calculateStraightLineWithArrowHeads(startX, startY, endX, endY) {
    const finalX = endX;
    const finalY = endY;

    const arrowSize = 20;
    const arrowAngle = Math.atan2(endY - startY, endX - startX); // 실제 각도 사용

    // 시작점 화살표 머리 (선의 안쪽을 향하도록)
    const startArrowX1 =
      startX + arrowSize * Math.cos(arrowAngle - Math.PI / 6);
    const startArrowY1 =
      startY + arrowSize * Math.sin(arrowAngle - Math.PI / 6);
    const startArrowX2 =
      startX + arrowSize * Math.cos(arrowAngle + Math.PI / 6);
    const startArrowY2 =
      startY + arrowSize * Math.sin(arrowAngle + Math.PI / 6);

    // 끝점 화살표 머리 (선의 안쪽을 향하도록)
    const endArrowX1 = finalX - arrowSize * Math.cos(arrowAngle - Math.PI / 6);
    const endArrowY1 = finalY - arrowSize * Math.sin(arrowAngle - Math.PI / 6);
    const endArrowX2 = finalX - arrowSize * Math.cos(arrowAngle + Math.PI / 6);
    const endArrowY2 = finalY - arrowSize * Math.sin(arrowAngle + Math.PI / 6);

    return [
      ["M", startArrowX1, startArrowY1],
      ["L", startX, startY],
      ["L", startArrowX2, startArrowY2],
      ["M", startX, startY],
      ["L", finalX, finalY],
      ["L", endArrowX1, endArrowY1],
      ["M", finalX, finalY],
      ["L", endArrowX2, endArrowY2],
    ];
  }

  function calculateCurvedLineWithArrowHeads(
    startX,
    startY,
    endX,
    endY,
    midX = (startX + endX) / 2,
    midY = (startY + endY) / 2
  ) {
    const startAngle = Math.atan2(midY - startY, midX - startX);
    const endAngle = Math.atan2(endY - midY, endX - midX);
    const arrowSize = 20;

    // 시작점 화살표 머리 (선의 안쪽을 향하도록)
    const startArrowX1 =
      startX + arrowSize * Math.cos(startAngle - Math.PI / 6);
    const startArrowY1 =
      startY + arrowSize * Math.sin(startAngle - Math.PI / 6);
    const startArrowX2 =
      startX + arrowSize * Math.cos(startAngle + Math.PI / 6);
    const startArrowY2 =
      startY + arrowSize * Math.sin(startAngle + Math.PI / 6);

    // 끝점 화살표 머리 (선의 안쪽을 향하도록)
    const endArrowX1 = endX - arrowSize * Math.cos(endAngle - Math.PI / 6);
    const endArrowY1 = endY - arrowSize * Math.sin(endAngle - Math.PI / 6);
    const endArrowX2 = endX - arrowSize * Math.cos(endAngle + Math.PI / 6);
    const endArrowY2 = endY - arrowSize * Math.sin(endAngle + Math.PI / 6);

    return [
      ["M", startArrowX1, startArrowY1],
      ["L", startX, startY],
      ["L", startArrowX2, startArrowY2],
      ["M", startX, startY],
      ["Q", midX, midY, endX, endY],
      ["M", endArrowX1, endArrowY1],
      ["L", endX, endY],
      ["L", endArrowX2, endArrowY2],
    ];
  }

  function getEndPoint(path) {
    const lastSegment = path[path.length - 2];
    return { x: lastSegment[1], y: lastSegment[2] };
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

  function attachControlPoints(
    fabricCanvas,
    line,
    startPoint,
    endPoint,
    midPoint
  ) {
    if (line.p0) fabricCanvas.remove(line.p0);
    if (line.p2) fabricCanvas.remove(line.p2);
    if (line.p1) fabricCanvas.remove(line.p1);

    const p0 = createControlPoint(startPoint.x - 7.5, startPoint.y - 7.5, line);
    p0.name = "p0";
    const p2 = createControlPoint(endPoint.x - 7.5, endPoint.y - 7.5, line);
    p2.name = "p2";
    const p1 = midPoint
      ? createControlPoint(midPoint.x - 7.5, midPoint.y - 7.5, line, true)
      : null;
    if (p1) p1.name = "p1";

    line.p0 = p0;
    line.p2 = p2;
    line.p1 = p1;

    fabricCanvas.add(p0, p2);
    if (p1) fabricCanvas.add(p1);

    bindControlPoints(line, [p0, p2, p1].filter(Boolean));
    attachControlPointEvents(fabricCanvas, line, p0, p2, p1);
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

    line.off("moving").on("moving", () => {
      updateControlPoints(line);
    });
    line.off("rotating").on("rotating", () => {
      updateControlPoints(line);
    });
    line.off("scaling").on("scaling", () => {
      updateControlPointsAndPath(line);
    });
  }

  function updateControlPoints(line) {
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
        flipX: false,
        flipY: false,
        left: opt.translateX + point.offsetX,
        top: opt.translateY + point.offsetY,
        scaleX: 1,
        scaleY: 1,
        angle: opt.angle,
        radius: 6,
        strokeWidth: 3,
      });
      point.setCoords();
    });

    line._lastLeft = line.left;
    line._lastTop = line.top;
    updatePathFromControlPoints(line);
    fabricCanvas.renderAll();
  }

  function updateControlPointsAndPath(line) {
    const controlPoints = [line.p0, line.p2, line.p1];
    const lineTransform = line.calcTransformMatrix();

    controlPoints.forEach((point) => {
      if (!point.relationship) return;

      const newTransform = fabric.util.multiplyTransformMatrices(
        lineTransform,
        point.relationship
      );
      const opt = fabric.util.qrDecompose(newTransform);

      point.set({
        flipX: false,
        flipY: false,
        left: opt.translateX,
        top: opt.translateY,
        scaleX: 1,
        scaleY: 1,
        angle: opt.angle,
        radius: 6,
        strokeWidth: 3,
      });
      point.setCoords();
    });

    updatePathFromControlPoints(line);
    line._lastLeft = line.left;
    line._lastTop = line.top;
    fabricCanvas.renderAll();
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

      const startAngle = Math.atan2(midY - startY, midX - startX);
      const endAngle = Math.atan2(endY - midY, endX - midX);
      const arrowSize = 20;

      // 시작점 화살표 머리 (선의 안쪽을 향하도록)
      const startArrowX1 =
        startX + arrowSize * Math.cos(startAngle - Math.PI / 6);
      const startArrowY1 =
        startY + arrowSize * Math.sin(startAngle - Math.PI / 6);
      const startArrowX2 =
        startX + arrowSize * Math.cos(startAngle + Math.PI / 6);
      const startArrowY2 =
        startY + arrowSize * Math.sin(startAngle + Math.PI / 6);

      // 끝점 화살표 머리 (선의 안쪽을 향하도록)
      const endArrowX1 = endX - arrowSize * Math.cos(endAngle - Math.PI / 6);
      const endArrowY1 = endY - arrowSize * Math.sin(endAngle - Math.PI / 6);
      const endArrowX2 = endX - arrowSize * Math.cos(endAngle + Math.PI / 6);
      const endArrowY2 = endY - arrowSize * Math.sin(endAngle + Math.PI / 6);

      line.path = [
        ["M", startArrowX1, startArrowY1],
        ["L", startX, startY],
        ["L", startArrowX2, startArrowY2],
        ["M", startX, startY],
        ["Q", midX, midY, endX, endY],
        ["M", endArrowX1, endArrowY1],
        ["L", endX, endY],
        ["L", endArrowX2, endArrowY2],
      ];
    } else {
      line.path = calculateStraightLineWithArrowHeads(
        startX,
        startY,
        endX,
        endY
      );
    }

    setLineDimensions(line);
    line.set({ scaleX: 1, scaleY: 1 });
  }

  function attachControlPointEvents(fabricCanvas, line, p0, p2, p1) {
    const controlPoints = { p0, p2, p1 };

    Object.entries(controlPoints).forEach(([key, point]) => {
      if (!point) return;

      point.on("moving", function () {
        isControl = true;
        updatePathFromControlPoints(line);
        fabricCanvas.setActiveObject(line);
        updateLine(line, fabricCanvas);
        bindControlPoints(line, [p0, p2, p1].filter(Boolean));
      });

      point.on("selected", () => {
        Object.values(controlPoints).forEach((p) =>
          p?.set({ visible: true }).bringToFront()
        );
        fabricCanvas.renderAll();
      });

      point.on("deselected", () => {
        Object.values(controlPoints).forEach(
          (p) => !p?.selected && p?.set({ visible: false })
        );
        fabricCanvas.renderAll();
      });
    });

    line.on("selected", () => {
      const allControlPoints = getControlPoint();
      if (
        fabricCanvas.getActiveObjects().filter((obj) => !obj.isControlPoint)
          .length > 1
      ) {
        allControlPoints.forEach((point) => {
          point.set({ visible: false });
        });
      } else {
        if (!isControl) {
          updateControlPoints(line);
          fabricCanvas.renderAll();
        }
        line.set({ hasControls: false, borderColor: "#aaaaaa", padding: 6 });
        Object.values(controlPoints).forEach((p) =>
          p?.set({ visible: true }).bringToFront()
        );
        isControl = false;
      }
      fabricCanvas.renderAll();
    });

    line.on("deselected", () => {
      Object.values(controlPoints).forEach(
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

    fabricCanvas.on("before:transform", (e) => {
      if (!e.target || !e.transform || !e.transform.action) return;

      const target = e.target;
      if (
        (target.type === "path" ||
          (target.type === "group" &&
            target._objects.some((obj) => obj.type === "path"))) &&
        e.transform.action.includes("scale")
      ) {
        e.transform.action = null; // 스케일링 차단
      }
    });
  }

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
}

export { arrowDrawing };
