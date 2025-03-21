"use strict";

import { getFilteredFocusObjects, getOverlayImages } from "../utils/utils.js";
import { retForeImgUrl } from "../api/retForeImgUrl.js";
import { retModelImgUrl } from "../api/retModelImgUrl.js";
import { retOceanImgUrl } from "../api/retOceanImgUrl.js";

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
  selectObjectTypeButton.textContent = "요소 레이어";
  selectObjectTypeButton.addEventListener("click", function () {
    layerType = this.value;
    updateLayers();
  });
  selectLayerType.appendChild(selectObjectTypeButton);

  const selectOverlayTypeButton = document.createElement("button");
  selectOverlayTypeButton.id = "select-overlay-type-button";
  selectOverlayTypeButton.value = "overlay";
  selectOverlayTypeButton.textContent = "중첩 자료 레이어";
  selectOverlayTypeButton.addEventListener("click", function () {
    layerType = this.value;
    updateLayers();
  });
  selectLayerType.appendChild(selectOverlayTypeButton);

  const updateLayers = () => {
    const layerList = document.querySelector(
      `${_self.containerSelector} #layer-inner-list`
    );
    layerList.innerHTML = "";
    let objects = getFilteredFocusObjects();
    if (layerType === "overlay") {
      objects = getOverlayImages();
    }
    _self.canvas.renderAll();

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
                <button class="open-setting" title="설정">S</button>
                <button class="move-up" title="위로 올리기">↑</button>
                <button class="move-down" title="내리기">↓</button>
                <button class="hide-object" title="숨기기">H</button>
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
      } else {
        console.warn("Active object missing ID:", obj);
      }
    });
  };

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
    .addEventListener("click", (e) => {
      const layer = e.target.closest(".layer");
      if (
        !layer ||
        e.target.classList.contains("move-up") ||
        e.target.classList.contains("move-down") ||
        e.target.classList.contains("hide-object") ||
        e.target.classList.contains("open-setting-") ||
        layer.classList.contains("layer-selected")
      )
        return;

      const objectId = layer.getAttribute("data-object");
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

      if (button.classList.contains("hide-object")) {
        object.visible = !object.visible;
        button.style.backgroundColor = object.visible ? "#ccc" : "#fff";
        _self.canvas.renderAll();
      } else if (button.classList.contains("move-up")) {
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
      } else if (button.classList.contains("open-setting")) {
        if (object.overlayImage) {
          console.log("중첩 자료 입니다.");
          openOverlayImageSettingModal(object);
        }
      }
    });

  function openOverlayImageSettingModal(object) {
    const modal = document.createElement("div");
    modal.id = "overlay-image-setting-modal";

    const content = document.createElement("div");
    content.classList.add("content");

    const tabContainer = document.createElement("div");
    tabContainer.classList.add("tab-container");

    const tabs = [
      { api: retModelImgUrl, id: "modelImg" },
      {
        api: retOceanImgUrl,
        id: "oceanImg",
      },
      {
        api: retForeImgUrl,
        id: "foreImg",
      },
    ];

    let activeTabCnt = 0;
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
    console.log(object);

    tabWrapper.appendChild(tabHeader);
    tabWrapper.appendChild(tabContent);
    tabContainer.appendChild(tabWrapper);
    content.appendChild(tabContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  function createForm(tabId, apiService, object, _self) {
    const form = document.createElement("form");
    form.classList.add("overlay-setting-form");

    let fields = [];
    if (tabId === "modelImg") {
      fields = [
        {
          label: "모델",
          name: "modl",
          type: "select",
          options: ["GDAPS_KIM", "RDAPS", "LDAPS"],
          value: object.params.get("modl") || "GDAPS_KIM",
        },
        {
          label: "자료 구분",
          name: "varGrp",
          type: "select",
          options: ["PRSS_HGT", "UNIS_SFC"],
          value: object.params.get("varGrp") || "PRSS_HGT",
        },
        {
          label: "변수",
          name: "var",
          type: "select",
          options: ["HGT", "TMP"],
          value: object.params.get("var") || "HGT",
        },
        {
          label: "연직층",
          name: "lev",
          type: "select",
          options: ["1000", "850", "500"],
          value: object.params.get("lev") || "1000",
        },
        {
          label: "분석 시간",
          name: "analTime",
          type: "text",
          value: object.params.get("analTime") || "201905180000",
        },
        {
          label: "예측 시간",
          name: "foreTime",
          type: "text",
          value: object.params.get("foreTime") || "201905180000",
        },
        {
          label: "선 색상",
          name: "contourLineColor",
          type: "color",
          value: object.params.get("contourLineColor") || "0x0000ff",
        },
        {
          label: "선 종류",
          name: "contourLineDiv",
          type: "select",
          options: ["A", "D", "H"],
          value: object.params.get("contourLineDiv") || "A",
        },
        {
          label: "선 두께",
          name: "contourLineThck",
          type: "select",
          options: ["1", "2", "3", "4", "5", "6", "7", "8"],
          value: object.params.get("contourLineThck") || "1",
        },
        {
          label: "스무딩 레벨",
          name: "basicSmtLvl",
          type: "select",
          options: ["1", "2", "3", "4"],
          value: object.params.get("basicSmtLvl") || "1",
        },
        {
          label: "평활 횟수",
          name: "basicTotSmtLvl",
          type: "text",
          value: object.params.get("basicTotSmtLvl") || "5",
        },
      ];
    } else if (tabId === "oceanImg") {
      fields = [
        {
          label: "모델 그룹",
          name: "modlGrp",
          type: "select",
          options: ["GWW", "RWW"],
          value: object.params.get("modlGrp") || "GWW",
        },
        {
          label: "상세 모델",
          name: "modl",
          type: "select",
          options: ["GWW3", "ECMWF_HWAM"],
          value: object.params.get("modl") || "GWW3",
        },
        {
          label: "변수",
          name: "var",
          type: "select",
          options: ["WSPD_SNW", "WVHGT"],
          value: object.params.get("var") || "WSPD_SNW",
        },
        {
          label: "분석 시간",
          name: "analTime",
          type: "text",
          value: object.params.get("analTime") || "201705110000",
        },
        {
          label: "예측 시간",
          name: "foreTime",
          type: "text",
          value: object.params.get("foreTime") || "201705110000",
        },
      ];
    } else if (tabId === "foreImg") {
      fields = [
        {
          label: "자료 그룹",
          name: "varGrp",
          type: "select",
          options: ["UNIS_SFC_WBT", "INSTB_IDX"],
          value: object.params.get("varGrp") || "UNIS_SFC_WBT",
        },
        {
          label: "변수",
          name: "var",
          type: "select",
          options: ["WBT", "CAPE"],
          value: object.params.get("var") || "WBT",
        },
        {
          label: "모델",
          name: "modl",
          type: "select",
          options: ["GDAPS_KIM", "RDAPS"],
          value: object.params.get("modl") || "GDAPS_KIM",
        },
        {
          label: "연직층",
          name: "lev",
          type: "select",
          options: ["2", "850"],
          value: object.params.get("lev") || "2",
        },
        {
          label: "분석 시간",
          name: "analTime",
          type: "text",
          value: object.params.get("analTime") || "201905180000",
        },
        {
          label: "예측 시간",
          name: "foreTime",
          type: "text",
          value: object.params.get("foreTime") || "201905180000",
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
      const updatedParams = new URLSearchParams(object.params);
      for (const [key, value] of params) {
        if (key == "contourLineColor" && value.startsWith("#")) {
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
      option.value = opt;
      option.textContent = opt;
      if (opt === selectedValue) option.selected = true;
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
        // 색상표 표출
        // showPalette: true,
        // palette: [["#000", "#fff"]],
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

  updateLayers();
}

export { layerListPanel };