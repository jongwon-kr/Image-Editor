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

    // Initialize Fabric.js canvas
    const fabricCanvas = new fabric.Canvas("c").setDimensions(this.dimensions);

    // 속성 직렬화 -> undo/redo시 객체의 속성 초기화 문제
    fabricCanvas.toJSON = (function (originalFn) {
      return function (propertiesToInclude) {
        return originalFn.call(this, [
          ...(propertiesToInclude || []),
          "noFocusing",
          "overlayImage",
          "label",
          "params", // 적용안되는중
          "apiType",  // 적용안되는중
        ]);
      };
    })(fabricCanvas.toJSON);

    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";

    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1.2;

    // Set up selection style
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerStyle: 'circle',
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#000000',
      borderColor: '#555555'
    });

    // Selection events
    fabricCanvas.on("selection:created", (e) => {
      this.setActiveSelection(e.target);
      fabricCanvas.trigger("object:modified");
    });
    fabricCanvas.on("selection:updated", (e) => {
      this.setActiveSelection(e.target);
      fabricCanvas.trigger("object:modified");
    });

    // Guide lines array to manage them
    let guideLines = [];
    let isSnapping = false;

    // Snap to angle on rotate with Shift key
    fabricCanvas.on("object:rotating", (e) => {
      isSnapping = true;
      if (e.e.shiftKey) {
        e.target.snapAngle = 15;
      } else {
        e.target.snapAngle = false;
      }
      isSnapping = false;
    });

    // Function to remove all guide lines
    const removeGuideLines = () => {
      guideLines.forEach((line) => fabricCanvas.remove(line));
      guideLines = [];
      fabricCanvas.renderAll();
    };

    // Function to add a guide line
    const addGuideLine = (x1, y1, x2, y2) => {
      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: "rgba(0, 120, 215, 0.8)",
        strokeWidth: 1,
        strokeDashArray: [5, 5], // Dashed line
        selectable: false,
        evented: false,
        excludeFromExport: true,
        noFocusing: true,
      });
      fabricCanvas.add(line);
      guideLines.push(line);
    };

    // Snap to center and edges while moving
    fabricCanvas.on("object:moving", (e) => {
      if (isSnapping) return;

      const obj = e.target;
      const canvasWidth = fabricCanvas.originalW;
      const canvasHeight = fabricCanvas.originalH;
      const snapThreshold = 5; // 20px snapping threshold

      let objects = getFilteredNoFocusObjects();
      objects.forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
        obj.noFocusing = true;
      });
      // Remove existing guide lines before recalculating
      removeGuideLines();

      // Get object bounds
      const objWidth = obj.getScaledWidth();
      const objHeight = obj.getScaledHeight();
      const objLeft = obj.left;
      const objTop = obj.top;
      const objCenterX = objLeft + objWidth / 2;
      const objCenterY = objTop + objHeight / 2;

      // Canvas center points
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      // Snap to horizontal center
      if (Math.abs(objCenterX - canvasCenterX) < snapThreshold) {
        obj.set({
          left: canvasCenterX - objWidth / 2,
        });
        addGuideLine(canvasCenterX, 0, canvasCenterX, canvasHeight); // Vertical guide line
      }

      // Snap to vertical center
      if (Math.abs(objCenterY - canvasCenterY) < snapThreshold) {
        obj.set({
          top: canvasCenterY - objHeight / 2,
        });
        addGuideLine(0, canvasCenterY, canvasWidth, canvasCenterY); // Horizontal guide line
      }

      // Snap to edges
      // Left edge
      if (Math.abs(objLeft) < snapThreshold) {
        obj.set({ left: 0 });
        addGuideLine(0, 0, 0, canvasHeight); // Left vertical guide
      }
      // Right edge
      if (Math.abs(objLeft + objWidth - canvasWidth) < snapThreshold) {
        obj.set({ left: canvasWidth - objWidth });
        addGuideLine(canvasWidth - 1, 0, canvasWidth - 1, canvasHeight); // Right vertical guide
      }
      // Top edge
      if (Math.abs(objTop) < snapThreshold) {
        obj.set({ top: 0 });
        addGuideLine(0, 0, canvasWidth, 0); // Top horizontal guide
      }
      // Bottom edge
      if (Math.abs(objTop + objHeight - canvasHeight) < snapThreshold) {
        obj.set({ top: canvasHeight - objHeight });
        addGuideLine(0, canvasHeight - 1, canvasWidth, canvasHeight - 1); // Bottom horizontal guide
      }

      obj.setCoords(); // Update object coordinates
      fabricCanvas.renderAll();
    });

    // Clear guide lines when movement stops
    fabricCanvas.on("mouse:up", () => {
      removeGuideLines();
    });

    // Track modifications for undo/redo
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

    // Load saved canvas state if available
    const savedCanvas = load("canvasEditor");
    if (savedCanvas) {
      fabricCanvas.loadFromJSON(savedCanvas, () => {
        // 로드 후 객체 속성 복원
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
        if (objects.length == activeObjects.length) return;

        if (objects.length > 0) {
          objects.forEach((obj) => {
            fabricCanvas.setActiveObject(obj);
          });
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

        setTimeout(() => {
          saveMessage.style.opacity = "1";
        }, 10);

        setTimeout(() => {
          saveMessage.style.opacity = "0";
          setTimeout(() => {
            saveMessage.remove();
          }, 300);
        }, 600);
      }
    });

    // Move objects with arrow keys
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

      if (key === 37) {
        activeObject.left -= 1; // Left arrow
      } else if (key === 39) {
        activeObject.left += 1; // Right arrow
      } else if (key === 38) {
        activeObject.top -= 1; // Up arrow
      } else if (key === 40) {
        activeObject.top += 1; // Down arrow
      }

      if (key === 37 || key === 38 || key === 39 || key === 40) {
        activeObject.setCoords();
        fabricCanvas.renderAll();
        fabricCanvas.fire("object:modified");
      }
    });

    // Delete object with Delete key
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

    // Save initial state after a delay
    setTimeout(() => {
      const currentState = fabricCanvas.toJSON();
      this.history.push(JSON.stringify(currentState));
    }, 1000);

    // create footer bar
    mainPanel.insertAdjacentHTML(
      "afterend",
      '<div id="footer-bar" class="toolbar"></div>'
    );
    return fabricCanvas;
  } catch (_) {
    console.error("can't create canvas instance");
    return null;
  }
}

export { canvas };
