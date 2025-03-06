import { resizeImg } from "../utils/resizeImg.js";

/**
 * Define action to add templates to canvas
 */

"use strict";

const defaultTemplates = [];

function templates() {
  const _self = this;

  let TemplatesList = defaultTemplates;
  if (Array.isArray(this.templates) && this.templates.length)
    TemplatesList.push(...this.templates);

  // tool panel
  const toolPanel = document.createElement("div");
  toolPanel.classList.add("toolpanel");
  toolPanel.id = "templates-panel";

  const content = document.createElement("div");
  content.classList.add("content");

  const title = document.createElement("p");
  title.classList.add("title");
  title.textContent = "템플릿";

  content.appendChild(title);
  toolPanel.appendChild(content);
  document
    .querySelector(`${this.containerSelector} .main-panel`)
    .appendChild(toolPanel);

  const templateManager = document.createElement("div");
  templateManager.classList.add("template-manager");
  content.appendChild(templateManager);

  // 템플릿 리스트
  const templatesList = document.createElement("div");
  templatesList.classList.add("list-templates");
  templateManager.appendChild(templatesList);

  // 템플릿 리스트 클릭 이벤트
  templatesList.addEventListener("click", function (event) {
    console.log("리스트 클릭");
    if (event.target.closest(".template-button")) {
      const index = event.target.closest(".template-button").dataset.index;
      try {
        applyTemplate(index, TemplatesList, _self.canvas);
      } catch (_) {
        console.error("템플릿을 추가할 수 없습니다.", _);
      }
    }
  });

  updateTemplates(TemplatesList, templatesList);

  // 템플릿 추가 버튼
  const button = document.createElement("button");
  button.classList.add("template-add-button");
  button.innerHTML = "템플릿 추가";
  button.onclick = function () {
    const templateName = prompt("저장할 템플릿 이름을 입력해주세요:");
    if (!templateName) {
      alert("템플릿 이름이 입력되지 않았습니다!");
      return;
    }

    const canvasObjects = _self.canvas.getObjects();
    const canvasJsonData = _self.canvas.toJSON(["name"]);
    // 필터링 시 유효한 객체만 포함
    const filteredData = {
      objects: canvasJsonData.objects.filter((obj) => {
        const isValid = obj && typeof obj.type === "string";
        if (!isValid) console.warn("잘못된 객체입니다:", obj);
        return isValid && (obj.type !== "image" || !obj.isBackground);
      }),
    };
    const canvasData = JSON.stringify(filteredData);

    const originalBackgroundImage = _self.canvas.backgroundImage;
    const originalBackgroundColor = _self.canvas.backgroundColor;

    _self.canvas.setBackgroundImage(
      null,
      _self.canvas.renderAll.bind(_self.canvas)
    );
    _self.canvas.backgroundColor = "transparent";
    _self.canvas.renderAll();

    // 저장될 템플릿 사이즈 임의로 설정
    const templateDimension = {
      width: 1280,
      height: 720,
    };
    const templateCanvas = _self.canvas;
    templateCanvas.setDimensions(templateDimension);

    const preview = templateCanvas.toDataURL({
      format: "png",
      multiplier: 0.2,
    });

    _self.canvas.setBackgroundImage(
      originalBackgroundImage,
      _self.canvas.renderAll.bind(_self.canvas)
    );
    _self.canvas.backgroundColor = originalBackgroundColor;
    _self.canvas.renderAll();

    const newTemplate = {
      name: templateName,
      preview: preview,
      data: canvasData,
    };

    TemplatesList.push(newTemplate);
    alert(`Template "${templateName}" 저장 성공!`);

    const event = new CustomEvent("ImageEditor.newTemplate", {
      detail: newTemplate,
    });
    window.dispatchEvent(event);

    templatesList.innerHTML = "";
    updateTemplates(TemplatesList, templatesList);
  };

  templateManager.appendChild(button);
}

/**
 * 선택한 템플릿 캔버스에 추가
 * @param {Integer} index
 * @param {Array} templates
 * @param {Canvas} canvas
 */
function applyTemplate(index, templates, canvas) {
  const template = templates[index];
  const jsonData = JSON.parse(template.data);

  const newObjects = [];
  fabric.util.enlivenObjects(
    jsonData.objects,
    (objects) => {
      objects.forEach((obj) => {
        canvas.add(obj);
        newObjects.push(obj);
      });

      if (newObjects.length > 0) {
        const group = new fabric.Group(newObjects, {
          name: `template_${template.name}_${index}`,
        });
        newObjects.forEach((obj) => canvas.remove(obj));
        canvas.add(group);
        canvas.setActiveObject(group);
      }

      canvas.renderAll();
    },
    "fabric"
  );
}

// 템플릿 리스트 업데이트
function updateTemplates(templates, templatesList) {
  templates.forEach((template, index) => {
    // 템플릿 형식
    const templateForm = document.createElement("div");

    // Header(제목, 삭제버튼)
    const templateHeader = document.createElement("div");
    templateHeader.classList.add("template-header");

    // 템플릿 제목
    const templateTitle = document.createElement("p");
    templateTitle.classList.add("template-title");
    templateTitle.textContent = template.name;
    templateHeader.appendChild(templateTitle);

    // 삭제 버튼
    const removeButton = document.createElement("button");
    removeButton.classList.add("template-remove-button");
    removeButton.innerHTML = "삭제";
    templateHeader.appendChild(removeButton);
    templateForm.appendChild(templateHeader);

    // 템플릿 추가 버튼 => 이미지(preview) 영역
    const button = document.createElement("div");
    button.classList.add("template-button");
    button.dataset.index = index;

    const imgElement = document.createElement("img");
    resizeImg(template.preview, 239, function (resizedImageUrl) {
      imgElement.src = resizedImageUrl;
    });

    button.appendChild(imgElement);
    templateForm.appendChild(button);
    templatesList.appendChild(templateForm);
  });
}

export { templates };
