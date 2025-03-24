import { save, load } from "../utils/saveInBrowser.js";
import {
  getFilteredFocusObjects,
  getFilteredNoFocusObjects,
} from "../utils/utils.js";

/**
 * 캔버스
 */
("use strict");

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

    fabricCanvas.toJSON = (function (originalFn) {
      return function (propertiesToInclude) {
        return originalFn.call(this, [
          ...(propertiesToInclude || []),
          "noFocusing",
          "overlayImage",
          "label",
          "params",
          "apiType",
          "isControlPoint", // 추가
        ]);
      };
    })(fabricCanvas.toJSON);

    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";

    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1.2;

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

    fabricCanvas.on("selection:created", (e) => {
      console.log("selection:created - e.target:", e.target); // 디버깅용
      if (e.target) {
        if (!e.target.isControlPoint) {
          console.log("Selected non-control object:", e.target);
          this.setActiveSelection(e.target);
          fabricCanvas.fire("object:modified");
        } else {
          console.log("Selected control point:", e.target.name);
        }
      } else {
        console.log("e.target is undefined in selection:created");
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      console.log("selection:updated - e.target:", e.target); // 디버깅용
      if (e.target && !e.target.isControlPoint) {
        this.setActiveSelection(e.target);
        fabricCanvas.fire("object:modified");
      }
    });

    let guideLines = [];
    let isSnapping = false;

    fabricCanvas.on("object:rotating", (e) => {
      isSnapping = true;
      if (e.e.shiftKey) {
        e.target.snapAngle = 15;
      } else {
        e.target.snapAngle = false;
      }
      isSnapping = false;
    });

    const removeGuideLines = () => {
      guideLines.forEach((line) => fabricCanvas.remove(line));
      guideLines = [];
      fabricCanvas.renderAll();
    };

    const addGuideLine = (x1, y1, x2, y2) => {
      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: "rgba(0, 120, 215, 0.8)",
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        noFocusing: true,
      });
      fabricCanvas.add(line);
      guideLines.push(line);
    };

    fabricCanvas.on("object:moving", (e) => {
      if (isSnapping) return;
      const obj = e.target;

      if (obj.isControlPoint) {
        return;
      }

      const canvasWidth = fabricCanvas.originalW;
      const canvasHeight = fabricCanvas.originalH;
      const snapThreshold = 5;

      let objects = getFilteredNoFocusObjects().filter(
        (obj) => !obj.isControlPoint
      );

      removeGuideLines();

      const objWidth = obj.getScaledWidth();
      const objHeight = obj.getScaledHeight();
      const objLeft = obj.left;
      const objTop = obj.top;
      const objCenterX = objLeft + objWidth / 2;
      const objCenterY = objTop + objHeight / 2;

      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      if (Math.abs(objCenterX - canvasCenterX) < snapThreshold) {
        obj.set({ left: canvasCenterX - objWidth / 2 });
        addGuideLine(canvasCenterX, 0, canvasCenterX, canvasHeight);
      }

      if (Math.abs(objCenterY - canvasCenterY) < snapThreshold) {
        obj.set({ top: canvasCenterY - objHeight / 2 });
        addGuideLine(0, canvasCenterY, canvasWidth, canvasCenterY);
      }

      if (Math.abs(objLeft) < snapThreshold) {
        obj.set({ left: 0 });
        addGuideLine(0, 0, 0, canvasHeight);
      }
      if (Math.abs(objLeft + objWidth - canvasWidth) < snapThreshold) {
        obj.set({ left: canvasWidth - objWidth });
        addGuideLine(canvasWidth - 1, 0, canvasWidth - 1, canvasHeight);
      }
      if (Math.abs(objTop) < snapThreshold) {
        obj.set({ top: 0 });
        addGuideLine(0, 0, canvasWidth, 0);
      }
      if (Math.abs(objTop + objHeight - canvasHeight) < snapThreshold) {
        obj.set({ top: canvasHeight - objHeight });
        addGuideLine(0, canvasHeight - 1, canvasWidth, canvasHeight - 1);
      }

      obj.setCoords();
      fabricCanvas.renderAll();
    });

    fabricCanvas.on("mouse:up", () => {
      removeGuideLines();
    });

    fabricCanvas.on("object:modified", () => {
      console.log("fire: modified");
      let objects = fabricCanvas.getObjects().filter((obj) => obj.noFocusing);
      objects.forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
        obj.noFocusing = true;
      });
      const currentState = fabricCanvas.toJSON();
      this.history.push(JSON.stringify(currentState));
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
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const objects = getFilteredFocusObjects();
        const activeObjects = fabricCanvas.getActiveObjects();
        if (objects.length === activeObjects.length) return;

        if (objects.length > 0) {
          objects.forEach((obj) => fabricCanvas.setActiveObject(obj));
          const selection = new fabric.ActiveSelection(objects, {
            canvas: fabricCanvas,
          });
          fabricCanvas.setActiveObject(selection);
          fabricCanvas.requestRenderAll();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
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
    });

    document.addEventListener("keydown", (e) => {
      const key = e.which || e.keyCode;
      let activeObject;
      if (document.querySelectorAll("textarea:focus, input:focus").length > 0)
        return;

      if (key === 37 || key === 38 || key === 39 || key === 40) {
        e.preventDefault();
        activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;
      }

      if (key === 37) activeObject.left -= 1;
      else if (key === 39) activeObject.left += 1;
      else if (key === 38) activeObject.top -= 1;
      else if (key === 40) activeObject.top += 1;

      if (key === 37 || key === 38 || key === 39 || key === 40) {
        activeObject.setCoords();
        fabricCanvas.renderAll();
        fabricCanvas.fire("object:modified");
      }
    });

    document.addEventListener("keydown", (e) => {
      const key = e.which || e.keyCode;
      if (
        key === 46 &&
        document.querySelectorAll("textarea:focus, input:focus").length === 0
      ) {
        fabricCanvas.getActiveObjects().forEach((obj) => {
          fabricCanvas.remove(obj);
        });
        fabricCanvas.discardActiveObject().requestRenderAll();
        fabricCanvas.fire("object:modified");
      }
    });

    setTimeout(() => {
      const currentState = fabricCanvas.toJSON();
      this.history.push(JSON.stringify(currentState));
    }, 1000);

    mainPanel.insertAdjacentHTML(
      "afterend",
      '<div id="footer-bar" class="toolbar"></div>'
    );

    fabricCanvas.on("mouse:down", function (options) {
      if (!options.target) return;
      if (options.target.isControlPoint) {
        options.target.bringToFront();
        fabricCanvas.setActiveObject(options.target);
        fabricCanvas.renderAll();
        return;
      }
    });

    fabricCanvas.on("mouse:over", function (e) {
      if (e.target && e.target.isControlPoint) {
        e.target.bringToFront();
      }
    });

    return fabricCanvas;
  } catch (_) {
    console.error("can't create canvas instance");
    return null;
  }
}

export { canvas };