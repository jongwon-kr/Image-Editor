import { save, load } from "../utils/saveInBrowser.js";
import { getControlPoint, getFilteredFocusObjects } from "../utils/utils.js";

function canvas() {
  try {
    const mainPanel = document.querySelector(
      `${this.containerSelector} .main-panel`
    );
    mainPanel.insertAdjacentHTML(
      "beforeend",
      `<div class="canvas-holder" id="canvas-holder"><div class="content"><canvas id="c"></canvas></div></div>`
    );

    const fabricCanvas = new fabric.Canvas("c").setDimensions(this.dimensions);

    // JSON 직렬화 확장
    fabricCanvas.toJSON = (function (originalFn) {
      return function (propertiesToInclude) {
        return originalFn.call(this, [
          ...(propertiesToInclude || []),
          "noFocusing",
          "overlayImage",
          "label",
          "params",
          "apiType",
          "isControlPoint",
        ]);
      };
    })(fabricCanvas.toJSON);

    // 캔버스 기본 설정
    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.preserveObjectStacking = true;
    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1.2;

    // 객체 기본 설정
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerStyle: "circle",
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#555555",
    });

    // 캔버스 외부 클릭 시 선택 해제
    document.querySelector("#canvas-holder").addEventListener("click", (e) => {
      if (e.target.id === "canvas-holder")
        fabricCanvas.discardActiveObject().requestRenderAll();
    });

    // 선택 이벤트
    fabricCanvas.on("selection:created", (e) => {
      if (e.target && !e.target.isControlPoint) {
        this.setActiveSelection(e.target);
        fabricCanvas.fire("object:modified");
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      const allControlPoints = getControlPoint();
      if (fabricCanvas.getActiveObjects().length > 1) {
        allControlPoints.forEach((point) => point.set({ visible: false }));
      }
      if (e.target && !e.target.isControlPoint) {
        this.setActiveSelection(e.target);
        fabricCanvas.fire("object:modified");
      }
    });

    // 스냅 및 가이드라인 관련 함수
    const createGuideLine = (x1, y1, x2, y2) => {
      return new fabric.Line([x1, y1, x2, y2], {
        stroke: "rgba(0, 120, 215, 0.8)",
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        noFocusing: true,
      });
    };

    let guideLines = [];

    fabricCanvas.on("object:rotating", (e) => {
      e.target.snapAngle = e.e.shiftKey ? 15 : false;
    });

    fabricCanvas.on("object:moving", (e) => {
      const obj = e.target;
      if (obj.isControlPoint) return;

      const canvasWidth = fabricCanvas.originalW;
      const canvasHeight = fabricCanvas.originalH;
      const snapThreshold = 5;

      const objWidth = obj.getScaledWidth();
      const objHeight = obj.getScaledHeight();
      const objCenterX = obj.left + objWidth / 2;
      const objCenterY = obj.top + objHeight / 2;
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      guideLines.forEach((line) => fabricCanvas.remove(line));
      guideLines = [];

      if (Math.abs(objCenterX - canvasCenterX) < snapThreshold) {
        obj.set({ left: canvasCenterX - objWidth / 2 });
        guideLines.push(
          createGuideLine(canvasCenterX, 0, canvasCenterX, canvasHeight)
        );
      }
      if (Math.abs(objCenterY - canvasCenterY) < snapThreshold) {
        obj.set({ top: canvasCenterY - objHeight / 2 });
        guideLines.push(
          createGuideLine(0, canvasCenterY, canvasWidth, canvasCenterY)
        );
      }

      guideLines.forEach((line) => fabricCanvas.add(line));
      obj.setCoords();
      fabricCanvas.renderAll();
    });

    fabricCanvas.on("object:modified", () => {
      fabricCanvas
        .getObjects()
        .filter((obj) => obj.noFocusing)
        .forEach((obj) => {
          obj.selectable = false;
          obj.evented = false;
          obj.noFocusing = true;
        });
      this.history.push(JSON.stringify(fabricCanvas.toJSON()));
    });

    const savedCanvas = load("canvasEditor");
    if (savedCanvas) {
      fabricCanvas.loadFromJSON(savedCanvas, () => {
        fabricCanvas.getObjects().forEach((obj) => {
          if (obj.noFocusing) {
            obj.selectable = false;
            obj.evented = false;
          }
        });
        fabricCanvas.renderAll();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "a" &&
        !document.querySelector("textarea:focus, input:focus")
      ) {
        e.preventDefault();
        const objects = getFilteredFocusObjects().filter(
          (obj) => !obj.isControlPoint
        );
        if (
          objects.length &&
          objects.length !== fabricCanvas.getActiveObjects().length
        ) {
          const selection = new fabric.ActiveSelection(objects, {
            canvas: fabricCanvas,
          });
          fabricCanvas.setActiveObject(selection).requestRenderAll();
        }
      }

      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save("canvasEditor", fabricCanvas.toJSON());
        const saveMessage = document.createElement("div");
        saveMessage.textContent = "저장되었습니다";
        saveMessage.className = "message";
        document.body.appendChild(saveMessage);
        setTimeout(() => (saveMessage.style.opacity = "1"), 10);
        setTimeout(() => {
          saveMessage.style.opacity = "0";
          setTimeout(() => saveMessage.remove(), 300);
        }, 600);
      }

      const key = e.which || e.keyCode;
      if (document.querySelector("textarea:focus, input:focus")) return;
      const activeObject = fabricCanvas.getActiveObject();

      if ([37, 38, 39, 40].includes(key) && activeObject) {
        e.preventDefault();
        activeObject.left += key === 37 ? -1 : key === 39 ? 1 : 0;
        activeObject.top += key === 38 ? -1 : key === 40 ? 1 : 0;
        activeObject.setCoords();
        fabricCanvas.renderAll();
        fabricCanvas.fire("object:modified");
      }

      if (key === 46) {
        fabricCanvas
          .getActiveObjects()
          .forEach((obj) => fabricCanvas.remove(obj));
        fabricCanvas.discardActiveObject().requestRenderAll();
        fabricCanvas.fire("object:modified");
      }
    });

    setTimeout(
      () => this.history.push(JSON.stringify(fabricCanvas.toJSON())),
      1000
    );

    mainPanel.insertAdjacentHTML(
      "afterend",
      '<div id="footer-bar" class="toolbar"></div>'
    );

    fabricCanvas.on("mouse:down", (options) => {
      if (options.target?.isControlPoint) {
        options.target.bringToFront();
        fabricCanvas.setActiveObject(options.target).renderAll();
      }
    });

    fabricCanvas.on("mouse:over", (e) => {
      if (e.target?.isControlPoint) e.target.bringToFront();
    });

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    let startX = 0;
    let startY = 0;
    let cuttingRect = null;

    fabricCanvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      const pointer = fabricCanvas.getPointer(evt);
      const zoom = fabricCanvas.getZoom();
      const vpt = fabricCanvas.viewportTransform;

      if (fabricCanvas.isHandleMode) {
        isDragging = true;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        fabricCanvas.defaultCursor = "grabbing";
      } else if (fabricCanvas.isCuttingMode) {
        isDragging = true;
        // 캔버스 좌표로 변환 (줌과 뷰포트 이동 보정)
        startX = (pointer.x * zoom - vpt[4]) / zoom;
        startY = (pointer.y * zoom - vpt[5]) / zoom;
        cuttingRect = new fabric.Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "red",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        fabricCanvas.add(cuttingRect);
      }
    });

    fabricCanvas.on("mouse:move", (opt) => {
      const evt = opt.e;
      const pointer = fabricCanvas.getPointer(evt);

      if (isDragging && fabricCanvas.isHandleMode) {
        const vpt = fabricCanvas.viewportTransform;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        fabricCanvas.setViewportTransform(vpt);
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        fabricCanvas.requestRenderAll();
      } else if (isDragging && fabricCanvas.isCuttingMode) {
        cuttingRect.set({
          width: pointer.x > startX ? pointer.x - startX : startX - pointer.x,
          height: pointer.y > startY ? pointer.y - startY : startY - pointer.y,
          left: pointer.x < startX ? pointer.x : startX,
          top: pointer.y < startY ? pointer.y : startY,
        });
        fabricCanvas.renderAll();
      }
    });

    fabricCanvas.on("mouse:up", () => {
      if (isDragging && fabricCanvas.isHandleMode) {
        isDragging = false;
        fabricCanvas.defaultCursor = "grab";
        fabricCanvas.requestRenderAll();
      } else if (isDragging && fabricCanvas.isCuttingMode) {
        isDragging = false;
        fabricCanvas.defaultCursor = "default";

        // 현재 줌 레벨과 뷰포트 이동 값 가져오기
        const zoom = fabricCanvas.getZoom();

        // 드래그한 영역 계산 (줌과 뷰포트 이동 이미 반영됨)
        const rect = {
          left: cuttingRect.left < 0 ? 0 : cuttingRect.left, // 캔버스 경계 보정
          top: cuttingRect.top < 0 ? 0 : cuttingRect.top, // 캔버스 경계 보정
          width: Math.abs(cuttingRect.width),
          height: Math.abs(cuttingRect.height),
        };

        // 자른 영역을 데이터 URL로 변환
        const dataUrl = fabricCanvas.toDataURL({
          left: rect.left + 1,
          top: rect.top + 1,
          width: rect.width - 1,
          height: rect.height - 1,
          multiplier: zoom,
        });

        // 캔버스 크기 설정
        const prevWidth = fabricCanvas.getWidth() / zoom;
        const prevHeight = fabricCanvas.getHeight() / zoom;
        fabricCanvas.setDimensions({ width: rect.width, height: rect.height });
        fabricCanvas.originalW = rect.width;
        fabricCanvas.originalH = rect.height;

        // 뷰포트 초기화
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        // 배경 이미지 설정
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ scaleX: 1, scaleY: 1, left: 0, top: 0 });
          fabricCanvas.setBackgroundImage(
            img,
            fabricCanvas.renderAll.bind(fabricCanvas)
          );

          // 기존 객체 제거
          fabricCanvas.getObjects().forEach((obj) => {
            fabricCanvas.remove(obj);
          });

          fabricCanvas.fire("object:modified");
          fabricCanvas.renderAll();
        });

        fabricCanvas.remove(cuttingRect);
        cuttingRect = null;

        this.setActiveTool("select");
      }

      guideLines.forEach((line) => fabricCanvas.remove(line));
      guideLines = [];
      fabricCanvas.renderAll();
    });

    return fabricCanvas;
  } catch (error) {
    console.error("Can't create canvas instance:", error);
    return null;
  }
}

export { canvas };
