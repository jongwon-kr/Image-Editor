/**
 * 선 그리기
 */

function lineDrawing(fabricCanvas) {
  let isDrawingLine = false;
  let lineToDraw = null;
  let pointer;
  let pointerPoints;
  let isCurved = false;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingLineMode) return;

    isDrawingLine = true;
    pointer = fabricCanvas.getPointer(o.e);
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
        selectable: false, // 그리기 중에는 선택 불가
        evented: false, // 그리기 중에는 이벤트 반응 없음
        objectCaching: false,
        isControlPoint: false, // 선 객체임을 명시
      }
    );
    fabricCanvas.add(lineToDraw);
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!isDrawingLine || !lineToDraw) return;

    pointer = fabricCanvas.getPointer(o.e);

    if (o.e.shiftKey) {
      const startX = pointerPoints[0];
      const startY = pointerPoints[1];
      const x2 = pointer.x - startX;
      const y2 = pointer.y - startY;
      const r = Math.sqrt(x2 * x2 + y2 * y2);
      let angle = (Math.atan2(y2, x2) / Math.PI) * 180;
      angle = Math.round(((angle + 7.5) % 360) / 15) * 15;
      const cosx = r * Math.cos((angle * Math.PI) / 180);
      const sinx = r * Math.sin((angle * Math.PI) / 180);
      lineToDraw.path = [
        ["M", startX, startY],
        ["L", cosx + startX, sinx + startY],
      ];
    } else {
      const startX = pointerPoints[0];
      const startY = pointerPoints[1];
      const endX = pointer.x;
      const endY = pointer.y;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      lineToDraw.path = [
        ["M", startX, startY],
        ["Q", midX, midY, endX, endY],
      ];
    }

    lineToDraw.setCoords();
    lineToDraw.dirty = true;
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingLine || !lineToDraw) return;

    isDrawingLine = false;
    lineToDraw.set({
      selectable: true, // 그리기 완료 후 선택 가능
      evented: true, // 이벤트 반응 가능
    });

    // 경로 크기 재계산 및 설정
    const dims = lineToDraw._calcDimensions();
    lineToDraw.set({
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
    lineToDraw.setCoords();

    const startPoint = { x: lineToDraw.path[0][1], y: lineToDraw.path[0][2] };
    const endPoint =
      lineToDraw.path[1][0] === "Q"
        ? { x: lineToDraw.path[1][3], y: lineToDraw.path[1][4] }
        : { x: lineToDraw.path[1][1], y: lineToDraw.path[1][2] };
    const midPoint =
      lineToDraw.path[1][0] === "Q"
        ? { x: lineToDraw.path[1][1], y: lineToDraw.path[1][2] }
        : null;

    attachControlPoints(fabricCanvas, lineToDraw, startPoint, endPoint, midPoint);

    fabricCanvas.fire("object:modified");
    fabricCanvas.renderAll();
  });

  // 컨트롤 포인트의 선택/비선택 이벤트 핸들러 함수
  function handleControlPointSelected(p0, p2, p1, fabricCanvas) {
    p0.set({ visible: true }).bringToFront();
    p2.set({ visible: true }).bringToFront();
    if (p1) p1.set({ visible: true }).bringToFront();
    fabricCanvas.renderAll();
  }

  function handleControlPointDeselected(p0, p2, p1, fabricCanvas) {
    if (!p0.selected) p0.set({ visible: false });
    if (!p2.selected) p2.set({ visible: false });
    if (p1 && !p1.selected) p1.set({ visible: false });
    fabricCanvas.renderAll();
  }

  function attachControlPoints(fabricCanvas, line, startPoint, endPoint, midPoint) {
    const p0 = makeCurveCircle(startPoint.x, startPoint.y, line, null, null);
    p0.name = "p0";
    const p2 = makeCurveCircle(endPoint.x, endPoint.y, null, null, line);
    p2.name = "p2";
    const p1 = midPoint ? makeCurvePoint(midPoint.x, midPoint.y, null, line, null) : null;
    if (p1) p1.name = "p1";

    line.p0 = p0;
    line.p2 = p2;
    line.p1 = p1;

    fabricCanvas.add(p0, p2);
    if (p1) fabricCanvas.add(p1);

    p0.on("moving", function () {
      const line = this.line1;
      if (!line) return;
      line.path[0][1] = this.left;
      line.path[0][2] = this.top;
      line.setCoords();
      line.dirty = true;
      isCurved = true;
      fabricCanvas.renderAll();
    });
    p0.on("selected", () => handleControlPointSelected(p0, p2, p1, fabricCanvas));
    p0.on("deselected", () => handleControlPointDeselected(p0, p2, p1, fabricCanvas));

    p2.on("moving", function () {
      const line = this.line3;
      if (!line) return;
      if (line.path[1][0] === "Q") {
        line.path[1][3] = this.left;
        line.path[1][4] = this.top;
      } else {
        line.path[1][1] = this.left;
        line.path[1][2] = this.top;
      }
      line.setCoords();
      line.dirty = true;
      isCurved = true;
      fabricCanvas.renderAll();
    });
    p2.on("selected", () => handleControlPointSelected(p0, p2, p1, fabricCanvas));
    p2.on("deselected", () => handleControlPointDeselected(p0, p2, p1, fabricCanvas));

    if (p1) {
      p1.on("moving", function () {
        const line = this.line2;
        if (!line) return;
        if (line.path[1][0] !== "Q") {
          const midX = (line.path[0][1] + line.path[1][1]) / 2;
          const midY = (line.path[0][2] + line.path[1][2]) / 2;
          line.path[1] = ["Q", midX, midY, line.path[1][1], line.path[1][2]];
        }
        line.path[1][1] = this.left;
        line.path[1][2] = this.top;
        line.setCoords();
        line.dirty = true;
        isCurved = true;
        fabricCanvas.renderAll();
      });
      p1.on("selected", () => handleControlPointSelected(p0, p2, p1, fabricCanvas));
      p1.on("deselected", () => handleControlPointDeselected(p0, p2, p1, fabricCanvas));
    }

    line.on("selected", function () {
      this.p0.set({ visible: true }).bringToFront();
      this.p2.set({ visible: true }).bringToFront();
      if (this.p1) this.p1.set({ visible: true }).bringToFront();
      fabricCanvas.renderAll();
    });

    line.on("deselected", function () {
      if (!this.p0.selected) this.p0.set({ visible: false });
      if (!this.p2.selected) this.p2.set({ visible: false });
      if (this.p1 && !this.p1.selected) this.p1.set({ visible: false });
      fabricCanvas.renderAll();
    });

    line.on("moving", function (e) {
      // e.transform 및 delta가 정의되어 있는지 확인
      if (!e.transform || !e.transform.delta) {
        console.warn("e.transform.delta is undefined in line moving event", e);
        return;
      }

      const delta = e.transform.delta;
      line.path[0][1] += delta.x;
      line.path[0][2] += delta.y;
      if (line.path[1][0] === "Q") {
        line.path[1][1] += delta.x;
        line.path[1][2] += delta.y;
        line.path[1][3] += delta.x;
        line.path[1][4] += delta.y;
      } else {
        line.path[1][1] += delta.x;
        line.path[1][2] += delta.y;
      }
      syncControlPoints(line);
      line.setCoords();
      line.dirty = true;
      fabricCanvas.renderAll();
    });
  }

  function syncControlPoints(line) {
    if (line.p0) {
      line.p0.set({ left: line.path[0][1], top: line.path[0][2] }).setCoords();
    }
    if (line.p2) {
      const endX = line.path[1][0] === "Q" ? line.path[1][3] : line.path[1][1];
      const endY = line.path[1][0] === "Q" ? line.path[1][4] : line.path[1][2];
      line.p2.set({ left: endX, top: endY }).setCoords();
    }
    if (line.p1 && line.path[1][0] === "Q") {
      line.p1.set({ left: line.path[1][1], top: line.path[1][2] }).setCoords();
    }
    line.p0.bringToFront();
    line.p2.bringToFront();
    if (line.p1) line.p1.bringToFront();
  }

  function makeCurveCircle(left, top, line1, line2, line3) {
    var c = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 3,
      radius: 6,
      fill: "#fff",
      stroke: "#666",
      selectable: false,
      evented: true, // 이동 가능하도록 수정
      isControlPoint: true, // 제어점임을 명시
    });

    c.hasBorders = c.hasControls = false;
    c.line1 = line1;
    c.line2 = line2;
    c.line3 = line3;
    c.visible = false;

    return c;
  }

  function makeCurvePoint(left, top, line1, line2, line3) {
    var c = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 3,
      radius: 6,
      fill: "#fff",
      stroke: "#666",
      selectable: false,
      evented: true, // 이동 가능하도록 수정
      isControlPoint: true, // 제어점임을 명시
    });

    c.hasBorders = c.hasControls = false;
    c.line1 = line1;
    c.line2 = line2;
    c.line3 = line3;
    c.visible = false;

    return c;
  }

  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    if (obj.p0) fabricCanvas.remove(obj.p0);
    if (obj.p2) fabricCanvas.remove(obj.p2);
    if (obj.p1) fabricCanvas.remove(obj.p1);
  });

  // 선택을 위한 추가 이벤트 핸들러
  fabricCanvas.on("mouse:down", (o) => {
    if (isDrawingLine) return; // 그리기 중에는 선택 이벤트 무시
    const target = fabricCanvas.findTarget(o.e, false);
    if (target && !target.isControlPoint) {
      fabricCanvas.renderAll();
    }
  });
}

export { lineDrawing };