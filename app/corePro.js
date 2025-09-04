import { initializeShapes } from "./drawing-tools/shapes.js";
import { curvedLineDrawing } from "./drawing-tools/drawingCurvedLine.js";
import { arrowDrawing } from "./drawing-tools/drawingArrow.js";
import { polyPathDrawing } from "./drawing-tools/drawingPolyPath.js";
import { textBoxDrawing } from "./drawing-tools/drawingText.js";
import { weatherFrontLineDrawing } from "./drawing-tools/drawingWeatherFrontLine.js";

import { defaultTips, tipPanel } from "./ui/tip.js";
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
import { testPanel } from "./ui/testPanel.js";
import { fetchEditData } from "./ui/EditRepository.js";
import { ellipseDrawing } from "./drawing-tools/drawingEllipse.js";
import { triangleDrawing } from "./drawing-tools/drawingTriangle.js";
import { rectDrawing } from "./drawing-tools/drawingRect.js";
import { ICONS } from "./models/Icons.ts";
import { autoAlignment } from "./utils/autoAlignment.js";

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
    const { dimensions, buttons, shapes, images, templates, edits } = options;
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
    this.edits = edits;
    this.containerEl.addClass("default-container");

    this.canvas = null;
    this.activeTool = null;
    this.activeSelection = null;
    this.history = null;
  }

  getCanvasJSON = () => {
    const canvasJSON = this.canvas.toJSON([
      "id",
      "noFocusing",
      "path",
      "label",
      "desc",
      "apiType",
      "params",
      "name",
      "visible",
      "overlayImage",
      "isReflect",
      "isFreeDrawn",
    ]);
    canvasJSON.viewportTransform = this.canvas.viewportTransform;
    canvasJSON.width = this.canvas.getWidth();
    canvasJSON.height = this.canvas.getHeight();
    return JSON.stringify(canvasJSON);
  };

  setCanvasJSON = async (current) => {
    if (!current) return;

    try {
      const parsedJSON = JSON.parse(current);
      parsedJSON.viewportTransform = this.canvas.viewportTransform;
      parsedJSON.width = this.canvas.getWidth();
      parsedJSON.height = this.canvas.getHeight();
      await this.canvas.loadFromJSON(parsedJSON, async () => {
        if (parsedJSON.backgroundImage?.src) {
          const img = await fabric.FabricImage.fromURL(
            parsedJSON.backgroundImage.src
          );
          img.set({
            scaleX: parsedJSON.backgroundImage.scaleX || 1,
            scaleY: parsedJSON.backgroundImage.scaleY || 1,
            left: parsedJSON.backgroundImage.left || 0,
            top: parsedJSON.backgroundImage.top || 0,
          });
          this.canvas.backgroundImage = img;
        }
      });
      this.canvas._objects.forEach((obj) => {
        if (obj.noFocusing) {
          obj.selectable = false;
          obj.evented = false;
        }
      });
      const viewportTransform = parsedJSON.viewportTransform || [
        1, 0, 0, 1, 0, 0,
      ];
      const zoomLevel = viewportTransform[0] || 1;

      const canvasWidth = parsedJSON.width;
      const canvasHeight = parsedJSON.height;

      this.canvas.originalW = canvasWidth / zoomLevel;
      this.canvas.originalH = canvasHeight / zoomLevel;
      this.canvas.setViewportTransform(viewportTransform);
      this.applyZoom(zoomLevel);

      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to load canvas JSON:", error);
      throw error;
    }
  };

  setActiveTool = (id) => {
    this.activeTool = id;

    document
      .querySelectorAll(`${this.containerSelector} #toolbar button`)
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(`${this.containerSelector} #toolbar button`)
      .forEach((btn) => {
        if (btn.id === id) {
          btn.classList.add("active");
        }
      });

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
          selectedPanel.className = `toolpanel visible type-${this.activeSelection.type}`;
        }
      }
    }

    if (id !== "select") {
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.activeSelection = null;
    }

    this.canvas.isHandleMode = false;
    this.canvas.isCuttingMode = false;
    this.canvas.isColorFilterMode = false;
    this.canvas.isDrawingEllipseMode = false;
    this.canvas.isDrawingTriangleMode = false;
    this.canvas.isDrawingRectMode = false;
    this.canvas.isDrawingCurvedLineMode = false;
    this.canvas.isDrawingArrowMode = false;
    this.canvas.isDrawingPolyPathMode = false;
    this.canvas.isDrawingWeatherFrontLineMode = false;
    this.canvas.isDrawingMode = false;
    this.canvas.isDrawingTextMode = false;
    this.canvas.defaultCursor = "default";
    this.canvas.selection = true;

    this.canvas.forEachObject((o) => {
      if (!o.noFocusing) {
        o.selectable = true;
        o.evented = true;
      }
    });

    if (id !== "draw" && this.cleanupDrawMode) {
      this.cleanupDrawMode();
    }

    switch (id) {
      case "select":
        this.canvas.defaultCursor = "default";
        this.canvas.forEachObject(function (o) {
          o.hoverCursor = "move";
        });
        if (this.canvas.getActiveObjects().length > 0) {
          this.updateTip(
            defaultTips[parseInt(Math.random() * defaultTips.length)]
          );
        } else {
          this.updateTip(
            "Tip: 캔버스 내 객체를 선택하여 작업할 수 있어요!. ALT + S를 눌러 이 도구를 선택할 수 있습니다."
          );
        }
        break;
      case "hand":
        this.canvas.isHandleMode = true;
        this.canvas.defaultCursor = "grab";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그로 자유롭게 캔버스를 이동하세요! ALT + H를 눌러 이 도구를 선택할 수 있습니다."
        );
        break;
      case "cut":
        this.canvas.isCuttingMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.fitZoom();
        this.updateTip("Tip: 확대 배율을 100%로 설정 후 자르기를 해주세요!");
        break;
      case "colorFilter":
        this.canvas.isColorFilterMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip("Tip: 색상을 선택하세요!");
        break;
      case "shapes":
        this.updateTip(
          "Tip: 도형 그리기 패널의 도형을 클릭하여 캔버스에 추가할 수 있습니다."
        );
        break;
      case "ellipse":
        this.canvas.isDrawingEllipseMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그를 통해 타원을 그릴 수 있습니다. shift를 누른 채 그리면 원을 그릴 수 있습니다."
        );
        break;
      case "triangle":
        this.canvas.isDrawingTriangleMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그를 통해 삼각형을 그릴 수 있습니다. shift를 누른 채 그리면 정삼각형을 그릴 수 있습니다."
        );
        break;
      case "rect":
        this.canvas.isDrawingRectMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그를 통해 사각형을 그릴 수 있습니다. shift를 누른 채 그리면 정사각형을 그릴 수 있습니다."
        );
        break;
      case "draw":
        this.canvas.isDrawingMode = true;
        if (this.activateDrawMode) {
          this.activateDrawMode();
        }
        this.updateTip(
          "Tip: 드래그로 자유롭게 그릴 수 있어요! 지우개 모드로 전환도 가능합니다."
        );
        break;
      case "curvedLine":
        this.canvas.isDrawingCurvedLineMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그로 곡선을 그리고 제어점을 이용해 곡선을 수정할 수 있습니다!"
        );
        break;
      case "arrow":
        this.canvas.isDrawingArrowMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그로 화살표를 그리고 제어점을 이용해 수정할 수 있습니다!"
        );
        break;
      case "path":
        this.canvas.isDrawingPolyPathMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 클릭하여 좌표를 배치하고, 바깥쪽을 클릭하거나 Esc 키를 눌러 완성하세요!"
        );
        break;
      case "weatherFrontLine":
        this.canvas.isDrawingWeatherFrontLineMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 클릭하여 좌표를 배치하고, 바깥쪽을 클릭하거나 Esc 키를 눌러 완성하세요! 이후 다른 전선으로 수정할 수 있습니다."
        );
        break;
      case "ctextbox":
        this.canvas.isDrawingTextMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 클릭하여 해당 위치에 텍스트 박스를 생성할 수 있습니다. 드래그로 크기를 지정할 수도 있어요"
        );
        break;
      case "images":
        this.updateTip(
          "Tip: 좌측 패널에 내 저장소의 이미지들이 표시됩니다. 이미지를 클릭하여 추가할 수 있어요!"
        );
        break;
      case "templates":
        this.updateTip(
          "Tip: 좌측 패널에 기본 템플릿들이 표시됩니다. 템플릿을 클릭하여 추가할 수 있어요!"
        );
        break;
      case "background":
        this.updateTip(
          "Tip: 캔버스 사이즈를 조절하거나 배경이미지를 설정할 수 있습니다."
        );
        break;
      default:
        this.updateTip(
          "Tip: Shift를 누르고 각도 조절을 하면 15°씩 조절할 수 있습니다."
        );
        break;
    }
  };

  undo = async () => {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const undoList = this.history.getValues().undo;
      if (!undoList.length) {
        this.isProcessing = false;
        return;
      }
      const current = undoList[undoList.length - 1];
      if (!current) {
        this.isProcessing = false;
        return;
      }

      this.history.undo();
      await this.setCanvasJSON(current);
    } catch (error) {
      console.error("undo failed:", error);
    } finally {
      this.setActiveTool(this.activeTool);
      this.isProcessing = false;
    }
  };

  redo = async () => {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const redoList = this.history.getValues().redo;
      if (!redoList.length) {
        this.isProcessing = false;
        return;
      }
      const current = redoList[redoList.length - 1];
      if (!current) {
        this.isProcessing = false;
        return;
      }

      this.history.redo();
      await this.setCanvasJSON(current);
    } catch (error) {
      console.error("redo failed:", error);
    } finally {
      this.setActiveTool(this.activeTool);
      this.isProcessing = false;
    }
  };

  updateCanvasFromJSON = async (json) => {
    try {
      const currentObjects = this.canvas.getObjects().reduce((map, obj) => {
        if (obj.id) map[obj.id] = obj;
        return map;
      }, {});

      const newObjects = await new Promise((resolve) => {
        fabric.util.enlivenObjects(json.objects, (objects) => {
          resolve(objects);
        });
      });

      const objectsToAdd = [];
      const objectsToRemove = [];

      newObjects.forEach((newObj) => {
        if (!newObj.id) {
          console.warn("Object missing id:", newObj);
          objectsToAdd.push(newObj);
          return;
        }

        const currentObj = currentObjects[newObj.id];
        if (currentObj) {
          const hasChanges = this.updateObjectProperties(currentObj, newObj);
          if (hasChanges) {
            objectsToRemove.push(currentObj);
            objectsToAdd.push(newObj);
          }
          delete currentObjects[newObj.id];
        } else {
          objectsToAdd.push(newObj);
        }
      });

      Object.values(currentObjects).forEach((obj) => {
        if (!obj.noFocusing) {
          objectsToRemove.push(obj);
        }
      });

      objectsToRemove.forEach((obj) => {
        this.canvas.remove(obj);
      });

      objectsToAdd.forEach((obj) => {
        if (obj.noFocusing) {
          obj.selectable = false;
          obj.evented = false;
        }
        this.canvas.add(obj);
      });

      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to update canvas from JSON:", error);
      throw error;
    }
  };

  updateObjectProperties = (currentObj, newObj) => {
    const allProps = new Set([
      ...Object.keys(currentObj.toObject()),
      ...Object.keys(newObj.toObject()),
      "noFocusing",
      "path",
      "label",
      "desc",
      "apiType",
      "params",
    ]);

    for (const prop of allProps) {
      const currentValue = currentObj[prop];
      const newValue = newObj[prop];

      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        return true;
      }
    }

    return false;
  };

  configUndoRedoStack = () => {
    this.history = window.UndoRedoStack();
    this.isProcessing = false;

    const handleKeyDown = (e) => {
      const key = e.which || e.keyCode;
      if (
        e.ctrlKey &&
        document.querySelectorAll("textarea:focus, input:focus").length === 0 &&
        !this.isProcessing
      ) {
        e.preventDefault();
        if (key === 90 && this.history.getValues().undo.length > 0) {
          this.undo();
        } else if (key === 89 && this.history.getValues().redo.length > 0) {
          this.redo();
        }
      }
    };

    document.removeEventListener("keydown", this._handleKeyDown);

    this._handleKeyDown = handleKeyDown;
    document.addEventListener("keydown", handleKeyDown);
  };

  setActiveSelection = (activeSelection) => {
    this.activeSelection = activeSelection;
    this.setActiveTool("select");
  };

  initializeTipSection() {
    tipPanel.call(this);
  }

  initializeEllipseDrawing() {
    ellipseDrawing(this.canvas);
  }

  initializeTriangleDrawing() {
    triangleDrawing(this.canvas);
  }

  initializeRectDrawing() {
    rectDrawing(this.canvas);
  }

  initializeShapes() {
    initializeShapes(this);
  }

  initializeCurvedLineDrawing() {
    curvedLineDrawing(this.canvas);
  }

  initializeArrowDrawing() {
    arrowDrawing.call(this, this.canvas);
  }

  initializePolyPathDrawing() {
    polyPathDrawing(this.canvas);
  }

  initializeWeatherFrontLineDrawing() {
    weatherFrontLineDrawing(this.canvas);
  }

  initializeTextBoxDrawing() {
    textBoxDrawing.call(this);
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

  initializeEditRepository() {
    fetchEditData.call(this);
  }

  initializeFullScreen() {
    fullscreen.call(this);
  }

  initializeLayerListPanel() {
    layerListPanel.call(this);
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

  initializeTestPanel() {
    testPanel.call(this);
  }

  initializeAutoAlignment() {
    autoAlignment(this.canvas);
  }

  async init() {
    this.initializeToolbar();
    this.initializeMainPanel();
    this.initializeShapes();
    this.canvas = await this.initializeCanvas();
    this.initializeCanvasSettings();

    this.initializeSelectionSettings();
    this.initializeCopyPaste();
    this.initializeLayerListPanel();
    this.initializeEllipseDrawing();
    this.initializeTriangleDrawing();
    this.initializeRectDrawing();
    this.initializeCurvedLineDrawing();
    this.initializeArrowDrawing();
    this.initializePolyPathDrawing();
    this.initializeWeatherFrontLineDrawing();
    this.initializeTextBoxDrawing();
    this.initializeWeatherData();
    this.initializeImages();
    this.initializeTipSection();
    this.initializeZoom();
    this.configUndoRedoStack();
    this.initializeFreeDrawSettings();
    this.initializeTestPanel();
    this.initializeTemplates();
    this.initializeEditRepository();
    this.initializeFullScreen();
    this.initializeHideShowToolPanel();
    this.initializeNumberInput();
    this.initializeAutoAlignment();
    return this;
  }
}

export { ImageEditor };
