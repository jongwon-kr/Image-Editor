import { imgEditor } from "../index.js";

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
  } else {
    console.log("footerbar is null");
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
    imgEditor.canvas.setZoom(zoom);
    imgEditor.canvas.setWidth(
      imgEditor.canvas.originalW * imgEditor.canvas.getZoom()
    );
    imgEditor.canvas.setHeight(
      imgEditor.canvas.originalH * imgEditor.canvas.getZoom()
    );
    imgEditor.inputZoomLevel(zoom);
  };

  imgEditor.fitZoom = () => {
    const container = document.querySelector(
      imgEditor.containerSelector + " .main-panel"
    );
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasWidth = imgEditor.canvas.originalW;
    const canvasHeight = imgEditor.canvas.originalH;
    const widthRatio = containerWidth / canvasWidth;
    const heightRatio = containerHeight / canvasHeight;
    const newZoom = Math.min(widthRatio, heightRatio) - 0.1;
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom)).toFixed(
      2
    );
    imgEditor.applyZoom(clampedZoom);
  };

  imgEditor.fitZoom1 = () => {
    imgEditor.applyZoom(1);
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      let updatedZoom = imgEditor.canvas.getZoom() * 100;
      if (e.key === "-" || e.keyCode === 189) {
        updatedZoom = Math.max(minZoom * 100, updatedZoom - 25);
      } else if (e.key === "+" || e.keyCode === 187) {
        updatedZoom = Math.min(maxZoom * 100, updatedZoom + 25);
      } else if (e.key === "0" || e.keyCode === 48 || e.keyCode === 96) {
        updatedZoom = 100;
      }
      imgEditor.applyZoom(updatedZoom / 100);
    }
  });

  document.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      let zoomChange = e.deltaY > 0 ? -5 : 5;
      let updatedZoom = (imgEditor.canvas.getZoom() * 100 + zoomChange) / 100;
      if (updatedZoom >= minZoom && updatedZoom <= maxZoom) {
        imgEditor.applyZoom(updatedZoom);
      }
    },
    { passive: false }
  );

  imgEditor.inputZoomLevel = (zoom) => {
    const inputZoomLevel = document.querySelector(
      imgEditor.containerSelector + " #input-zoom-level"
    );
    if (inputZoomLevel) {
      inputZoomLevel.value = zoom;
      document.querySelector("#zoom-value").textContent =
        Math.round(zoom * 100) + "%";
    }
  };
}

export { zoom };
