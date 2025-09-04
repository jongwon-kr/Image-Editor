import { ICONS } from "../models/Icons.ts";
import { startPicker } from "../utils/eyeDropper.ts";
import {
  initializeColorPicker,
  initializeEyedropper,
} from "../utils/drawingUtils.ts";

function freeDrawSettings() {
  let width = 5;
  let style = "pencil";
  let color = "rgb(0, 0, 0)";
  let drawingMode = "add";

  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  if (!mainPanel) {
    return;
  }

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="draw-panel"><div class="content"><p class="title">자유 그리기</p></div></div>`
  );
  document
    .querySelector(`${this.containerSelector} .toolpanel#draw-panel .content`)
    .insertAdjacentHTML(
      "beforeend",
      `
        <div>
          <div class="input-container">
            <label for="erase">지우개</label>
            <label class="toggle-wrapper">
              <input type="checkbox" id="erase" name="erase">
              <span class="slider"></span>
            </label>
          </div>
          <div class="input-container">
            <label>그리기 종류</label>
            <select id="input-brush-type">
              <option value="pencil" selected>연필</option>
              <option value="circle">원형</option>
              <option value="spray">스프레이</option>
            </select>
          </div>
          <div class="input-container">
            <label>그리기 색상</label>
            <input id="color-picker" value="rgb(0, 0, 0)"/>
          </div>
          <div class="input-container">
            <label>두께</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="1" value="5" id="input-brush-width"/>
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>펜 미리보기</label>
            <div id="brush-preview-container" style="display: flex; align-items: center; justify-content: center; height: 50px; background-color: #f0f0f0; border-radius: 8px; padding: 5px;">
              <div id="brush-preview" style="border-radius: 50%;"></div>
            </div>
          </div>
        </div>
      `
    );

  const pencilCursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(
    ICONS.pencil
  )}') 2 30, crosshair`;
  const eraserCursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(
    ICONS.eraser
  )}') 3 30, crosshair`;

  const brushPreview = document.querySelector(
    `${_self.containerSelector} #brush-preview`
  );

  const updateBrushPreview = () => {
    if (drawingMode === "delete") {
      brushPreview.textContent = "지우개 모드";
      brushPreview.style.width = "100%";
      brushPreview.style.height = "100%";
      brushPreview.style.backgroundColor = "transparent";
      brushPreview.style.placeContent = "center";
      return;
    }

    if (brushPreview) {
      const previewSize = Math.min(width, 48);
      brushPreview.textContent = "";
      brushPreview.style.width = `${previewSize}px`;
      brushPreview.style.height = `${previewSize}px`;
      brushPreview.style.backgroundColor = color;
      brushPreview.style.placeContent = "center";
    }
  };

  const updateBrush = () => {
    if (drawingMode === "delete") {
      _self.canvas.isDrawingMode = false;
      _self.canvas.selection = false;
      _self.canvas.defaultCursor = eraserCursor;
      _self.canvas.forEachObject(function (o) {
        o.selectable = false;
        o.hoverCursor = eraserCursor;
      });
      _self.canvas.renderAll();
      return;
    }

    _self.canvas.forEachObject(function (o) {
      o.selectable = true;
      o.hoverCursor = "move";
    });

    _self.canvas.isDrawingMode = true;
    _self.canvas.freeDrawingCursor = pencilCursor;
    _self.canvas.defaultCursor = "default";

    switch (style) {
      case "circle":
        _self.canvas.freeDrawingBrush = new fabric.CircleBrush(_self.canvas);
        break;
      case "spray":
        _self.canvas.freeDrawingBrush = new fabric.SprayBrush(_self.canvas);
        break;
      default:
        _self.canvas.freeDrawingBrush = new fabric.PencilBrush(_self.canvas);
        break;
    }

    if (_self.canvas.freeDrawingBrush) {
      _self.canvas.freeDrawingBrush.color = color;
      _self.canvas.freeDrawingBrush.width = width;
      _self.canvas.freeDrawingBrush.decimate = 5;
    }
  };

  const eraseOnMove = (opt) => {
    if (opt.target && opt.target.isFreeDrawn) {
      _self.canvas.remove(opt.target);
      _self.canvas.renderAll();
      _self.canvas.fire("object:modified");
    }
  };

  const startErasing = () => {
    _self.canvas.perPixelTargetFind = true;
    _self.canvas.on("mouse:move", eraseOnMove);
    _self.canvas.on("mouse:up", stopErasing);
  };

  const stopErasing = () => {
    _self.canvas.off("mouse:move", eraseOnMove);
    _self.canvas.off("mouse:up", stopErasing);
    _self.canvas.perPixelTargetFind = false;
  };

  _self.activateDrawMode = () => {
    if (_self.cleanupDrawMode) {
      _self.cleanupDrawMode();
    }

    if (drawingMode === "delete") {
      _self.canvas.on("mouse:down", startErasing);
    } else {
      _self.canvas.on("path:created", (e) => {
        e.path.isFreeDrawn = true;
      });
    }

    updateBrush();
    updateBrushPreview();
  };

  _self.cleanupDrawMode = () => {
    _self.canvas.isDrawingMode = false;
    _self.canvas.hoverCursor = "move";
    _self.canvas.off("path:created");
    _self.canvas.off("mouse:down", startErasing);
    _self.canvas.off("mouse:move", eraseOnMove);
    _self.canvas.off("mouse:up", stopErasing);
  };

  const inputBrushWidth = document.querySelector(
    `${_self.containerSelector} .toolpanel#draw-panel .content #input-brush-width`
  );
  inputBrushWidth.addEventListener("change", function () {
    width = parseInt(this.value, 10);
    updateBrush();
    updateBrushPreview();
  });

  const inputBrushType = document.querySelector(
    `${_self.containerSelector} .toolpanel#draw-panel .content #input-brush-type`
  );
  inputBrushType.addEventListener("change", function () {
    style = this.value;
    updateBrush();
  });

  const eraseCheckbox = document.querySelector(
    `${_self.containerSelector} .toolpanel#draw-panel .content #erase`
  );
  eraseCheckbox.addEventListener("change", function () {
    drawingMode = this.checked ? "delete" : "add";
    _self.activateDrawMode();
  });

  const colorPicker = $(
    `${_self.containerSelector} .toolpanel#draw-panel .content #color-picker`
  );
  const handleColorChange = (newColor) => {
    color = newColor.toRgbString();
    if (drawingMode === "add") {
      updateBrush();
    }
    updateBrushPreview();
  };

  initializeColorPicker(colorPicker, handleColorChange);
  initializeEyedropper(colorPicker, () => {
    startPicker((selectedColor) => {
      colorPicker.spectrum("set", selectedColor);
      color = selectedColor;
      if (drawingMode === "add") {
        updateBrush();
      }
      updateBrushPreview();
    });
  });

  updateBrushPreview();
}

export { freeDrawSettings };
