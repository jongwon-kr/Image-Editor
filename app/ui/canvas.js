import { load } from "../utils/saveInBrowser.js";
/**
 * Canvas section management of image editor
 */
("use strict");

/**
 * Initialize the Fabric.js canvas for the image editor
 * @returns {fabric.Canvas|null} - The initialized Fabric.js canvas instance or null if initialization fails
 */
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

    fabricCanvas.originalW = fabricCanvas.width;
    fabricCanvas.originalH = fabricCanvas.height;
    fabricCanvas.backgroundColor = "#ffffff";

    fabricCanvas.selectionColor = "rgba(0, 120, 215, 0.2)";
    fabricCanvas.selectionBorderColor = "rgba(0, 120, 215, 0.8)";
    fabricCanvas.selectionLineWidth = 1.2;

    // Set up selection style
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerStyle: "circle",
      borderColor: "rgba(0, 120, 215, 0.3)",
      cornerColor: "rgba(0, 120, 215, 0.8)",
      cornerStrokeColor: "#ffffff",
    });

    // Selection events
    fabricCanvas.on("selection:created", (e) =>
      this.setActiveSelection(e.target)
    );
    fabricCanvas.on("selection:updated", (e) =>
      this.setActiveSelection(e.target)
    );
    fabricCanvas.on("selection:cleared", () => this.setActiveSelection(null));

    // Snap to angle on rotate with Shift key
    fabricCanvas.on("object:rotating", (e) => {
      if (e.e.shiftKey) {
        e.target.snapAngle = 15;
      } else {
        e.target.snapAngle = false;
      }
    });

    // Track modifications for undo/redo
    fabricCanvas.on("object:modified", () => {
      console.log("fire: modified");
      const currentState = this.canvas.toJSON();
      this.history.push(JSON.stringify(currentState));
    });

    // Load saved canvas state if available
    const savedCanvas = load("canvasEditor"); // Placeholder: assumes saveInBrowser is defined elsewhere
    if (savedCanvas) {
      fabricCanvas.loadFromJSON(
        savedCanvas,
        fabricCanvas.renderAll.bind(fabricCanvas)
      );
    }

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();

        const objects = fabricCanvas.getObjects();
        const activeObjects = fabricCanvas.getActiveObjects();
        if (objects.length == activeObjects.length) return;

        if (objects.length > 0) {
          objects.forEach((obj)=>{
            fabricCanvas.setActiveObject(obj);
          })
          const selection = new fabric.ActiveSelection(objects);
          fabricCanvas.setActiveObject(selection);
          fabricCanvas.requestRenderAll();
        }
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
