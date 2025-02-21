/**
 * Define action to pen draw by mouse action
 */
"use strict";

/**
 * Initialize free drawing settings for a Fabric.js canvas
 */
function freeDrawSettings() {
  let width = 1;
  let style = "pencil";
  let color = "black";

  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="draw-panel"><div class="content"><p class="title">Free Draw</p></div></div>`
  );

  // Add settings UI to the draw panel
  document
    .querySelector(`${this.containerSelector} .toolpanel#draw-panel .content`)
    .insertAdjacentHTML(
      "beforeend",
      `
      <div>
        <div class="input-container">
          <label>Brush Width</label>
          <div class="custom-number-input">
            <button class="decrease">-</button>
            <input type="number" min="1" value="1" id="input-brush-width"/>
            <button class="increase">+</button>
          </div>
        </div>
        <div class="input-container">
          <label>Brush Type</label>
          <select id="input-brush-type">
            <option value="pencil" selected>Pencil</option>
            <option value="circle">Circle</option>
            <option value="spray">Spray</option>
          </select>
        </div>
        <div class="input-container">
          <label>Brush Color</label>
          <input id="color-picker" value="black"/>
        </div>
      </div>
    `
    );

  // Function to update the brush settings on the canvas
  const updateBrush = () => {
    try {
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

      _self.canvas.freeDrawingBrush.width = width;
      _self.canvas.freeDrawingBrush.color = color;
    } catch (_) {}
  };

  // Event listeners for brush settings
  const inputBrushWidth = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-width`
  );
  inputBrushWidth.addEventListener("change", function () {
    try {
      width = parseInt(this.value, 10); // Use vanilla JS instead of jQuery
      updateBrush();
    } catch (_) {}
  });

  const inputBrushType = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-type`
  );
  inputBrushType.addEventListener("change", function () {
    style = this.value; // Use vanilla JS instead of jQuery
    updateBrush();
  });

  // Color picker with Spectrum (retaining jQuery usage as in original)
  const colorPicker = $(
    `${this.containerSelector} .toolpanel#draw-panel .content #color-picker`
  );
  colorPicker
    .spectrum({
      type: "color",
      showInput: "true",
      showInitial: "true",
      allowEmpty: "false",
    })
    .change(function () {
      try {
        color = $(this).val();
        updateBrush();
      } catch (_) {}
    });

  // Initial brush setup
  updateBrush();
}

export { freeDrawSettings };
