/**
 * Initialize canvas setting panel
 */
"use strict";

/**
 * Initialize canvas settings for a Fabric.js canvas
 */
function canvasSettings() {
  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="background-panel"><div class="content"><p class="title">Canvas Settings</p></div></div>`
  );

  // Canvas Size Section
  const initCanvasSizeSection = () => {
    const bgPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="canvas-size-setting">
          <p>Canvas Size</p>
          <div class="input-container">
            <label>Width</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="100" id="input-width" value="640"/>
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>Height</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="100" id="input-height" value="480"/>
              <button class="increase">+</button>
            </div>
          </div>
        </div>
      `
    );

    const setDimension = () => {
      try {
        const width = parseInt(
          document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-width`
          ).value,
          10
        );
        const height = parseInt(
          document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-height`
          ).value,
          10
        );
        _self.canvas.setWidth(width);
        _self.canvas.originalW = width;
        _self.canvas.setHeight(height);
        _self.canvas.originalH = height;
        _self.canvas.renderAll();
        _self.canvas.trigger("object:modified");
      } catch (_) {}
    };

    document
      .querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content #input-width`
      )
      .addEventListener("change", setDimension);

    document
      .querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content #input-height`
      )
      .addEventListener("change", setDimension);
  };

  // Background Color and Gradient Section
  const initBackgroundSection = () => {
    const bgPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="color-settings">
          <div class="tab-container">
            <div class="tabs">
              <div class="tab-label" data-value="color-fill">Color Fill</div>
              <div class="tab-label" data-value="gradient-fill">Gradient Fill</div>
            </div>
            <div class="tab-content" data-value="color-fill">
              <input id="color-picker" value="black"/><br>
            </div>
            <div class="tab-content" data-value="gradient-fill">
              <div id="gradient-picker"></div>
              <div class="gradient-orientation-container">
                <div class="input-container">
                  <label>Orientation</label>
                  <select id="select-orientation">
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                <div id="angle-input-container" class="input-container">
                  <label>Angle</label>
                  <div class="custom-number-input">
                    <button class="decrease">-</button>
                    <input type="number" min="0" max="360" value="0" id="input-angle">
                    <button class="increase">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    );

    // Tab switching logic
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .tab-label`
      )
      .forEach((tab) => {
        tab.addEventListener("click", function () {
          document
            .querySelectorAll(
              `${_self.containerSelector} .toolpanel#background-panel .content .tab-label`
            )
            .forEach((label) => label.classList.remove("active"));

          this.classList.add("active");

          const target = this.getAttribute("data-value");

          this.closest(".tab-container")
            .querySelectorAll(".tab-content")
            .forEach((content) => (content.style.display = "none"));

          const targetContent = this.closest(".tab-container").querySelector(
            `.tab-content[data-value="${target}"]`
          );
          if (targetContent) {
            targetContent.style.display = "block";
          }

          if (target === "color-fill") {
            const colorPicker = document.querySelector(
              `${_self.containerSelector} .toolpanel#background-panel .content #color-picker`
            );
            if (colorPicker) {
              const color = colorPicker.value;
              try {
                _self.canvas.backgroundColor = color;
                _self.canvas.renderAll();
              } catch (_) {
                console.log("Can't update background color");
              }
            }
          } else {
            updateGradientFill();
          }
        });
      });

    // fire initial tab
    const colorFillTab = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content .tab-label[data-value="color-fill"]`
    );
    if (colorFillTab) {
      colorFillTab.click();
    }

    // Color picker initialization with Spectrum
    const colorPicker = $(
      `${this.containerSelector} .toolpanel#background-panel .content #color-picker`
    );
    colorPicker.spectrum({
      flat: true,
      showPalette: false,
      showButtons: false,
      type: "color",
      showInput: "true",
      allowEmpty: "false",
      move: function (color) {
        const hex = color ? color.toRgbString() : "transparent";
        _self.canvas.backgroundColor = hex;
        _self.canvas.renderAll();
      },
    });

    // Gradient picker initialization with Grapick
    const gp = new Grapick({
      el: `${this.containerSelector} .toolpanel#background-panel .content #gradient-picker`,
      colorEl: '<input id="colorpicker"/>',
    });

    gp.setColorPicker((handler) => {
      const el = handler.getEl().querySelector("#colorpicker");
      $(el).spectrum({
        showPalette: false,
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        color: handler.getColor(),
        showAlpha: true,
        change(color) {
          handler.setColor(color.toRgbString());
        },
        move(color) {
          handler.setColor(color.toRgbString(), 0);
        },
      });
    });

    gp.addHandler(0, "red");
    gp.addHandler(100, "blue");

    // Update gradient fill
    const updateGradientFill = () => {
      const stops = gp.getHandlers();
      const orientation = document.querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`
      ).value;
      const angle = parseInt(
        document.querySelector(
          `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`
        ).value,
        10
      );

      // Note: generateFabricGradientFromColorStops is assumed to be defined elsewhere
      const gradient = generateFabricGradientFromColorStops(
        stops,
        _self.canvas.width,
        _self.canvas.height,
        orientation,
        angle
      );
      _self.canvas.setBackgroundColor(gradient);
      _self.canvas.renderAll();
    };

    // Gradient picker change event
    gp.on("change", () => {
      updateGradientFill();
    });

    // Orientation selection
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`
      )
      .forEach((ori) => {
        ori.addEventListener("change", function () {
          const type = this.value;
          const angleInputContainer = this.closest(
            ".gradient-orientation-container"
          ).querySelector("#angle-input-container");
          if (angleInputContainer) {
            angleInputContainer.style.display =
              type === "radial" ? "none" : "block";
          }
          updateGradientFill();
        });
      });

    // Angle input
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`
      )
      .forEach((input) => {
        input.addEventListener("change", () => {
          updateGradientFill();
        });
      });
  };

  // Initialize both sections
  initCanvasSizeSection();
  initBackgroundSection();
}

export { canvasSettings };
