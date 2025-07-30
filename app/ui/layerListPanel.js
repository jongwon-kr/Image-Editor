// @ts-nocheck
"use strict";

import {
  getFilteredFocusObjects,
  getOverlayImages,
} from "../utils/utils.js";
import { retForeImgUrl } from "../api/retForeImgUrl.js";
import { retModelImgUrl } from "../api/retModelImgUrl.js";
import { retOceanImgUrl } from "../api/retOceanImgUrl.js";
import { retGridImg } from "../api/retGridImgUrl.js";

function layerListPanel() {
  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel layerpanel visible" id="layer-panel">
      <div class="content">
        <p class="title">레이어 설정</p>
        <div id="select-layer-type"></div>
        <div id="layer-inner-list"></div>
      </div>
    </div>`
  );

  let layerType = "object";

  const selectLayerType = document.querySelector(
    `${_self.containerSelector} #select-layer-type`
  );

  const selectObjectTypeButton = document.createElement("button");
  selectObjectTypeButton.id = "select-object-type-button";
  selectObjectTypeButton.value = "object";
  selectObjectTypeButton.textContent = "객체";
  selectObjectTypeButton.classList.add("toggle-switch-btn", "btn_w", "active");
  selectObjectTypeButton.addEventListener("click", function (e) {
    layerType = this.value;
    toggleLayerType(e.currentTarget);
    updateLayers();
  });
  selectLayerType.appendChild(selectObjectTypeButton);

  const selectOverlayTypeButton = document.createElement("button");
  selectOverlayTypeButton.id = "select-overlay-type-button";
  selectOverlayTypeButton.value = "overlay";
  selectOverlayTypeButton.textContent = "배경 이미지";
  selectOverlayTypeButton.classList.add("toggle-switch-btn", "btn_w");
  selectOverlayTypeButton.addEventListener("click", function (e) {
    layerType = this.value;
    toggleLayerType(e.currentTarget);
    updateLayers();
  });
  selectLayerType.appendChild(selectOverlayTypeButton);

  const updateLayers = () => {
    const layerList = document.querySelector(
      `${_self.containerSelector} #layer-inner-list`
    );
    layerList.innerHTML = "";
    let objects = getFilteredFocusObjects().filter(
      (obj) => !obj.isControlPoint && !obj.overlayImage
    );
    if (layerType === "overlay") {
      objects = getOverlayImages();
      getOverlayImages().forEach((o) => {
        o.selectable = true;
        o.evented = true;
      });
      _self.canvas.perPixelTargetFind = true;
    } else {
      getOverlayImages().forEach((o) => {
        o.selectable = false;
        o.evented = false;
      });
      _self.canvas.perPixelTargetFind = false;
    }

    objects.forEach((object, index) => {
      if (!object.id) {
        object.id = `obj-${Date.now()}-${index}`;
      }
      const objectId = object.id;
      const label = object.label || `Layer ${index + 1}`;

      const isHidden = !object.visible;
      const hideButtonClass = isHidden ? "hide-object active" : "hide-object";

      const actionButton =
        layerType === "object"
          ? `<button class="layer-button delete" title="삭제">
          <svg id="Layer_1" x="0px" y="0px" viewBox="-25 -25 700 700" xml:space="preserve">
            <g>
              <g>
                <path fill="red" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path>
              </g>
            </g>
            <g>
              <g>
                <path fill="red" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path>
              </g>
            </g>
            <g>
              <g>
                <path fill="red" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path>
              </g>
            </g>
            <g>
              <g>
                <path fill="red" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path>
              </g>
            </g>
          </svg>
        </button>`
          : `<button class="layer-button open-setting" title="설정"></button>`;

      layerList.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="layer" data-object="${objectId}" draggable="true">
          <button class="layer-button ${hideButtonClass}" type="button"></button>
          <div class="layer-name">
            <input class="layer-custom-name" value="${label}">
            <div class="layer-options">
              <button class="layer-button move-up" title="위로 올리기"></button>
              <button class="layer-button move-down" title="내리기"></button>
              ${actionButton}
            </div>
          </div>
        </div>
      `
      );
    });

    const layers = layerList.querySelectorAll(".layer");
    layers.forEach((layer) => {
      layer.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", layer.getAttribute("data-object"));
        layer.classList.add("dragging");
      });

      layer.addEventListener("dragend", () => {
        layer.classList.remove("dragging");
        layerList
          .querySelectorAll(".layer")
          .forEach((el) => el.classList.remove("drop-target"));
      });

      layer.addEventListener("dragover", (e) => {
        e.preventDefault();
        layer.classList.add("drop-target");
      });

      layer.addEventListener("dragleave", () => {
        layer.classList.remove("drop-target");
      });

      layer.addEventListener("drop", (e) => {
        e.preventDefault();
        layer.classList.remove("drop-target");
        const draggedId = e.dataTransfer.getData("text/plain");
        const droppedId = layer.getAttribute("data-object");

        if (draggedId === droppedId) return;

        const draggedLayer = layerList.querySelector(
          `.layer[data-object="${draggedId}"]`
        );
        const droppedLayer = layerList.querySelector(
          `.layer[data-object="${droppedId}"]`
        );
        const allLayers = Array.from(layerList.querySelectorAll(".layer"));

        const draggedIndex = allLayers.indexOf(draggedLayer);
        const droppedIndex = allLayers.indexOf(droppedLayer);

        if (draggedIndex < droppedIndex) {
          layerList.insertBefore(draggedLayer, droppedLayer.nextSibling);
        } else {
          layerList.insertBefore(draggedLayer, droppedLayer);
        }

        const draggedObject = _self.canvas
          .getObjects()
          .find((obj) => obj.id === draggedId);
        const droppedObject = _self.canvas
          .getObjects()
          .find((obj) => obj.id === droppedId);

        if (draggedObject && droppedObject) {
          const canvasObjects = _self.canvas.getObjects();
          const draggedCanvasIndex = canvasObjects.indexOf(draggedObject);
          const droppedCanvasIndex = canvasObjects.indexOf(droppedObject);

          _self.canvas.remove(draggedObject);
          _self.canvas.insertAt(draggedObject, droppedCanvasIndex);
          _self.canvas.fire("object:modified");
          _self.canvas.renderAll();
        }

        updateLayers();
      });
    });

    const activeObjects = _self.canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      if (obj.id) {
        const selectedLayer = document.querySelector(
          `${_self.containerSelector} .layer[data-object="${obj.id}"]`
        );
        if (selectedLayer) selectedLayer.classList.add("layer-selected");
      }
    });
  };

  document
    .querySelector(`${_self.containerSelector} #layer-inner-list`)
    .addEventListener("click", (e) => {
      const button = e.target.closest(".layer-button");
      const layer = e.target.closest(".layer");
      if (!layer) return;

      const objectId = layer.getAttribute("data-object");
      const object = _self.canvas
        .getObjects()
        .find((obj) => obj.id === objectId);
      if (!object) return;

      if (button) {
        if (button.classList.contains("hide-object")) {
          object.set({ visible: !object.visible });
          button.classList.toggle("active", !object.visible);
          _self.canvas.fire("object:modified");
          _self.canvas.renderAll();
        } else if (button.classList.contains("move-up")) {
          _self.canvas.bringObjectForward(object);
          _self.canvas.fire("object:modified");
        } else if (button.classList.contains("move-down")) {
          _self.canvas.sendObjectBackwards(object);
          _self.canvas.fire("object:modified");
        } else if (button.classList.contains("open-setting")) {
          if (
            object.overlayImage &&
            confirm(`"${object.label}"을(를) 편집 하시겠습니까?`)
          ) {
            try {
              editObject(object);
            } catch (error) {
              console.error("편집 모드 전환 실패:", error);
            }
          }
        } else if (button.classList.contains("delete")) {
          if (confirm(`"${object.label}"을(를) 삭제하시겠습니까?`)) {
            _self.canvas.remove(object);
            _self.canvas.discardActiveObject().renderAll();
            _self.canvas.fire("object:modified");
            try {
              alert(`"${object.label}" 가 삭제되었습니다.`);
            } catch (error) {
              console.error("삭제 실패:", error);
              alert("삭제하는 데 실패했습니다.");
            }
          }
        }
        return;
      }

      if (
        !e.target.classList.contains("move-up") &&
        !e.target.classList.contains("move-down") &&
        !e.target.classList.contains("hide-object") &&
        !e.target.classList.contains("open-setting") &&
        !e.target.classList.contains("delete") &&
        !layer.classList.contains("layer-selected")
      ) {
        const selectedObject = _self.canvas
          .getObjects()
          .find((obj) => obj.id === objectId);
        if (!selectedObject) return;

        const activeObject = _self.canvas.getActiveObject();
        if (activeObject === selectedObject) {
          _self.canvas.discardActiveObject(selectedObject);
        } else {
          _self.canvas.setActiveObject(selectedObject);
        }
        _self.canvas.renderAll();
        updateLayers();
      }
    });

  _self.canvas.on("object:added", (e) => {
    if (e.target && !e.target.id) {
      e.target.id = `obj-${Date.now()}-${getFilteredFocusObjects().length}`;
    }
    updateLayers();
  });
  _self.canvas.on("object:removed", updateLayers);
  _self.canvas.on("object:modified", updateLayers);
  _self.canvas.on("selection:created", updateLayers);
  _self.canvas.on("selection:updated", updateLayers);
  _self.canvas.on("selection:cleared", () => {
    document
      .querySelectorAll(`${_self.containerSelector} .layer`)
      .forEach((el) => el.classList.remove("layer-selected"));
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

  function openOverlayImageSettingModal(object) {
    const modal = document.createElement("div");
    modal.id = "overlay-image-setting-modal";

    const content = document.createElement("div");
    content.classList.add("content");

    const tabContainer = document.createElement("div");
    tabContainer.classList.add("tab-container");

    const tabs = [
      { api: retModelImgUrl, id: "modelImg" },
      { api: retOceanImgUrl, id: "oceanImg" },
      { api: retForeImgUrl, id: "foreImg" },
      { api: retGridImg, id: "gridImg" },
    ];

    let tab;
    tabs.forEach((t) => {
      if (t.id == object.apiType) {
        tab = t;
      }
    });
    const tabWrapper = document.createElement("div");
    tabWrapper.classList.add("tab-wrapper");

    const tabHeader = document.createElement("div");
    tabHeader.id = `${object.apiType}-header`;
    tabHeader.style.cssText =
      "display: flex; justify-content: space-between; align-items: center;";

    const tabLabel = document.createElement("p");
    tabLabel.textContent = object.label;
    tabLabel.classList.add("tab-label");
    tabLabel.id = `${object.apiType}-label`;
    tabHeader.appendChild(tabLabel);

    const closeButton = document.createElement("button");
    closeButton.textContent = "닫기";
    closeButton.style.cssText = "height: 50%;";
    closeButton.addEventListener("click", () => modal.remove());
    tabHeader.appendChild(closeButton);

    const tabContent = document.createElement("div");
    tabContent.classList.add("tab-content");
    tabContent.id = `${object.apiType}-content`;

    const form = createForm(object.apiType, tab.api, object, _self);
    tabContent.appendChild(form);

    tabWrapper.appendChild(tabHeader);
    tabWrapper.appendChild(tabContent);
    tabContainer.appendChild(tabWrapper);
    content.appendChild(tabContainer);
    modal泳;
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  function createForm(tabId, apiService, object, _self) {
    const form = document.createElement("form");
    form.classList.add("overlay-setting-form");

    let fields = [];
    if (tabId === "modelImg") {
      fields = [];
    } else if (tabId === "oceanImg") {
      fields = [];
    } else if (tabId === "foreImg") {
      fields = [];
    } else if (tabId === "gridImg") {
      fields = [
        {
          label: "선 색상",
          name: "contourLineColor",
          type: "select",
          options: [
            { value: "0x000000", label: "검정" },
            { value: "0xFF0000", label: "빨강" },
            { value: "0x0000FF", label: "파랑" },
          ],
          value:
            (object.params instanceof Map
              ? object.params.get("contourLineColor")
              : object.params?.contourLineColor) || "0x000000",
        },
        {
          label: "선 종류",
          name: "contourLineDiv",
          type: "select",
          options: [
            { value: "D", label: "짧은 점선" },
            { value: "A", label: "실선" },
            { value: "H", label: "긴 점선" },
          ],
          value:
            (object.params instanceof Map
              ? object.params.get("contourLineDiv")
              : object.params?.contourLineDiv) || "D",
        },
        {
          label: "선 두께",
          name: "contourLineThck",
          type: "select",
          options: [
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "6", label: "6" },
            { value: "7", label: "7" },
            { value: "8", label: "8" },
          ],
          value:
            (object.params instanceof Map
              ? object.params.get("contourLineThck")
              : object.params?.contourLineThck) || "1",
        },
      ];
    }

    fields.forEach((field) => {
      const label = document.createElement("label");
      label.textContent = field.label;
      let input;
      if (field.type === "select") {
        input = createSelect(field.name, field.options, field.value);
      } else if (field.type === "color") {
        input = createColorPicker(field.name, field.value);
      } else {
        input = createInput(field.name, field.value);
      }
      form.appendChild(label);
      form.appendChild(input);
    });

    const updateButton = document.createElement("button");
    updateButton.textContent = "업데이트";
    updateButton.type = "button";
    updateButton.addEventListener("click", async () => {
      const params = new FormData(form);
      const updatedParams = new URLSearchParams(
        object.params instanceof Map
          ? Object.fromEntries(object.params)
          : object.params || {}
      );
      for (const [key, value] of params) {
        if (key === "contourLineColor" && value.startsWith("#")) {
          updatedParams.set(key, "0x" + value.slice(1));
        } else {
          updatedParams.set(key, value);
        }
      }

      const data = await fetchData(
        apiService,
        Object.fromEntries(updatedParams)
      );
      if (data) {
        updateImageSrc(object, data, _self);
      }
    });
    form.appendChild(updateButton);

    return form;
  }

  function createSelect(name, options, selectedValue) {
    const select = document.createElement("select");
    select.name = name;
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.label = opt.label;
      option.textContent = opt.label;
      if (opt.value === selectedValue) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  function createInput(name, value) {
    const input = document.createElement("input");
    input.type = "text";
    input.name = name;
    input.value = value || "";
    return input;
  }

  function createColorPicker(name, value) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "color-picker";
    input.name = name;
    input.value = "#" + value.slice(2) || "#0000ff";

    const initializeSpectrum = () => {
      if (typeof $(input).spectrum !== "function") {
        return;
      }

      $(input).spectrum({
        color: input.value,
        showInitial: true,
        showButtons: true,
        type: "color",
        showInput: true,
        showAlpha: false,
        allowEmpty: false,
        preferredFormat: "hex",
        move: function (color) {
          input.value = color.toHexString();
        },
        change: function (color) {
          input.value = color.toHexString();
        },
      });
    };

    if (input.isConnected) {
      initializeSpectrum();
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body.contains(input)) {
          initializeSpectrum();
          obs.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return input;
  }

  function editObject(object) {
    let anotherObjects = _self.canvas
      .getObjects()
      .filter((obj) => obj.id !== object.id);

    anotherObjects = anotherObjects
      .filter((obj) => obj.visible === true)
      .forEach((obj) => {
        obj.visible = false;
      });

    _self.canvas.setActiveObject(object);
    _self.canvas.renderAll();
  }

  async function fetchData(apiService, params) {
    const response = await apiService(params);
    return {
      image: await response.image.blob(),
      params: response.params,
    };
  }

  function updateImageSrc(object, data, _self) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const newSrc = e.target.result;
      object.setSrc(newSrc, () => {
        object.params = data.params;
        _self.canvas.renderAll();
      });
    };
    reader.readAsDataURL(data.image);
  }

  function toggleLayerType(target) {
    const selectObjectButton = document.querySelector(
      "#select-object-type-button"
    );
    const selectOverlayButton = document.querySelector(
      "#select-overlay-type-button"
    );

    if (!selectObjectButton || !selectOverlayButton) {
      console.warn("버튼 요소를 찾을 수 없습니다.");
      return;
    }

    const isObjectButton =
      target.id === "select-object-type-button" ||
      target.closest("#select-object-type-button");
    const isOverlayButton =
      target.id === "select-overlay-type-button" ||
      target.closest("#select-overlay-type-button");

    if (isObjectButton) {
      selectObjectButton.classList.add("active");
      selectOverlayButton.classList.remove("active");
    } else if (isOverlayButton) {
      selectOverlayButton.classList.add("active");
      selectObjectButton.classList.remove("active");
    }
  }

  updateLayers();
}

export { layerListPanel };
