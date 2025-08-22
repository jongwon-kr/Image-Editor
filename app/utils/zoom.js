import { imgEditor } from "../index.ts";

/**
 * 줌 기능 정의
 */

function zoom() {
  const _self = imgEditor;
  let currentZoomLevel = 1;

  const footerbar = document.querySelector(
    `${imgEditor.containerSelector} #footer-bar`
  );
  if (footerbar) {
    const zoomContainer = document.createElement("div");
    zoomContainer.className = "zoom-level-container";
    zoomContainer.innerHTML = `
      <button id="zoom-fit">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8 22.2s19.3 1.7 26.2-5.2l39 39 87-87c9.4 9.4 24.6 9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/>
        </svg> 
      </button>
      <input type="range" id="input-zoom-level" min="0.1" max="3" step="0.05" value="${currentZoomLevel}">
      <div id="zoom-value">${Math.round(currentZoomLevel * 100)}%</div>
    `;
    footerbar.appendChild(zoomContainer);
  }

  document.querySelector("#zoom-fit")?.addEventListener("click", () => {
    if (typeof _self.fitZoom === "function") _self.fitZoom();
  });

  document
    .querySelector("#input-zoom-level")
    ?.addEventListener("input", (event) => {
      updateZoomValue(event.target.value);
    });

  window.updateZoomValue = function (value) {
    if (value === "fit") {
      if (typeof _self.fitZoom === "function") _self.fitZoom();
    } else {
      let zoom = parseFloat(value);
      if (typeof _self.applyZoom === "function") _self.applyZoom(zoom);
    }
  };

  const minZoom = 0.05;
  const maxZoom = 3;

  imgEditor.applyZoom = (zoom) => {
    currentZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoom));
    _self.canvas.setZoom(currentZoomLevel);

    _self.canvas.setWidth(_self.canvas.originalW * currentZoomLevel);
    _self.canvas.setHeight(_self.canvas.originalH * currentZoomLevel);

    _self.inputZoomLevel(currentZoomLevel);
    _self.canvas.renderAll();
    imgEditor.updateInputFields();
  };

  imgEditor.fitZoom = () => {
    if (!_self.canvas.backgroundImage) {
      _self.canvas.setWidth(_self.canvas.originalW * currentZoomLevel);
      _self.canvas.setHeight(_self.canvas.originalH * currentZoomLevel);
    } else {
      _self.canvas.setWidth(
        _self.canvas.backgroundImage.width * currentZoomLevel
      );
      _self.canvas.setHeight(
        _self.canvas.backgroundImage.height * currentZoomLevel
      );
    }
    _self.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    _self.applyZoom(1);
  };

  imgEditor.inputZoomLevel = (zoom) => {
    const inputZoomLevel = document.querySelector(
      _self.containerSelector + " #input-zoom-level"
    );
    const zoomValueDisplay = document.querySelector(
      _self.containerSelector + " #zoom-value"
    );
    if (inputZoomLevel && zoomValueDisplay) {
      inputZoomLevel.value = zoom;
      zoomValueDisplay.textContent = `${Math.round(zoom * 100)}%`;
    }
  };

  document.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      let zoomChange = e.deltaY > 0 ? -5 : 5;
      let updatedZoom = (currentZoomLevel * 100 + zoomChange) / 100;
      if (updatedZoom >= minZoom && updatedZoom <= maxZoom) {
        _self.applyZoom(updatedZoom);
      }
    },
    { passive: false }
  );
}

export { zoom };
