import {
  getFilteredFocusObjects,
  getOverlayImages,
  removeObjects,
} from "../utils/utils.js";
import { retForeImgUrl } from "../api/retForeImgUrl.js";
import { retModelImgUrl } from "../api/retModelImgUrl.js";
import { retOceanImgUrl } from "../api/retOceanImgUrl.js";
import { retGridImg } from "../api/retGridImgUrl.js";
import { ICONS } from "../models/Icons.ts";

function layerListPanel() {
  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel layerpanel visible" id="layer-panel">
      <div class="content">
        <div class="hide-show-handler"></div>
        <p class="title">레이어 설정</p>
        <div id="select-layer-type"></div>
        <div id="layer-inner-list"></div>
      </div>
    </div>`
  );

  let layerType = "object";
  let lastSelectedLayerId = null;

  function showTooltip(button) {
    removeTooltip();
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerText = button.dataset.title;
    document.body.appendChild(tooltip);
    const buttonRect = button.getBoundingClientRect();
    let tooltipLeft =
      buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2;
    let tooltipTop = buttonRect.top + buttonRect.height + 5;
    const screenWidth = window.innerWidth;
    if (tooltipLeft < 0) {
      tooltipLeft = 5;
    } else if (tooltipLeft + tooltip.offsetWidth > screenWidth) {
      tooltipLeft = screenWidth - tooltip.offsetWidth - 5;
    }
    tooltip.style.left = `${tooltipLeft}px`;
    tooltip.style.top = `${tooltipTop}px`;
    setTimeout(() => {
      tooltip.style.opacity = "1";
    }, 10);
  }

  function removeTooltip() {
    const tooltips = document.querySelectorAll(".tooltip");
    tooltips.forEach((tip) => tip.remove());
  }

  const selectLayerType = document.querySelector(
    `${_self.containerSelector} #select-layer-type`
  );

  const selectObjectTypeButton = document.createElement("button");
  selectObjectTypeButton.id = "select-object-type-button";
  selectObjectTypeButton.value = "object";
  selectObjectTypeButton.textContent = "객체";
  selectObjectTypeButton.classList.add("toggle-switch-btn", "active");
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
  selectOverlayTypeButton.classList.add("toggle-switch-btn");
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
    let objects = getFilteredFocusObjects();
    if (layerType === "overlay") {
      objects = getOverlayImages();
      // overlay 모드일 때, 캔버스에서 직접 선택 안되도록 설정
      objects.forEach((o) => {
        o.selectable = false;
        o.evented = false;
      });
    } else {
      getOverlayImages().forEach((o) => {
        o.selectable = false;
        o.evented = false;
      });
    }

    objects.forEach((object, index) => {
      if (!object.id) {
        object.id = `obj-${Date.now()}-${index}`;
      }
      const objectId = object.id;
      const label = object.label || `Layer ${index + 1}`;

      const isHidden = !object.visible;
      const hideButtonClass = isHidden ? "hide-object active" : "hide-object";
      const hideShowTitle = isHidden ? "객체 보이기" : "객체 숨기기";

      // --- ✨ 수정된 부분: layerType에 따라 버튼 다르게 표시 ---
      let moveButtons = "";
      let actionButton = "";

      if (layerType === "object") {
        actionButton = `<button class="layer-button delete" data-title="삭제">
                          ${ICONS.delete}
                        </button>`;
        moveButtons = `<button class="layer-button move-up" data-title="위로 올리기"></button>
                       <button class="layer-button move-down" data-title="내리기"></button>`;
      } else {
        // layerType === 'overlay'
        actionButton = `<button class="layer-button open-setting" data-title="설정"></button>`;
        moveButtons = `<button class="layer-button bring-front" data-title="맨 앞으로 가져오기">${ICONS.bringToFront}</button>
                       <button class="layer-button send-back" data-title="맨 뒤로 보내기">${ICONS.sendToBack}</button>`;
      }
      const editButton = `<button class="layer-button edit-name" data-title="이름 수정">${ICONS.pencil}</button>`;

      layerList.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="layer" data-object="${objectId}">
          <button class="layer-button ${hideButtonClass}" type="button" data-title="${hideShowTitle}"></button>
          <div class="layer-name">
            <input class="layer-custom-name" value="${label}" readonly>
            <div class="layer-options">
              ${editButton}
              ${moveButtons}
              ${actionButton}
            </div>
          </div>
        </div>
        `
      );
    });

    const buttonsWithTooltip = layerList.querySelectorAll("[data-title]");
    buttonsWithTooltip.forEach((button) => {
      button.addEventListener("mouseenter", () => showTooltip(button));
      button.addEventListener("mouseleave", removeTooltip);
    });

    const layers = layerList.querySelectorAll(".layer");

    // --- ✨ 수정된 부분: object 타입일 때만 드래그 기능 활성화 ---
    if (layerType === "object") {
      layers.forEach((layer) => {
        layer.setAttribute("draggable", "true"); // 드래그 가능하도록 설정
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

          const allCanvasObjects = _self.canvas.getObjects();
          const draggedObject = allCanvasObjects.find(
            (obj) => obj.id === draggedId
          );
          const droppedObject = allCanvasObjects.find(
            (obj) => obj.id === droppedId
          );

          if (draggedObject && droppedObject) {
            const droppedIndex = allCanvasObjects.indexOf(droppedObject);
            _self.canvas.moveObjectTo(draggedObject, droppedIndex);

            _self.canvas.fire("object:modified");
            _self.canvas.renderAll();
          }
        });
      });
    }

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
        if (button.classList.contains("edit-name")) {
          const input = layer.querySelector(".layer-custom-name");
          input.readOnly = false;
          input.focus();
          input.select();
        } else if (button.classList.contains("hide-object")) {
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
        // --- ✨ 수정된 부분: overlay용 버튼 핸들러 추가 ---
        } else if (button.classList.contains("bring-front")) {
            _self.canvas.bringObjectToFront(object);
            _self.canvas.fire("object:modified");
        } else if (button.classList.contains("send-back")) {
            _self.canvas.sendObjectToBack(object);
            _self.canvas.fire("object:modified");
        } else if (button.classList.contains("delete")) {
          if (_self.canvas.getActiveObjects().includes(object)) {
            if (confirm("선택된 레이어를 삭제하시겠습니까?")) {
              removeObjects(_self.canvas);
            }
          } else {
            alert("레이어 선택 후 삭제할 수 있습니다.");
          }
        } else if (button.classList.contains("open-setting")) {
          openOverlayImageSettingModal(object);
        }
        return; // 버튼 클릭 시 선택 로직은 실행하지 않음
      }

      // --- ✨ 수정된 부분: object 타입일 때만 레이어 클릭으로 객체 선택 ---
      if (layerType === "object") {
        if (object.isBackgroundImage) {
            return;
        }

        const isShiftPressed = e.shiftKey;
        const isCtrlPressed = e.ctrlKey || e.metaKey;

        if (isShiftPressed || isCtrlPressed) {
          if (isShiftPressed) {
            const allLayers = Array.from(
              document.querySelectorAll(
                `${_self.containerSelector} #layer-inner-list .layer`
              )
            ).reverse();
            const allLayerIds = allLayers.map((l) =>
              l.getAttribute("data-object")
            );

            const lastIndex = lastSelectedLayerId
              ? allLayerIds.indexOf(lastSelectedLayerId)
              : -1;
            const currentIndex = allLayerIds.indexOf(objectId);

            if (lastIndex !== -1 && currentIndex !== -1) {
              const start = Math.min(lastIndex, currentIndex);
              const end = Math.max(lastIndex, currentIndex);
              const idsToSelect = allLayerIds.slice(start, end + 1);

              const objectsToSelect = _self.canvas
                .getObjects()
                .filter((obj) => idsToSelect.includes(obj.id));

              if (objectsToSelect.length > 1) {
                _self.canvas.setActiveObject(
                  new fabric.ActiveSelection(objectsToSelect, {
                    canvas: _self.canvas,
                  })
                );
              } else if (objectsToSelect.length === 1) {
                _self.canvas.setActiveObject(objectsToSelect[0]);
              }
            } else {
              _self.canvas.setActiveObject(object);
              lastSelectedLayerId = objectId;
            }
          } else if (isCtrlPressed) {
            const activeObjects = _self.canvas.getActiveObjects();
            const isAlreadySelected = activeObjects.includes(object);

            if (isAlreadySelected) {
              const newSelection = activeObjects.filter(
                (obj) => obj.id !== objectId
              );
              _self.canvas.discardActiveObject();
              if (newSelection.length > 1) {
                _self.canvas.setActiveObject(
                  new fabric.ActiveSelection(newSelection, {
                    canvas: _self.canvas,
                  })
                );
              } else if (newSelection.length === 1) {
                _self.canvas.setActiveObject(newSelection[0]);
              }
            } else {
              const newSelection = [...activeObjects, object];
              _self.canvas.discardActiveObject();
              _self.canvas.setActiveObject(
                new fabric.ActiveSelection(newSelection, {
                  canvas: _self.canvas,
                })
              );
            }
            lastSelectedLayerId = objectId;
          }
        } else {
          _self.canvas.setActiveObject(object);
          lastSelectedLayerId = objectId;
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
        lastSelectedLayerId = null;
        document
          .querySelectorAll(`${_self.containerSelector} .layer`)
          .forEach((el) => el.classList.remove("layer-selected"));
      });
    
    document
        .querySelector(`${_self.containerSelector} #layer-inner-list`)
        .addEventListener(
          "blur",
          (e) => {
            const input = e.target.closest(".layer-custom-name");
            if (input) {
              input.readOnly = true;
            }
          },
          true
        );
    
    document
        .querySelector(`${_self.containerSelector} #layer-inner-list`)
        .addEventListener(
          "keydown",
          (e) => {
            const input = e.target.closest(".layer-custom-name");
            if (input && e.key === "Enter") {
              input.readOnly = true;
              input.blur();
            }
          },
          true
        );
    
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
    
    function openOverlayImageSettingModal(object) {
        const modal = document.createElement("div");
        modal.id = "overlay-image-setting-modal";
    
        const content = document.createElement("div");
        content.classList.add("content");
        content.addEventListener("click", (e) => e.stopPropagation());
    
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
        tabHeader.classList.add("tab-header");
        tabHeader.id = `${object.apiType}-header`;
    
        const tabLabel = document.createElement("p");
        tabLabel.textContent = object.label;
        tabLabel.classList.add("tab-label");
        tabLabel.id = `${object.apiType}-label`;
        tabHeader.appendChild(tabLabel);
    
        const closeButton = document.createElement("button");
        closeButton.textContent = "닫기";
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
        modal.appendChild(content);
    
        modal.addEventListener("click", () => modal.remove());
        document.body.appendChild(modal);
    }
    
    function createForm(tabId, apiService, object, _self) {
        const form = document.createElement("form");
        form.classList.add("overlay-setting-form");
        form.onsubmit = (e) => e.preventDefault();
    
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
              document.getElementById("overlay-image-setting-modal")?.remove();
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
    
    async function fetchData(apiService, params) {
        try {
            const response = await apiService(params);
            return {
              image: await response.image.blob(),
              params: response.params,
            };
        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert("이미지를 업데이트하는 데 실패했습니다.");
            return null;
        }
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
            return;
        }
    
        selectObjectButton.classList.remove("active");
        selectOverlayButton.classList.remove("active");
    
        target.classList.add("active");
    }
    
    updateLayers();
}

export { layerListPanel };