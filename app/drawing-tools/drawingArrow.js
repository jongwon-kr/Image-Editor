/**
 * 곡선 화살표 그리기
 */

class FabricArrow extends fabric.Path {
  static type = "FabricArrow"; // ES6+ 정적 속성 정의

  constructor(path, options = {}) {
    super(path, options);

    this.objectType = "arrow"; // selectionSettings와 통합을 위해 추가
    this.name = "Arrow";
    this.points = options.points
      ? [
          { x: options.points[0], y: options.points[1] },
          { x: options.points[2], y: options.points[3] },
        ]
      : [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ];
    this.stroke = options.stroke || "#000000";
    this.strokeWidth = options.strokeWidth || 2;
    this.fill = "transparent";
    this.startArrowHeadStyle = options.startArrowHeadStyle || "no-head";
    this.endArrowHeadStyle = options.endArrowHeadStyle || "filled-head";
    this.strokeUniform = true; // 선 두께 일관성 유지

    this._initializeControlPoints();
    this._updateArrow();

    // 변환 이벤트 핸들러
    this.on("moving", this._updateArrow.bind(this));
    this.on("scaling", this._updateArrow.bind(this));
    this.on("rotating", this._updateArrow.bind(this));
    this.on("modified", this._updateArrow.bind(this));
  }

  _initializeControlPoints() {
    this.arrowStartPoint = null;
    this.arrowEndPoint = null;
    this.controlPoint = null;
    this.startArrowHead = null;
    this.endArrowHead = null;
  }

  _getPathPoints() {
    const path = this.path || [];
    if (path[0]?.[0] === "M" && path[1]?.[0] === "L") {
      return {
        start: { x: path[0][1], y: path[0][2] },
        end: { x: path[1][1], y: path[1][2] },
        control: null,
      };
    } else if (path[0]?.[0] === "M" && path[1]?.[0] === "Q") {
      return {
        start: { x: path[0][1], y: path[0][2] },
        control: { x: path[1][1], y: path[1][2] },
        end: { x: path[1][3], y: path[1][4] },
      };
    }
    return { start: null, end: null, control: null };
  }

  _updatePointsPositions() {
    const matrix = this.calcTransformMatrix();
    const points = this._getPathPoints();

    if (points.start && this.arrowStartPoint) {
      const startLocal = new fabric.Point(points.start.x, points.start.y);
      const startCanvas = fabric.util.transformPoint(startLocal, matrix);
      this.arrowStartPoint.set({ left: startCanvas.x, top: startCanvas.y });
      this.arrowStartPoint.setCoords();
    }
    if (points.end && this.arrowEndPoint) {
      const endLocal = new fabric.Point(points.end.x, points.end.y);
      const endCanvas = fabric.util.transformPoint(endLocal, matrix);
      this.arrowEndPoint.set({ left: endCanvas.x, top: endCanvas.y });
      this.arrowEndPoint.setCoords();
    }
    if (points.control && this.controlPoint) {
      const controlLocal = new fabric.Point(points.control.x, points.control.y);
      const controlCanvas = fabric.util.transformPoint(controlLocal, matrix);
      this.controlPoint.set({ left: controlCanvas.x, top: controlCanvas.y });
      this.controlPoint.setCoords();
      this.controlPoint.visible = true;
    } else if (this.controlPoint) {
      this.controlPoint.visible = false;
    }
  }

  _updateArrowHeads() {
    const matrix = this.calcTransformMatrix();
    const points = this._getPathPoints();
    if (!points.start || !points.end) return;

    const startCanvas = fabric.util.transformPoint(
      new fabric.Point(points.start.x, points.start.y),
      matrix
    );
    const endCanvas = fabric.util.transformPoint(
      new fabric.Point(points.end.x, points.end.y),
      matrix
    );
    const controlCanvas = points.control
      ? fabric.util.transformPoint(
          new fabric.Point(points.control.x, points.control.y),
          matrix
        )
      : null;

    const headlen = 15 * this.strokeWidth;
    let angleEnd, angleStart;

    if (this.path[1]?.[0] === "Q" && controlCanvas) {
      angleEnd = Math.atan2(
        endCanvas.y - controlCanvas.y,
        endCanvas.x - controlCanvas.x
      );
      angleStart = Math.atan2(
        controlCanvas.y - startCanvas.y,
        controlCanvas.x - startCanvas.x
      );
    } else {
      angleEnd = Math.atan2(
        endCanvas.y - startCanvas.y,
        endCanvas.x - startCanvas.x
      );
      angleStart = angleEnd + Math.PI;
    }

    if (this.endArrowHeadStyle !== "no-head" && this.endArrowHead) {
      const x1 = endCanvas.x - headlen * Math.cos(angleEnd - Math.PI / 6);
      const y1 = endCanvas.y - headlen * Math.sin(angleEnd - Math.PI / 6);
      const x2 = endCanvas.x - headlen * Math.cos(angleEnd + Math.PI / 6);
      const y2 = endCanvas.y - headlen * Math.sin(angleEnd + Math.PI / 6);
      const headPath = `M ${x1} ${y1} L ${endCanvas.x} ${endCanvas.y} L ${x2} ${y2} ${
        this.endArrowHeadStyle === "filled-head" ? "Z" : ""
      }`;
      this.endArrowHead.path = fabric.util.parsePath(headPath);
      this.endArrowHead.set({
        fill:
          this.endArrowHeadStyle === "filled-head" ? this.stroke : "transparent",
        stroke: this.stroke,
        strokeWidth: this.strokeWidth,
      });
      this.endArrowHead.setCoords();
    }

    if (this.startArrowHeadStyle !== "no-head" && this.startArrowHead) {
      const x1 = startCanvas.x - headlen * Math.cos(angleStart - Math.PI / 6);
      const y1 = startCanvas.y - headlen * Math.sin(angleStart - Math.PI / 6);
      const x2 = startCanvas.x - headlen * Math.cos(angleStart + Math.PI / 6);
      const y2 = startCanvas.y - headlen * Math.sin(angleStart + Math.PI / 6);
      const headPath = `M ${x1} ${y1} L ${startCanvas.x} ${startCanvas.y} L ${x2} ${y2} ${
        this.startArrowHeadStyle === "filled-head" ? "Z" : ""
      }`;
      this.startArrowHead.path = fabric.util.parsePath(headPath);
      this.startArrowHead.set({
        fill:
          this.startArrowHeadStyle === "filled-head"
            ? this.stroke
            : "transparent",
        stroke: this.stroke,
        strokeWidth: this.strokeWidth,
      });
      this.startArrowHead.setCoords();
    }
  }

  _updateArrow() {
    if (!this.points || this.points.length < 2) return;
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = this.points;

    this.path = this.path || [["M", x1, y1], ["L", x2, y2]];
    const dims = this._calcDimensions();
    this.set({
      width: dims.width,
      height: dims.height,
      left: dims.left,
      top: dims.top,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top,
      },
    });
    this.setCoords();
    this._updatePointsPositions();
    this._updateArrowHeads();
  }

  setPoints(points) {
    this.points = [
      { x: points[0], y: points[1] },
      { x: points[2], y: points[3] },
    ];
    this._updateArrow();
    this.canvas?.requestRenderAll();
  }

  toObject(propertiesToInclude) {
    return fabric.util.object.extend(super.toObject(propertiesToInclude), {
      objectType: this.objectType,
      name: this.name,
      points: this.points,
      startArrowHeadStyle: this.startArrowHeadStyle,
      endArrowHeadStyle: this.endArrowHeadStyle,
    });
  }
}

// 커스텀 클래스 등록 (선택적)
fabric.FabricArrow = FabricArrow;

function arrowDrawing(fabricCanvas) {
  let isDrawingArrow = false;
  let arrowPath = null;
  let isMouseDown = false;
  let startPoint = null;
  let endPoint = null;

  // 마우스 다운: 화살표 그리기 시작
  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingArrowMode) return;

    isMouseDown = true;
    isDrawingArrow = true;
    const pointer = fabricCanvas.getPointer(o.e);
    startPoint = { x: pointer.x, y: pointer.y };
    endPoint = { x: pointer.x, y: pointer.y };

    arrowPath = new FabricArrow(
      [["M", startPoint.x, startPoint.y], ["L", endPoint.x, endPoint.y]],
      {
        points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
        stroke: "#000000",
        strokeWidth: 2,
        endArrowHeadStyle: "filled-head",
        startArrowHeadStyle: "no-head",
        selectable: false,
        evented: false,
      }
    );

    // 화살촉 객체 초기화
    initializeArrowHeads(fabricCanvas, arrowPath);
    fabricCanvas.add(arrowPath);
    fabricCanvas.requestRenderAll();
  });

  // 마우스 이동: 화살표 실시간 업데이트
  fabricCanvas.on("mouse:move", (o) => {
    if (!isMouseDown || !isDrawingArrow || !arrowPath) return;

    const pointer = fabricCanvas.getPointer(o.e);
    endPoint = { x: pointer.x, y: pointer.y };

    if (o.e.altKey) {
      const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2 - 50,
      };
      arrowPath.path = [
        ["M", startPoint.x, startPoint.y],
        ["Q", midPoint.x, midPoint.y, endPoint.x, endPoint.y],
      ];
    } else {
      arrowPath.path = [
        ["M", startPoint.x, startPoint.y],
        ["L", endPoint.x, endPoint.y],
      ];
    }
    arrowPath.setPoints([startPoint.x, startPoint.y, endPoint.x, endPoint.y]);
    fabricCanvas.requestRenderAll();
  });

  // 마우스 업: 화살표 그리기 완료 및 컨트롤 포인트 추가
  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingArrow || !arrowPath) return;

    isMouseDown = false;
    isDrawingArrow = false;

    arrowPath.set({
      selectable: true,
      evented: true,
      perPixelTargetFind: true,
    });

    // 컨트롤 포인트 생성 및 연결
    attachControlPoints(fabricCanvas, arrowPath, startPoint, endPoint);
    attachArrowEvents(fabricCanvas, arrowPath);

    fabricCanvas.fire("object:modified");
    fabricCanvas.requestRenderAll();
  });

  // 객체 제거 시 관련 객체 정리
  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    if (obj.arrowStartPoint) fabricCanvas.remove(obj.arrowStartPoint);
    if (obj.arrowEndPoint) fabricCanvas.remove(obj.arrowEndPoint);
    if (obj.controlPoint) fabricCanvas.remove(obj.controlPoint);
    if (obj.startArrowHead) fabricCanvas.remove(obj.startArrowHead);
    if (obj.endArrowHead) fabricCanvas.remove(obj.endArrowHead);
  });

  // 외부 이벤트: 그리기 취소
  document.addEventListener("keydown", (e) => {
    if (isDrawingArrow && e.key === "Escape") {
      cancelDrawing(fabricCanvas);
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (
      isDrawingArrow &&
      !document.querySelector(".canvas-container")?.contains(e.target)
    ) {
      cancelDrawing(fabricCanvas);
    }
  });
}

// 화살촉 초기화 함수
function initializeArrowHeads(fabricCanvas, arrow) {
  if (arrow.endArrowHeadStyle !== "no-head") {
    arrow.endArrowHead = new fabric.Path("", {
      fill:
        arrow.endArrowHeadStyle === "filled-head" ? arrow.stroke : "transparent",
      stroke: arrow.stroke,
      strokeWidth: arrow.strokeWidth,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(arrow.endArrowHead);
  }
  if (arrow.startArrowHeadStyle !== "no-head") {
    arrow.startArrowHead = new fabric.Path("", {
      fill:
        arrow.startArrowHeadStyle === "filled-head"
          ? arrow.stroke
          : "transparent",
      stroke: arrow.stroke,
      strokeWidth: arrow.strokeWidth,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(arrow.startArrowHead);
  }
  arrow._updateArrowHeads();
}



// 화살표 이벤트 연결
function attachArrowEvents(fabricCanvas, arrow) {
  arrow.on("selected", function () {
    this.arrowStartPoint.set({ visible: true }).bringToFront();
    this.arrowEndPoint.set({ visible: true }).bringToFront();
    this.controlPoint.set({ visible: this.path[1][0] === "Q" }).bringToFront();
    fabricCanvas.requestRenderAll();
  });

  arrow.on("deselected", function () {
    if (!this.arrowStartPoint.selected) this.arrowStartPoint.visible = false;
    if (!this.arrowEndPoint.selected) this.arrowEndPoint.visible = false;
    if (!this.controlPoint.selected) this.controlPoint.visible = false;
    fabricCanvas.requestRenderAll();
  });
}

// 그리기 취소 함수
function cancelDrawing(fabricCanvas) {
  if (arrowPath) {
    fabricCanvas.remove(arrowPath);
    if (arrowPath.arrowStartPoint) fabricCanvas.remove(arrowPath.arrowStartPoint);
    if (arrowPath.arrowEndPoint) fabricCanvas.remove(arrowPath.arrowEndPoint);
    if (arrowPath.controlPoint) fabricCanvas.remove(arrowPath.controlPoint);
    if (arrowPath.startArrowHead) fabricCanvas.remove(arrowPath.startArrowHead);
    if (arrowPath.endArrowHead) fabricCanvas.remove(arrowPath.endArrowHead);
    fabricCanvas.fire("object:modified");
    fabricCanvas.requestRenderAll();
  }
  isDrawingArrow = false;
  isMouseDown = false;
  arrowPath = null;
}

export { arrowDrawing };