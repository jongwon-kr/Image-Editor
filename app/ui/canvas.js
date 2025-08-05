// @ts-nocheck
import { imgEditor } from "../index.ts";
import { save, load } from "../utils/saveEdit.js";
import {
  canvasToJsonData,
  getControlPoint,
  getFilteredFocusObjects,
  restoreControlPoints,
} from "../utils/utils.js";
import { syncPanelWithSelection } from "./selectionSettings.js";
import {
  attachControlPoints as attachLineControlPoints,
  updateControlPoints as updateLineControlPoints,
} from "../drawing-tools/drawingLine.js";
import {
  attachControlPoints as attachArrowControlPoints,
  updateControlPoints as updateArrowControlPoints,
} from "../drawing-tools/drawingArrow.js";
import { attachControlPoints as attachPathControlPoints } from "../drawing-tools/drawingPath.js";
import {
  attachControlPoints as attachWeatherFrontControlPoints,
  generateWeatherFrontPath,
} from "../drawing-tools/drawingWeatherFront.js";

async function canvas() {
  let prevPosition = { left: 0, top: 0 };
  let guideLines = [];
  let lastMouseX = null;
  let lastMouseY = null;
  let isDraggingObject = false;
  let isDragging = false;
  let lastPosX = 0;
  let lastPosY = 0;
  let startX = 0;
  let startY = 0;
  let cuttingRect = null;

  const svgRotateIcon = encodeURIComponent(`
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d)">
      <circle cx="9" cy="9" r="5" fill="white"/>
      <circle cx="9" cy="9" r="4.75" stroke="black" stroke-opacity="0.3" stroke-width="0.5"/>
    </g>
      <path d="M10.8047 11.1242L9.49934 11.1242L9.49934 9.81885" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.94856 6.72607L8.25391 6.72607L8.25391 8.03142" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.69517 6.92267C10.007 7.03301 10.2858 7.22054 10.5055 7.46776C10.7252 7.71497 10.8787 8.01382 10.9517 8.33642C11.0247 8.65902 11.0148 8.99485 10.9229 9.31258C10.831 9.63031 10.6601 9.91958 10.4262 10.1534L9.49701 11.0421M8.25792 6.72607L7.30937 7.73554C7.07543 7.96936 6.90454 8.25863 6.81264 8.57636C6.72073 8.89408 6.71081 9.22992 6.78381 9.55251C6.8568 9.87511 7.01032 10.174 7.23005 10.4212C7.44978 10.6684 7.72855 10.8559 8.04036 10.9663" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
    <filter id="filter0_d" x="0" y="0" width="18" height="18" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
      <feOffset/>
      <feGaussianBlur stdDeviation="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.137674 0 0 0 0 0.190937 0 0 0 0 0.270833 0 0 0 0.15 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
    </filter>
    </defs>
  </svg>
  `);

  const imgCursor = encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='24' height='24'>
    <defs>
      <filter id='a' width='266.7%' height='156.2%' x='-75%' y='-21.9%' filterUnits='objectBoundingBox'>
        <feOffset dy='1' in='SourceAlpha' result='shadowOffsetOuter1'/>
        <feGaussianBlur in='shadowOffsetOuter1' result='shadowBlurOuter1' stdDeviation='1'/>
        <feColorMatrix in='shadowBlurOuter1' result='shadowMatrixOuter1' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0'/>
        <feMerge>
          <feMergeNode in='shadowMatrixOuter1'/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>
      <path id='b' d='M1.67 12.67a7.7 7.7 0 0 0 0-9.34L0 5V0h5L3.24 1.76a9.9 9.9 0 0 1 0 12.48L5 16H0v-5l1.67 1.67z'/>
    </defs>
    <g fill='none' fill-rule='evenodd'><path d='M0 24V0h24v24z'/>
      <g fill-rule='nonzero' filter='url(#a)' transform='rotate(-90 9.25 5.25)'>
        <use fill='#000' fill-rule='evenodd' xlink:href='#b'/>
        <path stroke='#FFF' d='M1.6 11.9a7.21 7.21 0 0 0 0-7.8L-.5 6.2V-.5h6.7L3.9 1.8a10.4 10.4 0 0 1 0 12.4l2.3 2.3H-.5V9.8l2.1 2.1z'/>
      </g>
    </g>
  </svg>`);

  const rotateIcon = `data:image/svg+xml;utf8,${svgRotateIcon}`;
  const imgIcon = document.createElement("img");
  imgIcon.src = rotateIcon;

  try {
    // main-panel 확인
    const mainPanel = document.querySelector(
      `${this.containerSelector} .main-panel`
    );
    if (!mainPanel) {
      throw new Error(`Main panel not found in ${this.containerSelector}`);
    }

    // 캔버스 홀더 추가
    mainPanel.insertAdjacentHTML(
      "beforeend",
      `<div class="canvas-holder" id="canvas-holder"><div class="content"><canvas id="c"></canvas></div></div>`
    );

    // DOM이 준비될 때까지 대기
    await new Promise((resolve) => {
      const checkCanvas = () => {
        const canvasEl = document.querySelector("#c");
        if (canvasEl) {
          resolve(canvasEl);
        } else {
          setTimeout(checkCanvas, 50); // 50ms 후 재시도
        }
      };
      checkCanvas();
    });

    // 캔버스 요소 확인
    const canvasEl = document.querySelector("#c");
    if (!canvasEl) {
      throw new Error("Canvas element with id 'c' not found after retry");
    }

    // fabric.js 로드 확인
    if (typeof fabric === "undefined") {
      throw new Error("fabric.js is not loaded");
    }

    // fabric.Canvas 생성
    const fabricCanvas = new fabric.Canvas(canvasEl, {
      selectionFullyContained: true,
      fireRightClick: true,
      stopContextMenu: true,
      enableRetinaScaling: true,
      objectCaching: true,
      width: this.dimensions.width,
      height: this.dimensions.height,
    });

    // 캔버스 초기화 확인
    if (!fabricCanvas || !fabricCanvas.getContext()) {
      throw new Error("Failed to create fabric.Canvas instance or get context");
    }

    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      transparentCorners: false,
      cornerStyle: "circle",
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      cornerSize: 11,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#555555",
    };

    // 캔버스 기본 설정
    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.preserveObjectStacking = true;
    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1;

    // 컨트롤 객체 초기화 확인 및 설정
    if (!fabric.Object.prototype.controls) {
      fabric.Object.prototype.controls = {};
    }

    function renderIcon(ctx, left, top, styleOverride, fabricObject) {
      const size = this.cornerSize;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      if (imgIcon.complete && imgIcon.naturalWidth > 0) {
        ctx.drawImage(imgIcon, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.stroke();
      }
      ctx.restore();
    }

    fabric.Object.prototype.controls = {
      ...fabric.Object.prototype.controls,
      mtr: new fabric.Control({
        x: 0,
        y: -0.5,
        offsetX: 0,
        offsetY: -40,
        actionHandler: fabric.controlsUtils?.rotationWithSnapping || (() => {}),
        actionName: "rotate",
        render: renderIcon,
        cursorStyleHandler: (eventData, control, fabricObject) => {
          return fabricObject.lockRotation
            ? "not-allowed"
            : `url("data:image/svg+xml;charset=utf-8,${imgCursor}") 12 12, crosshair`;
        },
        cornerSize: 40,
        withConnection: true,
      }),
    };

    // Textbox 컨트롤 설정
    fabric.Textbox.prototype.controls = {
      ...fabric.Textbox.prototype.controls,
      mtr: fabric.Object.prototype.controls.mtr,
    };

    // Textbox 컨트롤 설정
    fabric.Path.prototype.controls = {
      ...fabric.Textbox.prototype.controls,
      mtr: fabric.Object.prototype.controls.mtr,
    };

    // Rect 컨트롤 설정
    fabric.Rect.prototype.controls = {
      ...fabric.Rect.prototype.controls,
      mtr: fabric.Object.prototype.controls.mtr,
    };

    // 이벤트 핸들러 설정
    fabricCanvas.on("mouse:down", (opt) => {
      opt.e.preventDefault();
      if (opt.e.button === 2) {
        // 우클릭
        return;
      }

      const evt = opt.e;
      const pointer = fabricCanvas.getPointer(evt);
      const zoom = fabricCanvas.getZoom();
      const vpt = fabricCanvas.viewportTransform;
      const activeObject = fabricCanvas.getActiveObject();

      // 컨트롤 드래그인지 확인
      const target = opt.target;
      const isControlDrag = target && target.__corner; // __corner는 컨트롤 드래그 시 설정됨

      if (
        activeObject &&
        !activeObject.isControlPoint &&
        !activeObject.frontShape &&
        !isControlDrag // 컨트롤 드래그가 아닌 경우에만 드래그 허용
      ) {
        lastMouseX = evt.clientX;
        lastMouseY = evt.clientY;
        const hasControlPoints = checkObjectsForControlPoints([activeObject]);
        const isAllSelected =
          fabricCanvas
            .getObjects()
            .filter((obj) => !obj.isControlPoint && !obj.frontShape).length ===
          1;
        // hasControlPoints가 있고 전체 선택이 아니면 드래그 비활성화
        if (!(hasControlPoints && !isAllSelected)) {
          isDraggingObject = true;
        }
      }

      if (fabricCanvas.isHandleMode) {
        isDragging = true;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        fabricCanvas.defaultCursor = "grabbing";
      } else if (fabricCanvas.isCuttingMode) {
        isDragging = true;
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
        fabricCanvas.renderAll();
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

    fabricCanvas.on("mouse:up", async () => {
      if (isDragging && fabricCanvas.isHandleMode) {
        isDragging = false;
        fabricCanvas.defaultCursor = "grab";
        fabricCanvas.renderAll();
      } else if (isDragging && fabricCanvas.isCuttingMode) {
        isDragging = false;
        fabricCanvas.defaultCursor = "default";

        const zoom = fabricCanvas.getZoom();
        const rect = {
          left: cuttingRect.left < 0 ? 0 : cuttingRect.left,
          top: cuttingRect.top < 0 ? 0 : cuttingRect.top,
          width: Math.abs(cuttingRect.width),
          height: Math.abs(cuttingRect.height),
        };

        const dataUrl = fabricCanvas.toDataURL({
          left: rect.left + 1,
          top: rect.top + 1,
          width: rect.width - 1,
          height: rect.height - 1,
          multiplier: zoom,
        });

        fabricCanvas.setDimensions({ width: rect.width, height: rect.height });
        fabricCanvas.originalW = rect.width;
        fabricCanvas.originalH = rect.height;
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        const img = await fabric.FabricImage.fromURL(dataUrl)
          img.set({ scaleX: 1, scaleY: 1, left: 0, top: 0 });
          fabricCanvas.backgroundImage = img;

          fabricCanvas.getObjects().forEach((obj) => {
            fabricCanvas.remove(obj);
          });

          fabricCanvas.fire("object:modified");
          fabricCanvas.renderAll();

        fabricCanvas.remove(cuttingRect);
        cuttingRect = null;

        this.setActiveTool("select");
      } else if (fabricCanvas.isDrawingMode) {
        fabricCanvas.fire("object:modified");
      }

      guideLines.forEach((line) => fabricCanvas.remove(line));
      guideLines = [];
      // ensureFrontShapeVisibility(fabricCanvas);
      fabricCanvas.renderAll();
    });

    fabricCanvas.on("mouse:over", (e) => {
      if (e.target?.isControlPoint) fabricCanvas.bringObjectToFront(e.target);
    });

    fabricCanvas.on("object:added", (e) => {
      const obj = e.target;
      if (obj.frontShape || obj.isControlPoint) return;

      if (obj.isDelete) {
        obj.label = "삭제영역";
        fabricCanvas.fire("modified");
      }

      if (!obj.label || obj.label === "") {
        assignObjectLabel(fabricCanvas, obj);
      }
    });

    fabricCanvas.on("object:removed", (e) => {
      const obj = e.target;
      cleanupObject(fabricCanvas, obj);
    });

    fabricCanvas.on("object:scaling", (e) => {
      const obj = e.target;
      if (obj.isControlPoint || obj.frontShape) return;

      if (
        obj instanceof fabric.ActiveSelection ||
        obj instanceof fabric.Group
      ) {
        processWeatherFronts(obj._objects, fabricCanvas, 0, 0, true);
      } else if (obj.pathType === "weatherFront") {
        if (obj.shapeObjects) {
          obj.shapeObjects.forEach((shape) => {
            if (shape._objects) {
              shape._objects.forEach((subObj) => {
                fabricCanvas.remove(subObj);
              });
            }
            fabricCanvas.remove(shape);
          });
          obj.shapeObjects = [];
        }
      }
      fabricCanvas.renderAll();
    });

    fabricCanvas.on("selection:created", (e) => {
      const activeObject = fabricCanvas.getActiveObject();

      if (
        (activeObject instanceof fabric.ActiveSelection ||
          activeObject instanceof fabric.Group) &&
        activeObject._objects
      ) {
        prevPosition = { left: activeObject.left, top: activeObject.top };
        activeObject.setCoords();
        processWeatherFronts(activeObject._objects, fabricCanvas);
        const isAllSelected =
          activeObject._objects.length ===
          fabricCanvas
            .getObjects()
            .filter((obj) => !obj.isControlPoint && !obj.frontShape).length;
        const hasControlPoints = checkObjectsForControlPoints(
          activeObject._objects
        );
        if (hasControlPoints && !isAllSelected) {
          activeObject.set({
            hasControls: true,
            lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
            hoverCursor: "move",
            evented: true,
          });
        } else {
          activeObject.set({
            hasControls: true,
            lockRotation: hasControlPoints,
            // lockScalingX: hasControlPoints,
            // lockScalingY: hasControlPoints,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        }
      } else if (
        activeObject &&
        !activeObject.isControlPoint &&
        !activeObject.frontShape
      ) {
        const isAllSelected =
          fabricCanvas
            .getObjects()
            .filter((obj) => !obj.isControlPoint && !obj.frontShape).length ===
          1;
        const hasControlPoints = checkObjectsForControlPoints([activeObject]);
        if (hasControlPoints && !isAllSelected) {
          activeObject.set({
            lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
            hoverCursor: "move",
            evented: true,
          });
        } else {
          activeObject.set({
            hasControls: true,
            lockRotation: hasControlPoints,
            // lockScalingX: hasControlPoints,
            // lockScalingY: hasControlPoints,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        }
        this.setActiveSelection(activeObject);
      }

      const remainingFrontShapes = fabricCanvas
        .getObjects()
        .filter((o) => o.frontShape);
      if (remainingFrontShapes.length > 0) {
        const fronts = collectWeatherFronts(fabricCanvas.getObjects());
        remainingFrontShapes.forEach((shape) => {
          const hasMatchingShape = fronts.some((front) =>
            front.shapeObjects?.includes(shape)
          );
          if (!hasMatchingShape) {
            if (shape._objects) {
              shape._objects.forEach((subObj) => {
                fabricCanvas.remove(subObj);
              });
            }
            fabricCanvas.remove(shape);
          }
        });
      }

      syncSelectionSettingPanel(e);
      this.setActiveTool("select");
    });

    fabricCanvas.on("selection:updated", (e) => {
      const activeObject = fabricCanvas.getActiveObject();
      const allControlPoints = getControlPoint();
      if (fabricCanvas.getActiveObjects().length > 1) {
        allControlPoints.forEach((point) => point.set({ visible: false }));
      }

      if (
        (activeObject instanceof fabric.ActiveSelection ||
          activeObject instanceof fabric.Group) &&
        activeObject._objects
      ) {
        prevPosition = { left: activeObject.left, top: activeObject.top };
        activeObject.setCoords();
        processWeatherFronts(activeObject._objects, fabricCanvas);
        const isAllSelected =
          activeObject._objects.length ===
          fabricCanvas
            .getObjects()
            .filter((obj) => !obj.isControlPoint && !obj.frontShape).length;
        const hasControlPoints = checkObjectsForControlPoints(
          activeObject._objects
        );
        if (hasControlPoints && !isAllSelected) {
          activeObject.set({
            hasControls: true,
            lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
            hoverCursor: "move",
            evented: true,
          });
        } else {
          activeObject.set({
            hasControls: true,
            lockRotation: hasControlPoints,
            // lockScalingX: hasControlPoints,
            // lockScalingY: hasControlPoints,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        }
      } else if (
        activeObject &&
        !activeObject.isControlPoint &&
        !activeObject.frontShape
      ) {
        const isAllSelected =
          fabricCanvas
            .getObjects()
            .filter((obj) => !obj.isControlPoint && !obj.frontShape).length ===
          1;
        const hasControlPoints = checkObjectsForControlPoints([activeObject]);
        if (hasControlPoints && !isAllSelected) {
          activeObject.set({
            lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
            hoverCursor: "move",
            evented: true,
          });
        } else {
          activeObject.set({
            hasControls: true,
            lockRotation: hasControlPoints,
            // lockScalingX: hasControlPoints,
            // lockScalingY: hasControlPoints,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        }
        this.setActiveSelection(activeObject);
      }

      syncSelectionSettingPanel(e);
    });

    fabricCanvas.on("object:rotating", (e) => {
      e.target.snapAngle = e.e.shiftKey ? 15 : false;
    });

    fabricCanvas.on("object:moving", (e) => {
      const obj = e.target;
      if (obj.isControlPoint || obj.frontShape) return;

      manageGuideLines(fabricCanvas, obj, guideLines);

      let deltaX = 0;
      let deltaY = 0;
      if (isDraggingObject && lastMouseX !== null && lastMouseY !== null) {
        const currentMouseX = e.e.clientX;
        const currentMouseY = e.e.clientY;
        deltaX = (currentMouseX - lastMouseX) / fabricCanvas.getZoom();
        deltaY = (currentMouseY - lastMouseY) / fabricCanvas.getZoom();
        lastMouseX = currentMouseX;
        lastMouseY = currentMouseY;
      }

      if (
        obj instanceof fabric.ActiveSelection ||
        obj instanceof fabric.Group
      ) {
        processWeatherFronts(obj._objects, fabricCanvas, deltaX, deltaY);
      }

      fabricCanvas.renderAll();
    });

    fabricCanvas.on("object:modified", (e) => {
      const activeObject = fabricCanvas.getActiveObject();
      if (
        (activeObject instanceof fabric.ActiveSelection ||
          activeObject instanceof fabric.Group) &&
        activeObject._objects
      ) {
        const currentPosition = {
          left: activeObject.left,
          top: activeObject.top,
        };
        const deltaX = currentPosition.left - prevPosition.left;
        const deltaY = currentPosition.top - prevPosition.top;

        const groupTransform = activeObject.calcTransformMatrix();
        processObjects(activeObject._objects, fabricCanvas, deltaX, deltaY);
        // activeObject._objects.forEach((obj) => {
        //   if (
        //     obj.pathType === "weatherFront" &&
        //     (obj.scaleX !== 1 || obj.scaleY !== 1)
        //   ) {
        //     if (obj.shapeObjects) {
        //       obj.shapeObjects.forEach((shape) => fabricCanvas.remove(shape));
        //       obj.shapeObjects = [];
        //     }
        //     applyWeatherFrontScaling(obj, fabricCanvas, groupTransform);
        //   }
        // });
        prevPosition = { left: currentPosition.left, top: currentPosition.top };
      }

      fabricCanvas
        .getObjects()
        .filter((obj) => obj.noFocusing)
        .forEach((obj) => {
          obj.selectable = false;
          obj.evented = false;
          obj.noFocusing = true;
        });

      if (this.history.getValues().redo.length > 0) {
        this.history.clearRedo();
      }
      saveCanvasState(fabricCanvas, this.history);
      fabricCanvas.renderAll();
    });

    // 캔버스 초기화 및 저장된 데이터 로드
    const savedCanvas = load("canvasEditor");
    if (savedCanvas) {
      try {
        let parsedData;
        if (typeof savedCanvas === "string") {
          parsedData = JSON.parse(savedCanvas);
        } else {
          console.error("유효하지 않은 savedCanvas 형식:", savedCanvas);
          return;
        }

        if (parsedData && typeof parsedData === "object") {
          fabricCanvas.clear();

          const viewportTransform = parsedData.viewportTransform || [
            1, 0, 0, 1, 0, 0,
          ];
          const zoomLevel = viewportTransform[0] || 1;

          const canvasWidth =
            parsedData.width ||
            parsedData.backgroundImage?.width *
              parsedData.backgroundImage?.scaleX ||
            fabricCanvas.originalW ||
            1280;
          const canvasHeight =
            parsedData.height ||
            parsedData.backgroundImage?.height *
              parsedData.backgroundImage?.scaleY ||
            fabricCanvas.originalH ||
            720;
          const scaleX = parsedData.backgroundImage?.scaleX || 1;
          const scaleY = parsedData.backgroundImage?.scaleY || 1;

          fabricCanvas.setWidth(canvasWidth);
          fabricCanvas.setHeight(canvasHeight);
          fabricCanvas.originalW = canvasWidth;
          fabricCanvas.originalH = canvasHeight;

          const widthInput = document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-width`
          );
          const heightInput = document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-height`
          );
          if (widthInput && heightInput) {
            widthInput.value = Math.round(canvasWidth);
            heightInput.value = Math.round(canvasHeight);
          }

          await fabricCanvas.loadFromJSON(parsedData,async  () => {
            if (parsedData.backgroundImage?.src) {
              const img = await fabric.FabricImage.fromURL(parsedData.backgroundImage.src);
              img.set({
                    scaleX: scaleX,
                    scaleY: scaleY,
                    left: 0,
                    top: 0,
              })
              fabricCanvas.backgroundImage = img;
              imgEditor.applyZoom(zoomLevel);
            }
          });
          fabricCanvas.renderAll();
        } else {
          console.error("유효하지 않은 parsedData:", parsedData);
        }
      } catch (error) {
        console.error("저장된 캔버스 데이터 로드 실패:", error);
      }
    }

    setTimeout(() => {
      fabricCanvas._objects.forEach((obj) => {
        if (obj.noFocusing) {
          obj.selectable = false;
          obj.evented = false;
        }
        restoreControlPoints(fabricCanvas, obj);
      });
      processWeatherFronts(fabricCanvas.getObjects(), fabricCanvas);
      saveCanvasState(fabricCanvas, this.history);
    }, 100);

    document.querySelector("#canvas-holder").addEventListener("click", (e) => {
      if (e.target.id === "canvas-holder") {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
    });

    document.addEventListener("keydown", (e) => {
      handleKeydownEvents(e, fabricCanvas, this);
    });

    mainPanel.insertAdjacentHTML(
      "afterend",
      '<div id="footer-bar" class="toolbar"></div>'
    );

    return fabricCanvas;
  } catch (error) {
    console.error("Can't create canvas instance:", error);
    return null;
  }

  function syncSelectionSettingPanel(e) {
    if (
      (imgEditor.activeSelection =
        e.selected.length === 1 ? e.selected[0] : e.target)
    ) {
      syncPanelWithSelection(imgEditor);
    }
  }

  function assignObjectLabel(fabricCanvas, obj) {
    let labelPrefix = "도형";
    let desc = obj.desc || obj.type || "unknown";

    if (desc === "textbox") labelPrefix = "텍스트";
    else if (desc === "polygon") labelPrefix = "도형";
    else if (desc === "image") labelPrefix = "이미지";
    else if (desc === "group") labelPrefix = "그룹";
    else if (desc === "path") {
      if (obj.pathType === "polygon") labelPrefix = "다각형";
      else if (obj.pathType === "arrow") labelPrefix = "화살표";
      else if (obj.pathType === "line") labelPrefix = "선";
      else labelPrefix = "도형";
    }

    const sameObjects = fabricCanvas
      .getObjects()
      .filter(
        (o) =>
          o.label &&
          (o.label.startsWith(desc) || o.label.startsWith(labelPrefix)) &&
          !o.frontShape &&
          !o.isControlPoint
      );

    const usedNumbers = sameObjects
      .map((o) => {
        const match = o.label.match(
          new RegExp(`^(?:${desc}|${labelPrefix})(?: (\\d+))?$`)
        );
        return match && match[1] ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num !== null)
      .sort((a, b) => a - b);

    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    const label = usedNumbers.includes(0)
      ? `${desc} ${nextNumber}`
      : desc === obj.type
      ? `${labelPrefix} ${nextNumber}`
      : desc;
    obj.set({ label });
  }

  function cleanupObject(fabricCanvas, obj) {
    if (!fabricCanvas || !obj || obj.isControlPoint || obj.noFocusing) return;

    if (obj.controlPoints) {
      obj.controlPoints.forEach((point) => {
        fabricCanvas.remove(point);
      });
      obj.controlPoints = [];
    }

    if (obj.shapeObjects) {
      obj.shapeObjects.forEach((shape) => {
        if (shape._objects) {
          shape._objects.forEach((subObj) => {
            fabricCanvas.remove(subObj);
          });
        }
        fabricCanvas.remove(shape);
      });
      obj.shapeObjects = [];
    }

    const remainingFrontShapes = fabricCanvas
      .getObjects()
      .filter((o) => o.frontShape);
    if (remainingFrontShapes.length > 0) {
      const fronts = collectWeatherFronts(fabricCanvas.getObjects());
      remainingFrontShapes.forEach((shape) => {
        const hasMatchingShape = fronts.some((front) =>
          front.shapeObjects?.includes(shape)
        );
        if (!hasMatchingShape) {
          if (shape._objects) {
            shape._objects.forEach((subObj) => {
              fabricCanvas.remove(subObj);
            });
          }
          fabricCanvas.remove(shape);
        }
      });
    }

    fabricCanvas.discardActiveObject();
  }

  function collectWeatherFronts(objects) {
    let fronts = [];
    objects.forEach((o) => {
      if (o.pathType === "weatherFront") {
        fronts.push(o);
      }
      if (o.type === "group" && o._objects) {
        fronts = fronts.concat(collectWeatherFronts(o._objects));
      }
    });
    return fronts;
  }

  function manageGuideLines(fabricCanvas, obj, guideLines) {
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
    guideLines.length = 0;

    if (Math.abs(objCenterX - canvasCenterX) < snapThreshold) {
      obj.set({ left: canvasCenterX - objWidth / 2 });
      guideLines.push(
        new fabric.Line([canvasCenterX, 0, canvasCenterX, canvasHeight], {
          stroke: "rgba(0, 120, 215, 0.8)",
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
          noFocusing: true,
        })
      );
    }
    if (Math.abs(objCenterY - canvasCenterY) < snapThreshold) {
      obj.set({ top: canvasCenterY - objHeight / 2 });
      guideLines.push(
        new fabric.Line([0, canvasCenterY, canvasWidth, canvasCenterY], {
          stroke: "rgba(0, 120, 215, 0.8)",
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
          noFocusing: true,
        })
      );
    }

    guideLines.forEach((line) => fabricCanvas.add(line));
  }

  function ensureFrontShapeVisibility(fabricCanvas) {
    fabricCanvas
      .getObjects()
      .filter((obj) => obj.frontShape)
      .forEach((obj) => {
        obj.visible = true;
      });
  }

  function saveCanvasState(fabricCanvas, history) {
    if (!fabricCanvas || !history) {
      return;
    }
    const canvasJSON = canvasToJsonData(fabricCanvas);
    canvasJSON.objects = canvasJSON.objects.filter(
      (obj) => !obj.isControlPoint && !obj.frontShape
    );
    canvasJSON.viewportTransform = fabricCanvas.viewportTransform;
    canvasJSON.width = fabricCanvas.getWidth();
    canvasJSON.height = fabricCanvas.getHeight();

    const serializedData = JSON.stringify(canvasJSON);
    history.push(serializedData);
    console.log(history.getValues());
  }

  function handleKeydownEvents(e, fabricCanvas, context) {
    if (
      e.ctrlKey &&
      e.key.toLowerCase() === "a" &&
      !document.querySelector("textarea:focus, input:focus")
    ) {
      e.preventDefault();
      const objects = getFilteredFocusObjects().filter(
        (obj) => !obj.isControlPoint && !obj.frontShape && obj.visible
      );

      if (objects.length === 1) {
        fabricCanvas.setActiveObject(objects[0]);
      } else if (
        objects.length > 1 &&
        objects.length !== fabricCanvas.getActiveObjects().length
      ) {
        fabricCanvas.discardActiveObject();
        const selection = new fabric.ActiveSelection(objects, {
          canvas: fabricCanvas,
        });
        // 전체 선택 시 이동 가능하도록 설정
        selection.set({
          hasControls: true,
          lockRotation: checkObjectsForControlPoints(objects),
          // lockScalingX: checkObjectsForControlPoints(objects),
          // lockScalingY: checkObjectsForControlPoints(objects),
          hoverCursor: "move",
          selectable: true,
          evented: true,
        });
        fabricCanvas.setActiveObject(selection);
        fabricCanvas.renderAll();
      }
    }

    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      const canvasJsonData = canvasToJsonData(fabricCanvas);
      canvasJsonData.objects = canvasJsonData.objects.filter(
        (obj) => !obj.isControlPoint && !obj.frontShape
      );
      canvasJsonData.viewportTransform = fabricCanvas.viewportTransform;
      canvasJsonData.width = fabricCanvas.getWidth();
      canvasJsonData.height = fabricCanvas.getHeight();

      const serializedData = JSON.stringify(canvasJsonData);
      save("canvasEditor", serializedData);
      const saveMessage = document.createElement("div");
      saveMessage.textContent = "저장되었습니다";
      saveMessage.className = "message";
      document.body.appendChild(saveMessage);
      setTimeout(() => (saveMessage.style.opacity = "1"), 10);
      setTimeout(() => {
        saveMessage.style.opacity = "0";
        setTimeout(() => saveMessage.remove(), 1000);
      }, 1000);
    }

    const key = e.which || e.keyCode;
    if (document.querySelector("textarea:focus, input:focus")) return;
    const activeObject = fabricCanvas.getActiveObject();

    if ([37, 38, 39, 40].includes(key) && activeObject) {
      e.preventDefault();
      activeObject.left += key === 37 ? -1 : key === 39 ? 1 : 0;
      activeObject.top += key === 38 ? -1 : key === 40 ? 1 : 0;
      activeObject.setCoords();
      fabricCanvas.fire("object:modified");
      fabricCanvas.renderAll();
    }

    if (key === 46) {
      if (fabricCanvas.getActiveObjects().length > 0) {
        e.preventDefault();
        const activeObjects = fabricCanvas.getActiveObjects();
        fabricCanvas.discardActiveObject();
        activeObjects.forEach((obj) => fabricCanvas.remove(obj));
        fabricCanvas.renderAll();
        fabricCanvas.fire("object:modified");
      }
    }

    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          context.setActiveTool("select");
          break;
        case "h":
          context.setActiveTool("hand");
          break;
      }
    }
  }
}

function processObjects(objects, fabricCanvas, dx = 0, dy = 0) {
  const objectArray = Array.isArray(objects) ? objects : [objects];

  objectArray.forEach((obj) => {
    if (!obj) {
      console.error("Invalid object:", obj);
      return;
    }

    if (obj.type === "group" && obj._objects) {
      processObjects(obj._objects, fabricCanvas, dx, dy);
    } else {
      updateObjectCoordinates(obj, fabricCanvas, dx, dy);
    }
  });
}

function updateObjectCoordinates(obj, fabricCanvas, dx, dy) {
  if (obj.isControlPoint || obj.frontShape) return;

  if (obj.type === "path") {
    if (obj.pathType === "line" || obj.pathType === "arrow") {
      const startPoint = obj.p0
        ? { x: obj.p0.left + dx + 7.5, y: obj.p0.top + dy + 7.5 }
        : null;
      const endPoint = obj.p2
        ? { x: obj.p2.left + dx + 7.5, y: obj.p2.top + dy + 7.5 }
        : null;
      const midPoint = obj.p1
        ? { x: obj.p1.left + dx + 7.5, y: obj.p1.top + dy + 7.5 }
        : null;

      if (obj.p0) fabricCanvas.remove(obj.p0);
      if (obj.p1) fabricCanvas.remove(obj.p1);
      if (obj.p2) fabricCanvas.remove(obj.p2);

      const attachControlPointsFunc =
        obj.pathType === "line"
          ? attachLineControlPoints
          : attachArrowControlPoints;
      attachControlPointsFunc(
        fabricCanvas,
        obj,
        startPoint,
        endPoint,
        midPoint,
        0,
        0
      );

      const updateControlPointsFunc =
        obj.pathType === "line"
          ? updateLineControlPoints
          : updateArrowControlPoints;
      updateControlPointsFunc(obj);
    } else if (obj.pathType === "polygon") {
      obj.path.forEach((segment) => {
        if (segment[0] === "M" || segment[0] === "L") {
          segment[1] += dx;
          segment[2] += dy;
        } else if (segment[0] === "Q") {
          segment[1] += dx;
          segment[2] += dy;
          segment[3] += dx;
          segment[4] += dy;
        }
      });
      obj.pathOffset.x += dx;
      obj.pathOffset.y += dy;

      attachPathControlPoints(fabricCanvas, obj);
    } else if (obj.pathType === "weatherFront") {
      obj.path.forEach((segment) => {
        if (segment[0] === "M" || segment[0] === "L") {
          segment[1] += dx;
          segment[2] += dy;
        } else if (segment[0] === "Q") {
          segment[1] += dx;
          segment[2] += dy;
          segment[3] += dx;
          segment[4] += dy;
        }
      });
      obj.pathOffset.x += dx;
      obj.pathOffset.y += dy;
      attachWeatherFrontControlPoints(fabricCanvas, obj);
      generateWeatherFrontPath(obj, fabricCanvas);
    }
  }
}

function processWeatherFronts(
  objects,
  fabricCanvas,
  deltaX = 0,
  deltaY = 0,
  removeOnly = false
) {
  objects.forEach((obj) => {
    if (obj.type === "group" && obj._objects) {
      processWeatherFronts(
        obj._objects,
        fabricCanvas,
        deltaX,
        deltaY,
        removeOnly
      );
    } else if (obj.pathType === "weatherFront") {
      if (obj.shapeObjects) {
        if (removeOnly) {
          obj.isScaledInGroup = true;
          obj.shapeObjects.forEach((shape) => {
            if (shape._objects) {
              shape._objects.forEach((subObj) => {
                fabricCanvas.remove(subObj);
              });
            }
            fabricCanvas.remove(shape);
          });
          obj.shapeObjects = [];
        } else if (obj.pathType === "weatherFront") {
          if (obj.shapeObjects && (deltaX !== 0 || deltaY !== 0)) {
            obj.shapeObjects.forEach((shape) => {
              shape.set({
                left: shape.left + deltaX,
                top: shape.top + deltaY,
              });
              shape.setCoords();
            });
          } else {
            generateWeatherFrontPath(obj, fabricCanvas);
          }
        }
      }
    }
  });
}

function checkObjectsForControlPoints(objects) {
  return objects.some((obj) => {
    if (obj.type === "group" && obj._objects) {
      return checkObjectsForControlPoints(obj._objects);
    }
    if (obj.pathType) {
      return true;
    } else {
      return false;
    }
  });
}

export { canvas, processWeatherFronts, processObjects };
