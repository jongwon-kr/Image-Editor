// @ts-nocheck
"use strict";

import SwapColor from "../utils/swapColorFilter.js";

function colorFilter() {
  const _self = this;

  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel colorFilterPanel" id="colorFilter-panel">
      <div class="content">
        <p class="title">색상 영역 선택</p>
        <div class="input-container">
          <label>원본 색상</label>
          <input type="color" id="sourceColorPicker" value="#ff0000"/>
        </div>
        <div class="input-container">
          <label>대상 색상</label>
          <input type="color" id="destColorPicker" value="#00ff00"/>
        </div>
        <div class="input-container">
          <button id="applyColorSwap" class="btn_g">색상 적용</button>
        </div>
      </div>
    </div>`
  );

  _self.canvas.isColorSelectionMode = false;
  let swapColorFilter = new SwapColor();
  let isPickingSource = true;

  const applyColorSwap = (canvas) => {
    let modified = false;

    const objects = canvas.getObjects("image");
    objects.forEach((obj) => {
      if (!obj.filters) obj.filters = [];
      obj.filters = obj.filters.filter((f) => f.type !== "SwapColor");
      obj.filters.push(swapColorFilter);
      obj.applyFilters();
      modified = true;
    });

    if (canvas.backgroundImage && canvas.backgroundImage.type === "image") {
      if (!canvas.backgroundImage.filters) canvas.backgroundImage.filters = [];
      canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(
        (f) => f.type !== "SwapColor"
      );
      canvas.backgroundImage.filters.push(swapColorFilter);
      canvas.backgroundImage.applyFilters();
      modified = true;
    }

    if (modified) {
      canvas.fire("object:modified");
      canvas.renderAll();
    } else {
      console.warn("No valid image targets found to apply SwapColor filter.");
    }
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  document
    .getElementById("sourceColorPicker")
    .addEventListener("change", (e) => {
      swapColorFilter.colorSource = e.target.value;
    });

  document.getElementById("destColorPicker").addEventListener("change", (e) => {
    swapColorFilter.colorDestination = e.target.value;
  });

  document.getElementById("applyColorSwap").addEventListener("click", () => {
    applyColorSwap(_self.canvas);
  });

  _self.canvas.on("mouse:down", (opt) => {
    const evt = opt.e;
    const pointer = _self.canvas.getPointer(evt);

    if (_self.canvas.isColorSelectionMode) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = _self.canvas.width;
      tempCanvas.height = _self.canvas.height;
      const ctx = tempCanvas.getContext("2d");

      const dataUrl = _self.canvas.toDataURL({
        format: "png",
        multiplier: 1 / _self.canvas.getZoom(),
      });
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, _self.canvas.width, _self.canvas.height);

        const zoom = _self.canvas.getZoom();
        const vpt = _self.canvas.viewportTransform;
        const x = (pointer.x * zoom - vpt[4]) / zoom;
        const y = (pointer.y * zoom - vpt[5]) / zoom;

        const clampedX = Math.max(0, Math.min(x, _self.canvas.width - 1));
        const clampedY = Math.max(0, Math.min(y, _self.canvas.height - 1));

        const pixelData = ctx.getImageData(clampedX, clampedY, 1, 1).data;
        const color = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

        if (isPickingSource) {
          swapColorFilter.colorSource = color;
          document.getElementById("sourceColorPicker").value = rgbToHex(
            pixelData[0],
            pixelData[1],
            pixelData[2]
          );
        } else {
          swapColorFilter.colorDestination = color;
          document.getElementById("destColorPicker").value = rgbToHex(
            pixelData[0],
            pixelData[1],
            pixelData[2]
          );
        }
        isPickingSource = !isPickingSource;
      };
      img.src = dataUrl;
    }
  });
}

export { colorFilter };
