/**
 * Define layer list panel for a Fabric.js canvas
 */
"use strict";

/**
 * Initialize layer list panel on the right side of the main panel
 * @param {Object} _self - Fabric.js canvas instance
 */
function layerListPanel() {
  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel layerpanel visible" id="layer-panel">
      <div class="content">
        <p class="title">레이어</p>
        <div id="layer-inner-list"></div>
      </div>
    </div>`
  );

  const updateLayers = () => {
    const layerList = document.querySelector(
      `${_self.containerSelector} #layer-inner-list`
    );
    layerList.innerHTML = "";
    const objects = _self.canvas.getObjects();

    objects.forEach((object, index) => {
      if (!object.id) {
        object.id = `obj-${Date.now()}-${index}`;
      }
      const objectId = object.id;
      const isGroup = object.type === "group";
      const label =
        object.label ||
        (isGroup
          ? `그룹 (${object.getObjects().length}개 합쳐짐)`
          : `이름을 작성해주세요`);

      layerList.insertAdjacentHTML(
        "afterbegin",
        `
          <div class="layer" data-object="${objectId}">
            <div class="layer-name">
              <input class="layer-custom-name" value="${label}">
              <div class="layer-options">
                <button class="move-up" title="Move layer up">↑</button>
                <button class="move-down" title="Move layer down">↓</button>
              </div>
            </div>
          </div>
        `
      );
    });

    const activeObjects = _self.canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      if (obj.id) {
        const selectedLayer = document.querySelector(
          `${_self.containerSelector} .layer[data-object="${obj.id}"]`
        );
        if (selectedLayer) selectedLayer.classList.add("layer-selected");
        else console.warn("Layer not found for active object ID:", obj.id);
      } else {
        console.warn("Active object missing ID:", obj);
      }
    });
  };

  _self.canvas.on("object:added", (e) => {
    if (e.target && !e.target.id) {
      e.target.id = `obj-${Date.now()}-${_self.canvas.getObjects().length}`;
    }
    updateLayers();
  });
  _self.canvas.on("object:removed", updateLayers);
  _self.canvas.on("object:modified", updateLayers);

  _self.canvas.on("selection:created", (e) => {
    updateLayers();
  });

  _self.canvas.on("selection:updated", (e) => {
    updateLayers();
  });

  _self.canvas.on("selection:cleared", () => {
    document
      .querySelectorAll(`${_self.containerSelector} .layer`)
      .forEach((el) => el.classList.remove("layer-selected"));
  });

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener("click", (e) => {
      const layer = e.target.closest(".layer");
      if (
        !layer ||
        e.target.classList.contains("move-up") ||
        e.target.classList.contains("move-down") ||
        layer.classList.contains("layer-selected")
      )
        return;

      const objectId = layer.getAttribute("data-object");
      const selectedObject = _self.canvas
        .getObjects()
        .find((obj) => obj.id === objectId);
      if (!selectedObject) return;

      const activeObject = _self.canvas.getActiveObject();
      if (activeObject == selectedObject) {
        _self.canvas.discardActiveObject(selectedObject);
      } else {
        _self.canvas.setActiveObject(selectedObject);
      }

      _self.canvas.requestRenderAll();
      updateLayers();
    });

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener("dblclick", (e) => {
      const input = e.target.closest(".layer-custom-name");
      if (input) {
        input.readonly = false;
        input.focus();
        input.select();
      }
    });

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener("input", (e) => {
      const input = e.target.closest(".layer-custom-name");
      if (input) {
        const layer = input.closest(".layer");
        const objectId = layer.getAttribute("data-object");
        const object = _self.canvas
          .getObjects()
          .find((obj) => obj.id === objectId);
        if (object) {
          object.label = input.value;
          _self.canvas.renderAll();
        }
      }
    });

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener(
      "blur",
      (e) => {
        const input = e.target.closest(".layer-custom-name");
        if (input) {
          input.readonly = true;
        }
      },
      true
    );

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener("click", (e) => {
      const button = e.target;
      const layer = button.closest(".layer");
      if (!layer) return;

      const objectId = layer.getAttribute("data-object");
      const object = _self.canvas
        .getObjects()
        .find((obj) => obj.id === objectId);
      if (!object) return;

      if (button.classList.contains("move-up")) {
        const index = _self.canvas.getObjects().indexOf(object);
        if (index < _self.canvas.getObjects().length - 1) {
          _self.canvas.moveTo(object, index + 1);
          updateLayers();
        }
      } else if (button.classList.contains("move-down")) {
        const index = _self.canvas.getObjects().indexOf(object);
        if (index > 0) {
          _self.canvas.moveTo(object, index - 1);
          updateLayers();
        }
      }
    });

  updateLayers();
}

export { layerListPanel };
