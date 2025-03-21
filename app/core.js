import { shapes } from "./drawing-tools/shapes.js";
import { lineDrawing } from "./drawing-tools/drawingLine.js";
import { arrowDrawing } from "./drawing-tools/drawingArrow.js";
import { pathDrawing } from "./drawing-tools/drawingPath.js";
import { textBoxDrawing } from "./drawing-tools/drawingText.js";
import { tipPanel } from "./ui/tip.js";
import { weatherData } from "./ui/weatherData.js";
import { images } from "./ui/images.js";
import { canvas } from "./ui/canvas.js";
import { toolbar } from "./ui/toolbar.js";
import { freeDrawSettings } from "./ui/freeDrawSettings.js";
import { canvasSettings } from "./ui/canvasSettings.js";
import { selectionSettings } from "./ui/selectionSettings.js";
import { copyPaste } from "./utils/copyPaste.js";
import { zoom } from "./utils/zoom.js";
import { templates } from "./ui/templates.js";
import { fullscreen } from "./utils/fullScreen.js";
import { layerListPanel } from "./ui/layerListPanel.js";
import { getOverlayImages } from "./utils/utils.js";

/**
 * @param {String} containerSelector jquery selector for image editor container
 * @param {Object} dimensions define canvas dimensions
 * @param {Array} buttons define toolbar buttons
 * @param {Array} shapes define shapes
 * @param {Array} images define upload images
 * @param {Array} templates define templates
 */
class ImageEditor {
  constructor(containerSelector, options) {
    const { dimensions, buttons, shapes, images, templates } = options;
    this.containerSelector = containerSelector;
    this.containerEl = $(containerSelector);

    this.dimensions = {
      width: dimensions && dimensions.width > 0 ? dimensions.width : 1280,
      height: dimensions && dimensions.height > 0 ? dimensions.height : 720,
    };
    this.buttons = buttons;
    this.shapes = shapes;
    this.images = images;
    this.templates = templates;
    this.containerEl.addClass("default-container");

    this.canvas = null;
    this.activeTool = null;
    this.activeSelection = null;
    this.history = null;
  }

  getCanvasJSON = () => {
    return this.canvas.toJSON();
  };

  setCanvasJSON = (current) => {
    current &&
      this.canvas.loadFromJSON(
        JSON.parse(current),
        this.canvas.renderAll.bind(this.canvas)
      );
  };

  setActiveTool = (id) => {
    this.activeTool = id;

    const toolPanels = document.querySelectorAll(
      `${this.containerSelector} .toolpanel`
    );
    toolPanels.forEach((panel) => panel.classList.remove("visible"));

    if (id !== "select" || (id == "select" && this.activeSelection)) {
      const selectedPanel = document.querySelector(
        `${this.containerSelector} .toolpanel#${id}-panel`
      );
      if (selectedPanel) {
        selectedPanel.classList.add("visible");

        if (id === "select") {
          console.log("selection");
          selectedPanel.className = `toolpanel visible type-${this.activeSelection.type}`;
          console.log(
            "this.canvas.getActiveObjects()",
            this.canvas.getActiveObjects()
          );
        }
      }
    }

    if (id !== "select") {
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.activeSelection = null;
    }

    this.canvas.isDrawingLineMode = false;
    this.canvas.isDrawingPathMode = false;
    this.canvas.isDrawingMode = false;
    this.canvas.isDrawingTextMode = false;
    this.canvas.isDrawingArrowMode = false;
    this.canvas.defaultCursor = "default";
    this.canvas.selection = true;

    this.canvas.forEachObject((o) => {
      o.selectable = true;
      o.evented = true;
    });

    getOverlayImages().forEach((o) => {
      o.selectable = false;
      o.evented = false;
    });

    switch (id) {
      case "draw":
        this.canvas.isDrawingMode = true;
        break;
      case "line":
        this.canvas.isDrawingLineMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        break;
      case "arrow":
        this.canvas.isDrawingArrowMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        break;
      case "path":
        this.canvas.isDrawingPathMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 클릭하여 좌표를 배치하고, 클릭을 유지하면 곡선을 그릴 수 있습니다! 바깥쪽을 클릭하거나 Esc 키를 눌러 취소하세요!"
        );
        break;
      case "textbox":
        this.canvas.isDrawingTextMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        break;
      default:
        this.updateTip(
          "Tip: Shift를 누르고 각도 조절을 하면 15°씩 조절할 수 있습니다."
        );
        break;
    }
  };

  undo = () => {
    console.log("undo");
    try {
      const undoList = this.history.getValues().undo;
      if (undoList.length) {
        const current = undoList[undoList.length - 1];
        this.history.undo();
        current &&
          this.canvas.loadFromJSON(JSON.parse(current), () => {
            this.canvas.getObjects().forEach((obj) => {
              if (obj.noFocusing) {
                obj.selectable = false;
                obj.evented = false;
              }
            });
            this.canvas.renderAll();
            console.log(this.canvas.getObjects());
          });
      }
    } catch (_) {
      console.error("undo failed");
    }
  };

  redo = () => {
    console.log("redo");
    try {
      const redoList = this.history.getValues().redo;
      if (redoList.length) {
        const current = redoList[redoList.length - 1];
        this.history.redo();
        current &&
          this.canvas.loadFromJSON(JSON.parse(current), () => {
            this.canvas.getObjects().forEach((obj) => {
              if (obj.noFocusing) {
                obj.selectable = false;
                obj.evented = false;
              }
            });
            this.canvas.renderAll();
            console.log(this.canvas.getObjects());
          });
      }
    } catch (_) {
      console.error("redo failed");
    }
  };

  setActiveSelection = (activeSelection) => {
    this.activeSelection = activeSelection;
    this.setActiveTool("select");
  };

  configUndoRedoStack = () => {
    this.history = window.UndoRedoStack();
    const ctrZY = (e) => {
      const key = e.which || e.keyCode;
      if (
        e.ctrlKey &&
        document.querySelectorAll("textarea:focus, input:focus").length === 0
      ) {
        if (key === 90) this.undo();
        if (key === 89) this.redo();
      }
    };
    document.addEventListener("keydown", ctrZY);
  };

  // Initialization Methods
  initializeTipSection() {
    tipPanel.call(this);
  }

  initializeShapes() {
    shapes.call(this);
  }

  initializeLineDrawing() {
    lineDrawing(this.canvas);
  }

  initializeArrowDrawing() {
    arrowDrawing(this.canvas);
  }

  initializePathDrawing() {
    pathDrawing(this.canvas);
  }

  initializeTextBoxDrawing() {
    textBoxDrawing(this.canvas);
  }

  initializeWeatherData() {
    weatherData.call(this);
  }

  initializeImages() {
    images.call(this);
  }

  initializeCopyPaste() {
    copyPaste.call(this, this.canvas);
  }

  initializeToolbar() {
    toolbar.call(this);
  }

  initializeFreeDrawSettings() {
    freeDrawSettings.call(this);
  }

  initializeCanvasSettings() {
    canvasSettings.call(this);
  }

  initializeSelectionSettings() {
    selectionSettings.call(this);
  }

  initializeCanvas() {
    return canvas.call(this);
  }

  initializeTemplates() {
    templates.call(this);
  }

  initializeFullScreen() {
    fullscreen.call(this);
  }

  initializeLayerListPanel() {
    layerListPanel.call(this);
  }

  initializeMainPanel() {
    document
      .querySelector(this.containerSelector)
      .insertAdjacentHTML("beforeend", '<div class="main-panel"></div>');
  }

  initializeZoom() {
    zoom.call(this);
  }

  initializeHideShowToolPanel() {
    document
      .querySelectorAll(`${this.containerSelector} .toolpanel .content`)
      .forEach((panel) => {
        panel.insertAdjacentHTML(
          "beforeend",
          `<div class="hide-show-handler"></div>`
        );
      });

    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel .content .hide-show-handler`
      )
      .forEach((handler) => {
        handler.addEventListener("click", function () {
          const panel = handler.closest(".toolpanel");
          panel.classList.toggle("closed");
        });
      });
  }

  initializeNumberInput() {
    document
      .querySelectorAll(`${this.containerSelector} .decrease`)
      .forEach((decBtn) => {
        decBtn.addEventListener("click", function () {
          const input = decBtn
            .closest(".custom-number-input")
            .querySelector("input[type=number]");
          const step = input.getAttribute("step") || 1;
          const stepFloat = parseFloat(step);
          const val = parseFloat(input.value);
          input.value = (val - stepFloat).toFixed(
            step.toString().split(".")[1]?.length || 0
          );
          input.dispatchEvent(new Event("change"));
        });
      });

    document
      .querySelectorAll(`${this.containerSelector} .increase`)
      .forEach((incBtn) => {
        incBtn.addEventListener("click", function () {
          const input = incBtn
            .closest(".custom-number-input")
            .querySelector("input[type=number]");
          const step = input.getAttribute("step") || 1;
          const stepFloat = parseFloat(step);
          const val = parseFloat(input.value);
          input.value = (val + stepFloat).toFixed(
            step.toString().split(".")[1]?.length || 0
          );
          input.dispatchEvent(new Event("change"));
        });
      });
  }

  init() {
    this.initializeToolbar();
    this.initializeMainPanel();
    this.initializeShapes();
    this.initializeFreeDrawSettings();
    this.initializeCanvasSettings();
    this.canvas = this.initializeCanvas();

    this.initializeSelectionSettings();
    this.initializeCopyPaste();
    this.initializeLayerListPanel();
    this.initializeLineDrawing();
    this.initializeArrowDrawing();
    this.initializePathDrawing();
    this.initializeTextBoxDrawing();
    this.initializeWeatherData();
    this.initializeImages();
    this.initializeTipSection();
    this.initializeZoom();
    this.configUndoRedoStack();
    try {
      this.initializeTemplates();
    } catch (error) {
      console.error("can't initialize templates", error);
    }
    this.initializeFullScreen();
    this.initializeHideShowToolPanel();
    this.initializeNumberInput();
  }
}

export { ImageEditor };
