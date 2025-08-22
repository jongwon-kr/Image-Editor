import { ICONS } from "../models/featIcons.ts";
import { getDeleteArea } from "../utils/utils.js";

function freeDrawSettings() {
  let width = 5;
  let style = "pencil";
  let color = "rgb(0, 0, 0)";
  let drawingMode = "add";
  let cursorCircle = null;

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
            <label>지운 영역 복구</label>
            <button id="roll-back-delete" class="btn_b">복구하기</button>
          </div>
          <div class="input-container">
            <label for="erase">지우개</label>
            <label class="toggle-wrapper">
              <input type="checkbox" id="erase" name="erase">
              <span class="slider"></span>
            </label>
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
        </div>
      `
    );

  const rollBackDeleteBtn = document.querySelector("#roll-back-delete");
  rollBackDeleteBtn.addEventListener("click", () => {
    getDeleteArea().forEach((o) => {
      _self.canvas.remove(o);
    });
    _self.canvas.fire("object:modified");
  });

  const updateBrush = () => {
    try {
      _self.canvas.isDrawingMode = true;
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
      if (drawingMode === "delete") {
        _self.canvas.freeDrawingBrush = new fabric.PencilBrush(_self.canvas);
        _self.canvas.freeDrawingBrush.color = "white";
        _self.canvas.freeDrawingBrush.globalCompositeOperation =
          "destination-out";
      } else {
        _self.canvas.freeDrawingBrush.color = color;
        _self.canvas.freeDrawingBrush.globalCompositeOperation = "source-over";
      }
      _self.canvas.freeDrawingBrush.width = width;
    } catch (error) {
      console.error("Failed to update brush:", error);
    }
  };

  const handleMouseMove = (e) => {
    const pointer = _self.canvas.getPointer(e.e);
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
    }
    cursorCircle = new fabric.Circle({
      left: pointer.x - width / 2,
      top: pointer.y - width / 2,
      radius: width / 2,
      fill: "",
      stroke: drawingMode === "delete" ? "red" : "black",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      noFocusing: true,
    });
    _self.canvas.add(cursorCircle);
    _self.canvas.renderAll();
  };

  const handleMouseOut = () => {
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
      cursorCircle = null;
      _self.canvas.renderAll();
    }
  };

  _self.activateDrawMode = () => {
    if (_self.cleanupDrawMode) {
      _self.cleanupDrawMode();
    }

    _self.canvas.on("mouse:move", handleMouseMove);
    _self.canvas.on("mouse:out", handleMouseOut);
    _self.canvas.on("path:created", (e) => {
      if (drawingMode === "delete") {
        e.path.noFocusing = true;
        e.path.evented = false;
        e.path.selectable = false;
        e.path.isDelete = true;
        e.path.label = "삭제영역";
      }
      _self.canvas.renderAll();
    });
    updateBrush();
  };

  _self.cleanupDrawMode = () => {
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
      cursorCircle = null;
      _self.canvas.renderAll();
    }
    _self.canvas.off("mouse:move", handleMouseMove);
    _self.canvas.off("mouse:out", handleMouseOut);
    _self.canvas.off("path:created");
  };

  const inputBrushWidth = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-width`
  );
  inputBrushWidth.addEventListener("change", function () {
    try {
      width = parseInt(this.value, 10);
      updateBrush();
    } catch (error) {
      console.error("Failed to update brush width:", error);
    }
  });

  document
    .querySelector(
      `${this.containerSelector} .toolpanel#draw-panel .content .decrease`
    )
    .addEventListener("click", () => {
      width = Math.max(1, width - 1);
      inputBrushWidth.value = width;
      updateBrush();
    });
  document
    .querySelector(
      `${this.containerSelector} .toolpanel#draw-panel .content .increase`
    )
    .addEventListener("click", () => {
      width += 1;
      inputBrushWidth.value = width;
      updateBrush();
    });

  const inputBrushType = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-type`
  );
  inputBrushType.addEventListener("change", function () {
    style = this.value;
    updateBrush();
  });

  function initializeColorPickerWithEyedropper(pickerElement, onColorChange) {
    const spectrumOptions = {
      type: "color",
      showInput: true,
      showButtons: false,
      allowEmpty: false,
      move: onColorChange,
    };

    pickerElement.spectrum(spectrumOptions).on("change.spectrum", (e, c) => {
      onColorChange(c);
    });

    if (window.EyeDropper) {
      const eyedropperBtn = document.createElement("button");
      eyedropperBtn.className = "eyedropper-btn";
      eyedropperBtn.innerHTML = ICONS.eyeDrop;
      pickerElement.parent().append(eyedropperBtn);

      eyedropperBtn.addEventListener("click", async () => {
        try {
          const eyeDropper = new EyeDropper();
          const result = await eyeDropper.open();
          const newColor = tinycolor(result.sRGBHex);
          pickerElement.spectrum("set", newColor);
          onColorChange(newColor);
        } catch (e) {
          console.log("Color selection cancelled.");
        }
      });
    }
  }

  const colorPicker = $(
    `${this.containerSelector} .toolpanel#draw-panel .content #color-picker`
  );

  const handleColorChange = (newColor) => {
    try {
      color = newColor.toRgbString();
      if (drawingMode === "add") {
        updateBrush();
      }
    } catch (error) {
      console.error("Failed to update brush color:", error);
    }
  };

  initializeColorPickerWithEyedropper(colorPicker, handleColorChange);

  const eraseCheckbox = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #erase`
  );
  eraseCheckbox.addEventListener("change", function () {
    drawingMode = this.checked ? "delete" : "add";
    updateBrush();
  });
}

export { freeDrawSettings };
