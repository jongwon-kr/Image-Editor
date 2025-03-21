/**
 * 곡선 화살표 그리기
 */

function arrowDrawing(fabricCanvas) {
  let isDrawingArrow = false,
    arrowPath = null,
    pointer,
    isMouseDown = false,
    startPoint = null,
    endPoint = null;

  // 화살표 헤드 그리기 함수
  function drawArrowHead(path, endX, endY, controlX, controlY) {
    const angle = Math.atan2(endY - controlY, endX - controlX);
    const arrowLength = 15;

    const arrowLeft = {
      x: endX - arrowLength * Math.cos(angle - Math.PI/6),
      y: endY - arrowLength * Math.sin(angle - Math.PI/6)
    };
    
    const arrowRight = {
      x: endX - arrowLength * Math.cos(angle + Math.PI/6),
      y: endY - arrowLength * Math.sin(angle + Math.PI/6)
    };

    // 화살표 머리 스타일에 따라 다르게 그리기
    if (path.arrowHeadStyle === 'filled') {
      // 채워진 화살표 머리
      const arrowHead = new fabric.Path([
        ["M", arrowLeft.x, arrowLeft.y],
        ["L", endX, endY],
        ["L", arrowRight.x, arrowRight.y],
        ["Z"]
      ], {
        fill: path.stroke,
        stroke: path.stroke,
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      fabricCanvas.add(arrowHead);
      path.arrowHead = arrowHead;
    } else {
      // 비어있는 화살표 머리
      const arrowHead = new fabric.Path([
        ["M", arrowLeft.x, arrowLeft.y],
        ["L", endX, endY],
        ["L", arrowRight.x, arrowRight.y]
      ], {
        fill: 'transparent',
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
        selectable: false,
        evented: false
      });
      fabricCanvas.add(arrowHead);
      path.arrowHead = arrowHead;
    }
  }

  fabricCanvas.on("mouse:down", (o) => {
    if (!o || !o.pointer) return;
    if (!fabricCanvas.isDrawingArrowMode) return;

    isMouseDown = true;
    isDrawingArrow = true;
    pointer = o.pointer;
    startPoint = { x: pointer.x, y: pointer.y };
    endPoint = { x: pointer.x, y: pointer.y };

    // 새로운 화살표 경로 생성
    arrowPath = new fabric.Path("M 0 0", {
      stroke: "#000000",
      strokeWidth: 2,
      fill: "transparent",
      strokeLineCap: "round",
      strokeLineJoin: "round",
      selectable: false,
      evented: false,
      strokeUniform: true,
      type: 'arrow',
      objectType: 'arrow',
      arrowHeadStyle: 'filled',  // 기본값
      showStartArrow: false,     // 기본값
      showEndArrow: true        // 기본값
    });

    fabricCanvas.add(arrowPath);
    updateArrowPath(pointer); // 초기 경로 업데이트
    fabricCanvas.renderAll();
  });

  // 화살표 경로 업데이트 함수 수정
  function updateArrowPath(pointer) {
    if (!arrowPath) return;

    endPoint = { x: pointer.x, y: pointer.y };

    // 이전 화살표 머리 삭제
    if (arrowPath.arrowHead) {
      fabricCanvas.remove(arrowPath.arrowHead);
    }

    // 화살표 경로 업데이트
    arrowPath.path = [
      ["M", startPoint.x, startPoint.y],
      ["L", endPoint.x, endPoint.y]
    ];

    // 시작점과 끝점을 객체의 속성으로 저장
    arrowPath.startPoint = startPoint;
    arrowPath.endPoint = endPoint;

    // 화살표 헤드 그리기
    drawArrowHead(arrowPath, endPoint.x, endPoint.y, startPoint.x, startPoint.y);

    // 화살표 크기와 위치 재계산
    const dims = arrowPath._calcDimensions();
    if (dims.width > 0 && dims.height > 0) {
      arrowPath.set({
        width: dims.width,
        height: dims.height,
        left: dims.left,
        top: dims.top,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top
        }
      });
      arrowPath.setCoords();
    }
  }

  fabricCanvas.on("mouse:move", (o) => {
    if (!o || !o.pointer) return;
    if (!isMouseDown || !isDrawingArrow || !arrowPath) return;

    pointer = o.pointer;

    if (o.e.altKey) {
      // 곡선 화살표
      const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2 - 50
      };

      // 이전 화살표 머리 삭제
      if (arrowPath.arrowHead) {
        fabricCanvas.remove(arrowPath.arrowHead);
      }

      arrowPath.path = [
        ["M", startPoint.x, startPoint.y],
        ["Q", midPoint.x, midPoint.y, pointer.x, pointer.y]
      ];
      drawArrowHead(arrowPath, pointer.x, pointer.y, midPoint.x, midPoint.y);
    } else {
      updateArrowPath(pointer);
    }

    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingArrow) return;

    isMouseDown = false;
    isDrawingArrow = false;

    if (arrowPath) {
      // 중간 제어점 생성
      const midPoint = new fabric.Circle({
        left: (startPoint.x + endPoint.x) / 2,
        top: (startPoint.y + endPoint.y) / 2,
        radius: 5,
        fill: '#ccccff',
        stroke: '#000000',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        hasBorders: false,
        hasControls: false,
        visible: false,
        selectable: true,
        evented: true,
        perPixelTargetFind: true,
        targetFindTolerance: 4,
        isControlPoint: true,
        hoverCursor: 'move',
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasControls: false,
        hasBorders: false,
        excludeFromExport: true
      });

      // 화살표와 제어점 연결
      arrowPath.controlPoint = midPoint;
      midPoint.arrowRef = arrowPath;
      arrowPath.set({
        selectable: true,
        evented: true,
        perPixelTargetFind: true
      });

      fabricCanvas.add(midPoint);
      midPoint.bringToFront();

      // 화살표 선택 이벤트
      arrowPath.on('selected', function() {
        console.log("arrowPath.selected");
        console.log(this);
        if (this.controlPoint) {
          this.controlPoint.set({
            visible: true
          });
          this.controlPoint.bringToFront();
          fabricCanvas.requestRenderAll();
        }
      });

      // 화살표 선택 해제 이벤트
      arrowPath.on('deselected', function() {
        if (this.controlPoint) {
          // 제어점이 선택되어 있지 않을 때만 숨김
          if (!this.controlPoint.selected) {
            this.controlPoint.visible = false;
          }
          fabricCanvas.requestRenderAll();
        }
      });

      // 제어점 선택 이벤트
      midPoint.on('selected', function() {
        this.visible = true;
        if (this.arrowRef) {
          fabricCanvas.setActiveObject(this);  // 제어점을 활성 객체로 설정
        }
      });

      // 제어점 선택 해제 이벤트
      midPoint.on('deselected', function() {
        if (this.arrowRef && !this.arrowRef.selected) {
          this.visible = false;
        }
        fabricCanvas.requestRenderAll();
      });

      // 제어점 이동 이벤트
      midPoint.on('moving', function() {
        const arrow = this.arrowRef;
        if (!arrow) return;

        // 이전 화살표 머리 삭제
        if (arrow.arrowHead) {
          fabricCanvas.remove(arrow.arrowHead);
        }

        const startCommand = arrow.path[0];
        const startX = startCommand[1];
        const startY = startCommand[2];
        const endX = endPoint.x;
        const endY = endPoint.y;

        // 곡선 경로 업데이트
        arrow.path = [
          ["M", startX, startY],
          ["Q", this.left, this.top, endX, endY]
        ];

        // 화살표 헤드 다시 그리기
        drawArrowHead(arrow, endX, endY, this.left, this.top);

        // 화살표 크기와 위치 재계산
        const dims = arrow._calcDimensions();
        if (dims.width > 0 && dims.height > 0) {
          arrow.set({
            width: dims.width,
            height: dims.height,
            left: dims.left,
            top: dims.top,
            pathOffset: {
              x: dims.width / 2 + dims.left,
              y: dims.height / 2 + dims.top
            }
          });
          arrow.setCoords();
        }

        // 제어점을 최상위로 유지
        this.bringToFront();
        fabricCanvas.requestRenderAll();  // renderAll 대신 requestRenderAll 사용
      });

      fabricCanvas.fire("object:modified");
      fabricCanvas.requestRenderAll();
      arrowPath = null;
    }
  });

  // 화살표 삭제 시 제어점과 화살표 머리도 함께 삭제
  fabricCanvas.on('object:removed', function(e) {
    const obj = e.target;
    if (obj.controlPoint) {
      fabricCanvas.remove(obj.controlPoint);
    }
    if (obj.arrowHead) {
      fabricCanvas.remove(obj.arrowHead);
    }
  });

  // 취소 기능 수정
  const cancelDrawing = () => {
    if (arrowPath) {
        if (arrowPath.controlPoint) {
            fabricCanvas.remove(arrowPath.controlPoint);
        }
        fabricCanvas.remove(arrowPath);
        fabricCanvas.requestRenderAll();
        fabricCanvas.fire("object:modified");
    }
    isDrawingArrow = false;
    isMouseDown = false;
    arrowPath = null;
  };

  document.addEventListener("keydown", (e) => {
    if (!isDrawingArrow) return;
    const key = e.which || e.keyCode;
    if (key === 27) cancelDrawing();
  });

  document.addEventListener("mousedown", (e) => {
    if (!isDrawingArrow) return;
    if (!document.querySelector(".canvas-container").contains(e.target)) {
      cancelDrawing();
    }
  });

  // 캔버스 마우스 다운 이벤트에 제어점 우선 선택 로직 추가
  fabricCanvas.on('mouse:down', function(options) {
    if (!options.target) return;
    
    // 제어점인 경우 항상 최우선 선택
    if (options.target.arrowRef) {
      options.target.bringToFront();
      fabricCanvas.setActiveObject(options.target);
      fabricCanvas.requestRenderAll();
    }
  });

  // 오브젝트 스태킹 순서 변경 시에도 제어점 우선순위 유지
  fabricCanvas.on('object:moved', function(e) {
    const obj = e.target;
    if (obj && obj.controlPoint) {
      obj.controlPoint.bringToFront();
    }
  });

  // 새로운 오브젝트가 추가될 때도 제어점 우선순위 유지
  fabricCanvas.on('object:added', function(e) {
    const obj = e.target;
    if (obj && obj.arrowRef) {
      obj.bringToFront();
    }
  });
}

export { arrowDrawing };
