import { imgEditor } from "../index.ts";
import { save, load } from "../utils/saveEdit.js";
import {
  canvasToJsonData,
  removeObjects,
  selectAllObjects,
} from "../utils/utils.js";
import { syncPanelWithSelection } from "./selectionSettings.js";
import { openMenu } from "../utils/contextMenu.ts";

async function canvas() {
  let prevPosition = { left: 0, top: 0 };
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
    const mainPanel = document.querySelector(
      `${this.containerSelector} .main-panel`
    );
    if (!mainPanel) {
      throw new Error(`Main panel not found in ${this.containerSelector}`);
    }

    mainPanel.insertAdjacentHTML(
      "beforeend",
      `<div class="canvas-holder" id="canvas-holder"><div class="content"><canvas id="c"></canvas></div></div>`
    );

    await new Promise((resolve) => {
      const checkCanvas = () => {
        const canvasEl = document.querySelector("#c");
        if (canvasEl) {
          resolve(canvasEl);
        } else {
          setTimeout(checkCanvas, 50);
        }
      };
      checkCanvas();
    });

    const canvasEl = document.querySelector("#c");
    if (!canvasEl) {
      throw new Error("Canvas element with id 'c' not found after retry");
    }

    if (typeof fabric === "undefined") {
      throw new Error("fabric.js is not loaded");
    }

    const fabricCanvas = new fabric.Canvas(canvasEl, {
      selectionFullyContained: true,
      fireRightClick: true,
      stopContextMenu: true,
      enableRetinaScaling: true,
      objectCaching: true,
      width: this.dimensions.width,
      height: this.dimensions.height,
    });

    if (!fabricCanvas || !fabricCanvas.getContext()) {
      throw new Error("Failed to create fabric.Canvas instance or get context");
    }

    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.preserveObjectStacking = true;
    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1;

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
    const customMtrControl = new fabric.Control({
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
    });

    fabric.Object.prototype.controls = {
      ...fabric.Object.prototype.controls,
      mtr: customMtrControl,
    };

    const originalCreateControls =
      fabric.InteractiveFabricObject.createControls;

    fabric.InteractiveFabricObject.createControls = function () {
      const controls = originalCreateControls.call(this);
      controls.controls.mtr = customMtrControl;
      return controls;
    };

    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      transparentCorners: false,
      cornerStyle: "circle",
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: false,
      cornerSize: 10,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#555555",
    };

    fabricCanvas.on("mouse:down", (opt) => {
      if (!isDragging && fabricCanvas.isHandleMode) {
        isDragging = true;
        lastPosX = opt.e.clientX;
        lastPosY = opt.e.clientY;
        fabricCanvas.defaultCursor = "grabbing";
      }
    });

    const exitEditingMode = (target) => {
      if (target && target.isEditing) {
        target.exitEditMode();
      }
    };

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

    fabricCanvas.on("mouse:up", async (opt) => {
      if (opt.e.button === 2) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const activeObject = fabricCanvas.getActiveObject();
        opt.e.preventDefault();
        openMenu(opt, fabricCanvas);
      }

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

        const img = await fabric.FabricImage.fromURL(dataUrl);
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

      fabricCanvas.renderAll();
    });

    fabricCanvas.on("object:added", (e) => {
      const obj = e.target;
      if (!obj.label || obj.label === "") {
        assignObjectLabel(fabricCanvas, obj);
        fabricCanvas.fire("modified");
      }
    });

    fabricCanvas.on("selection:created", (e) => {
      syncSelectionSettingPanel(e);
      this.setActiveTool("select");
    });

    fabricCanvas.on("selection:updated", (e) => {
      syncSelectionSettingPanel(e);
      if (e.deselected) e.deselected.forEach(exitEditingMode);
    });

    fabricCanvas.on("selection:cleared", (e) => {
      if (e.deselected) e.deselected.forEach(exitEditingMode);
    });

    fabricCanvas.on("object:rotating", (e) => {
      e.target.snapAngle = e.e.shiftKey ? 15 : false;
    });

    fabricCanvas.on("object:moving", (e) => {
      const obj = e.target;
      fabricCanvas.renderAll();
    });

    fabricCanvas.on("object:modified", (e) => {
      if (this.history.getValues().redo.length > 0) {
        this.history.push(
          this.history.getValues().redo[
            this.history.getValues().redo.length - 1
          ]
        );
        this.history.clearRedo();
      }
      saveCanvasState(fabricCanvas, this.history);
      fabricCanvas.renderAll();
    });

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

          await fabricCanvas.loadFromJSON(parsedData, async () => {
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

            if (parsedData.backgroundImage?.src) {
              const img = await fabric.FabricImage.fromURL(
                parsedData.backgroundImage.src
              );
              img.set({
                scaleX: scaleX,
                scaleY: scaleY,
                left: 0,
                top: 0,
              });
              fabricCanvas.backgroundImage = img;
              fabricCanvas.originalW = img.width;
              fabricCanvas.originalH = img.height;
            }
            fabricCanvas.originalW = canvasWidth / zoomLevel;
            fabricCanvas.originalH = canvasHeight / zoomLevel;
            fabricCanvas.setViewportTransform(viewportTransform);
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
      });
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
    if (obj.noFocusing) return;

    const typeToKorean = {
      ctextbox: "텍스트",
      polygon: "도형",
      ellipse: "원",
      triangle: "삼각형",
      rect: "사각형",
      image: "이미지",
      group: "그룹",
      curvedline: "곡선",
      arrow: "화살표",
      polypath: "다각형",
      weatherfrontline: "날씨전선",
    };

    let desc = obj.desc || obj.type || "unknown";

    const baseName = typeToKorean[desc] || desc;

    const sameObjects = fabricCanvas
      .getObjects()
      .filter((o) => o.label && o.label.startsWith(baseName));

    const usedNumbers = sameObjects
      .map((o) => {
        const regex = new RegExp(`^${escapeRegExp(baseName)}(?: (\\d+))?$`);
        const match = o.label.match(regex);

        if (!match) return null;
        return match[1] ? parseInt(match[1], 10) : 1;
      })
      .filter((num) => num !== null)
      .sort((a, b) => a - b);

    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    const label =
      usedNumbers.length > 0 ? `${baseName} ${nextNumber}` : baseName;

    obj.set({ label: label });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function saveCanvasState(fabricCanvas, history) {
    if (!fabricCanvas || !history) {
      return;
    }
    const canvasJSON = canvasToJsonData(fabricCanvas);
    canvasJSON.viewportTransform = fabricCanvas.viewportTransform;
    canvasJSON.width = fabricCanvas.getWidth();
    canvasJSON.height = fabricCanvas.getHeight();

    const serializedData = JSON.stringify(canvasJSON);
    history.push(serializedData);
  }

  function handleKeydownEvents(e, fabricCanvas, context) {
    if (
      e.ctrlKey &&
      e.key.toLowerCase() === "a" &&
      !document.querySelector("textarea:focus, input:focus")
    ) {
      e.preventDefault();
      selectAllObjects(fabricCanvas);
    }

    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      const canvasJsonData = canvasToJsonData(fabricCanvas);
      canvasJsonData.objects = canvasJsonData.objects;
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
      e.preventDefault();
      removeObjects(fabricCanvas);
    }

    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          context.setActiveTool("select");
          break;
        case "h":
          context.setActiveTool("hand");
          break;
        case "1":
          context.setActiveTool("ellipse");
          break;
        case "2":
          context.setActiveTool("triangle");
          break;
        case "3":
          context.setActiveTool("rect");
          break;
        case "4":
          context.setActiveTool("shapes");
          break;
        case "5":
          context.setActiveTool("draw");
          break;
        case "6":
          context.setActiveTool("curvedLine");
          break;
        case "7":
          context.setActiveTool("arrow");
          break;
        case "8":
          context.setActiveTool("path");
          break;
        case "9":
          context.setActiveTool("weatherFrontLine");
          break;
      }
    }
  }
}

export { canvas };
