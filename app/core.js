import { shapes } from "./drawing-tools/shapes.js";
import { lineDrawing } from "./drawing-tools/drawingLine.js";
import { pathDrawing } from "./drawing-tools/drawingPath.js";
import { textBoxDrawing } from "./drawing-tools/drawingText.js";
import { tipPanel } from "./ui/tip.js";
import { upload } from "./ui/upload.js";
import { canvas } from "./ui/canvas.js";
import { toolbar } from "./ui/toolbar.js";
import { freeDrawSettings } from "./ui/freeDrawSettings.js";
import { canvasSettings } from "./ui/canvasSettings.js";
import { selectionSettings } from "./ui/selectionSettings.js";
import { copyPaste } from "./utils/copyPaste.js";
import { zoom } from "./utils/zoom.js";
import { templates } from "./ui/templates.js";

/**
 * Image Editor class
 * @param {String} containerSelector jquery selector for image editor container
 * @param {Array} buttons define toolbar buttons
 * @param {Array} shapes define shapes
 * @param {Array} templates define templates
 */
export class ImageEditor {
  constructor(containerSelector, options) {
    const { buttons, shapes, templates } = options;
    this.containerSelector = containerSelector;
    this.containerEl = $(containerSelector);

    this.buttons = buttons;
    this.shapes = shapes;
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
    $(`${this.containerSelector} .toolpanel`).removeClass('visible');
    if (id !== 'select' || (id == 'select' && this.activeSelection)) {
      $(`${this.containerSelector} .toolpanel#${id}-panel`).addClass('visible');
      if (id === 'select') {
        console.log('selection')
        $(`${this.containerSelector} .toolpanel#${id}-panel`).attr('class', `toolpanel visible type-${this.activeSelection.type}`)
      }
    }

    if (id !== 'select') {
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.activeSelection = null;
    }

    this.canvas.isDrawingLineMode = false;
    this.canvas.isDrawingPathMode = false;
    this.canvas.isDrawingMode = false;
    this.canvas.isDrawingTextMode = false;

    this.canvas.defaultCursor = 'default';
    this.canvas.selection = true;
    this.canvas.forEachObject(o => {
      o.selectable = true;
      o.evented = true;
    })

    switch (id) {
      case 'draw':
        this.canvas.isDrawingMode = true;
        break;
      case 'line':
        this.canvas.isDrawingLineMode = true
        this.canvas.defaultCursor = 'crosshair'
        this.canvas.selection = false
        this.canvas.forEachObject(o => {
          o.selectable = false
          o.evented = false
        });
        break;
      case 'path':
        this.canvas.isDrawingPathMode = true
        this.canvas.defaultCursor = 'crosshair'
        this.canvas.selection = false
        this.canvas.forEachObject(o => {
          o.selectable = false
          o.evented = false
        });
        this.updateTip('Tip: click to place points, press and pull for curves! Click outside or press Esc to cancel!');
        break;
      case 'textbox':
        this.canvas.isDrawingTextMode = true
        this.canvas.defaultCursor = 'crosshair'
        this.canvas.selection = false
        this.canvas.forEachObject(o => {
          o.selectable = false
          o.evented = false
        });
        break;
      case 'upload':
        this.openDragDropPanel();
        break;
      default:
        this.updateTip('Tip: hold Shift when drawing a line for 15° angle jumps!');
        break;
    }
  }

  undo = () => {
    console.log("undo");
    try {
      const undoList = this.history.getValues().undo;
      if (undoList.length) {
        const current = undoList[undoList.length - 1];
        this.history.undo();
        current &&
          this.canvas.loadFromJSON(
            JSON.parse(current),
            this.canvas.renderAll.bind(this.canvas)
          );
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
          this.canvas.loadFromJSON(
            JSON.parse(current),
            this.canvas.renderAll.bind(this.canvas)
          );
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

  initializePathDrawing() {
    pathDrawing(this.canvas);
  }

  initializeTextBoxDrawing() {
    textBoxDrawing(this.canvas);
  }

  initializeUpload() {
    upload.call(this, this.canvas);
  }

  initializeCopyPaste() {
    copyPaste(this.canvas);
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

  initializeMainPanel() {
    document
      .querySelector(this.containerSelector)
      .insertAdjacentHTML("beforeend", '<div class="main-panel"></div>');
  }

  initializeZoom() {
    zoom.call(this);
  }

  initializeHideShowToolPanel() {
    // Renamed from extendHideShowToolPanel for consistency
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
    // Renamed from extendNumberInput for consistency
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

  openDragDropPanel() {
    console.log("Drag and drop panel should be implemented in upload.js");
  }

  init() {
    this.configUndoRedoStack();
    this.initializeToolbar();
    this.initializeMainPanel();
    this.initializeShapes();
    this.initializeFreeDrawSettings();
    this.initializeCanvasSettings();
    this.initializeSelectionSettings();
    this.canvas = this.initializeCanvas();
    this.initializeLineDrawing();
    this.initializePathDrawing();
    this.initializeTextBoxDrawing();
    this.initializeUpload();
    this.initializeCopyPaste();
    this.initializeTipSection();
    this.initializeZoom();
    try {
      this.initializeTemplates();
    } catch (error) {
      console.error("can't initialize templates", error);
    }

    this.initializeHideShowToolPanel();
    this.initializeNumberInput();
  }
}
