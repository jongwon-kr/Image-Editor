import {
  defaultButtons,
  defaultExtendedButtons,
} from "../models/DrawingToolsData.ts";
import { save, remove, upload } from "../utils/saveEdit.js";
import {
  canvasToJsonData,
  downloadImage,
  downloadSVG,
} from "../utils/utils.js";
import { openEditRepository } from "./EditRepository.js";

("use strict");

function toolbar() {
  const _self = this;
  let buttons = [];
  let extendedButtons = [];

  if (Array.isArray(this.buttons) && this.buttons.length) {
    buttons = defaultButtons.filter((item) => this.buttons.includes(item.name));
    extendedButtons = defaultExtendedButtons.filter((item) =>
      this.buttons.includes(item.name)
    );
  } else {
    buttons = defaultButtons;
    extendedButtons = defaultExtendedButtons;
  }

  try {
    const container = document.querySelector(this.containerSelector);
    container.insertAdjacentHTML(
      "beforeend",
      `
            <div class="toolbar" id="toolbar">
                <div class="main-buttons"></div>
                <div class="extended-buttons"></div>
            </div>
        `
    );

    const mainButtonsContainer = container.querySelector(
      "#toolbar .main-buttons"
    );
    buttons.forEach((item) => {
      const button = document.createElement("button");
      button.id = item.name;
      button.innerHTML = item.icon;
      button.addEventListener("click", function () {
        document
          .querySelectorAll(`${_self.containerSelector} #toolbar button`)
          .forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        _self.setActiveTool(button.id);
      });
      button.addEventListener("mouseenter", function () {
        showTooltip(button, item);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
      mainButtonsContainer.appendChild(button);
    });

    const extendedButtonsContainer = container.querySelector(
      "#toolbar .extended-buttons"
    );
    extendedButtons.forEach((item) => {
      const button = document.createElement("button");
      button.id = item.name;
      button.innerHTML = item.icon;
      button.addEventListener("click", async function () {
        const id = this.id;
        if (id === "import") {
          openEditRepository();
        } else if (id === "export") {
          if (window.confirm("현재 캔버스를 저장하시겠습니까?.")) {
            const canvasJsonData = canvasToJsonData(_self.canvas);
            canvasJsonData.viewportTransform = _self.canvas.viewportTransform;
            await upload(canvasJsonData);
          }
        } else if (id === "clear") {
          if (window.confirm("현재 캔버스를 초기화하시겠습니까?")) {
            _self.canvas.clear();
            _self.canvas.originalW = 1280;
            _self.canvas.originalH = 720;
            _self.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
            _self.fitZoom();
            _self.history.clear();
            remove("canvasEditor");
          }
        } else if (id === "download") {
          document.body.insertAdjacentHTML(
            "beforeend",
            `
              <div class="custom-modal-container">
                <div class="custom-modal-content download-modal-content">
                  <div class="button-download" id="svg">SVG 다운로드</div>
                  <div class="button-download" id="png">PNG 다운로드</div>
                  <div class="button-download" id="jpg">JPG 다운로드</div>
                </div>
              </div>
            `
          );
          setTimeout(() => {
            document
              .querySelector(".custom-modal-container")
              .classList.add("active");
          }, 10);

          document
            .querySelector(".custom-modal-container")
            .addEventListener("click", function () {
              this.remove();
            });

          document
            .querySelectorAll(".custom-modal-container .button-download")
            .forEach((button) => {
              button.addEventListener("click", async function () {
                let type = this.id;
                if (type === "svg") downloadSVG(_self.canvas.toSVG());
                else if (type === "png")
                  downloadImage(await _self.canvas.toDataURL());
                else if (type === "jpg")
                  downloadImage(
                    _self.canvas.toDataURL({ format: "jpeg" }),
                    "jpg",
                    "image/jpeg"
                  );
              });
            });
        } else if (id === "undo") {
          _self.undo();
        } else if (id === "redo") {
          _self.redo();
        }
      });
      button.addEventListener("mouseenter", function () {
        showTooltip(button, item);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
      extendedButtonsContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Can't create toolbar", error);
  }
}

function showTooltip(button, item) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerText = item.title;

  document.body.appendChild(tooltip);

  const buttonRect = button.getBoundingClientRect();

  let tooltipLeft =
    buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipRight =
    buttonRect.right + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipTop = buttonRect.top + buttonRect.height + 5;

  const screenWidth = window.innerWidth;
  if (tooltipLeft < 0) {
    tooltipLeft = 0;
  } else if (tooltipRight + tooltip.offsetWidth > screenWidth) {
    tooltipLeft = screenWidth - tooltip.offsetWidth;
  }

  tooltip.style.left = `${tooltipLeft}px`;
  tooltip.style.top = `${tooltipTop}px`;

  setTimeout(() => {
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translateY(0)";
  }, 10);
}

function removeTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

export { toolbar, removeTooltip };
