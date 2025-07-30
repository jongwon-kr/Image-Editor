// @ts-nocheck
import { initializeShapes } from "./drawing-tools/shapes.js";
import { lineDrawing } from "./drawing-tools/drawingLine.js";
import { arrowDrawing } from "./drawing-tools/drawingArrow.js";
import { pathDrawing } from "./drawing-tools/drawingPath.js";
import { textBoxDrawing } from "./drawing-tools/drawingText.js";
import { weatherFrontLine } from "./drawing-tools/weatherFrontLine.js";
import {
  generateWeatherFrontPath,
  removeAllFrontShapes,
  weatherFrontDrawing,
} from "./drawing-tools/drawingWeatherFront.js";
import { defaultTips, tipPanel } from "./ui/tip.js";
import { weatherData } from "./ui/weatherData.js";
import { images } from "./ui/images.js";
import { canvas, processWeatherFronts } from "./ui/canvas.js";
import { toolbar } from "./ui/toolbar.js";
import { freeDrawSettings } from "./ui/freeDrawSettings.js";
import { canvasSettings } from "./ui/canvasSettings.js";
import { selectionSettings } from "./ui/selectionSettings.js";
import { copyPaste } from "./utils/copyPaste.js";
import { zoom } from "./utils/zoom.js";
import { templates } from "./ui/templates.js";
import { fullscreen } from "./utils/fullScreen.js";
import { layerListPanel } from "./ui/layerListPanel.js";
import {
  getDeleteArea,
  getFrontShapes,
  restoreControlPoints,
} from "./utils/utils.js";
import { testPanel } from "./ui/testPanel.js";
import { fetchEditData } from "./ui/EditRepository.js";

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

  setCanvasJSON = async (current) => {
    current &&
      (await this.canvas.loadFromJSON(
        JSON.parse(current),
        this.canvas.renderAll.bind(this.canvas)
      ));
  };

  setActiveTool = (id) => {
    this.activeTool = id;

    // 툴바 버튼 활성화/비활성화
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

    // 툴 패널 표시/숨김
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

    // 선택 해제
    if (id !== "select") {
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.activeSelection = null;
    }

    // 캔버스 모드 초기화
    this.canvas.isHandleMode = false;
    this.canvas.isCuttingMode = false;
    this.canvas.isColorFilterMode = false;
    this.canvas.isDrawingLineMode = false;
    this.canvas.isDrawingPathMode = false;
    this.canvas.isDrawingWeatherFrontMode = false;
    this.canvas.isDrawingMode = false;
    this.canvas.isDrawingTextMode = false;
    this.canvas.isDrawingArrowMode = false;
    this.canvas.defaultCursor = "default";
    this.canvas.selection = true;

    // 모든 객체 선택 가능 설정
    this.canvas.forEachObject((o) => {
      o.selectable = true;
      o.evented = true;
    });

    getFrontShapes().forEach((o) => {
      o.selectable = false;
      o.evented = false;
    });
    getDeleteArea().forEach((o) => {
      o.selectable = false;
      o.evented = false;
    });

    // draw 모드가 아닌 경우 cleanup 호출
    if (id !== "draw" && this.cleanupDrawMode) {
      this.cleanupDrawMode();
    }

    switch (id) {
      case "select":
        this.canvas.defaultCursor = "default";
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
      case "draw":
        this.canvas.isDrawingMode = true;
        this.canvas.upperCanvasEl.style.cursor = "none";
        if (this.activateDrawMode) {
          this.activateDrawMode(); // draw 모드 활성화
        }
        this.updateTip(
          "Tip: 드래그로 자유롭게 그릴 수 있어요! 지우개 모드로 전환도 가능합니다."
        );
        break;
      case "line":
        this.canvas.isDrawingLineMode = true;
        this.canvas.defaultCursor = "crosshair";
        this.canvas.selection = false;
        this.canvas.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });
        this.updateTip(
          "Tip: 드래그로 선을 그리고 제어점을 이용해 선을 수정할 수 있습니다! Shift를 누르면 직선을 그릴 수 있어요!"
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
          "Tip: 드래그로 선을 그리고 제어점을 이용해 선을 수정할 수 있습니다! Shift를 누르면 직선을 그릴 수 있어요! 이후 화살표 머리를 수정할 수 있어요"
        );
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
          "Tip: 클릭하여 좌표를 배치하고, 바깥쪽을 클릭하거나 Esc 키를 눌러 완성하세요!"
        );
        break;
      case "weatherFront":
        this.canvas.isDrawingWeatherFrontMode = true;
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
      case "textbox":
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

      removeAllFrontShapes(this.canvas);
      this.history.undo();

      const parsedJSON = JSON.parse(current);
      await this.updateCanvasFromJSON(parsedJSON);
    } catch (error) {
      console.error("undo failed:", error);
    } finally {
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

      removeAllFrontShapes(this.canvas);
      this.history.redo();

      const parsedJSON = JSON.parse(current);
      await this.updateCanvasFromJSON(parsedJSON);
    } catch (error) {
      console.error("redo failed:", error);
    } finally {
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
        if (!obj.noFocusing || obj.isDelete) {
          objectsToRemove.push(obj);
        }
      });

      objectsToRemove.forEach((obj) => {
        if (obj.controlPoints) {
          obj.controlPoints.forEach((point) => this.canvas.remove(point));
          obj.controlPoints = [];
        }
        if (obj.shapeObjects) {
          obj.shapeObjects.forEach((shape) => this.canvas.remove(shape));
          obj.shapeObjects = [];
        }
        this.canvas.remove(obj);
      });

      objectsToAdd.forEach((obj) => {
        if (obj.noFocusing) {
          obj.selectable = false;
          obj.evented = false;
        }
        this.canvas.add(obj);
        restoreControlPoints(this.canvas, obj);
        if (obj.pathType === "weatherFront") {
          generateWeatherFrontPath(obj, this.canvas);
        }
      });

      processWeatherFronts(this.canvas.getObjects(), this.canvas);

      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to update canvas from JSON:", error);
      throw error;
    }
  };

  updateObjectProperties = (currentObj, newObj) => {
    // 모든 속성 동적으로 비교
    const allProps = new Set([
      ...Object.keys(currentObj.toObject()),
      ...Object.keys(newObj.toObject()),
      // 커스텀 속성 추가
      "noFocusing",
      "controlPoints",
      "shapeObjects",
      "pathType",
      "frontType",
      "startHead",
      "endHead",
      "path",
      "pathD",
      "p0",
      "p1",
      "p2",
      "label",
      "desc",
      "apiType",
      "params",
    ]);

    for (const prop of allProps) {
      const currentValue = currentObj[prop];
      const newValue = newObj[prop];

      // 속성 값 비교 (깊은 비교)
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        return true; // 변경사항이 있으면 즉시 true 반환
      }
    }

    return false; // 변경사항 없음
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
        if (key === 90 && this.history.getValues().undo.length > 0) {
          this.undo();
        } else if (key === 89 && this.history.getValues().redo.length > 0) {
          this.redo();
        }
      }
    };

    // 기존 이벤트 리스너 제거
    document.removeEventListener("keydown", this._handleKeyDown);

    // 새 이벤트 리스너 등록
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

  initializeShapes() {
    initializeShapes(this);
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

  initializeWeatherFrontDrawing() {
    weatherFrontDrawing(this.canvas);
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

  async init() {
    this.initializeToolbar();
    this.initializeMainPanel();
    this.initializeShapes();
    this.initializeCanvasSettings();
    this.canvas = await this.initializeCanvas();

    this.initializeSelectionSettings();
    this.initializeCopyPaste();
    this.initializeLayerListPanel();
    this.initializeLineDrawing();
    this.initializeArrowDrawing();
    this.initializePathDrawing();
    this.initializeWeatherFrontDrawing();
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
    return this;
  }
}

export { ImageEditor };
