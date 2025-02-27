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

  // Create template panel and append it to the container
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

  // Create list of templates
  const templatesList = document.createElement("div");
  templatesList.classList.add("list-templates");
  content.appendChild(templatesList);

  // Append templates to the list
  TemplatesList.forEach((img, index) => {
    const button = document.createElement("div");
    button.classList.add("button");
    button.dataset.index = index;

    const imgElement = document.createElement("img");
    imgElement.src = img.preview;

    button.appendChild(imgElement);
    templatesList.appendChild(button);
  });

  // Handle click on template button
  templatesList.addEventListener("click", function (event) {
    if (event.target.closest(".button")) {
      const index = event.target.closest(".button").dataset.index;
      try {
        applyTemplate(index, TemplatesList, _self.canvas);
      } catch (_) {
        console.error("템플릿을 추가할 수 없습니다.", _);
      }
    }
  });

  // Create and handle "Add Template" button
  const button = document.createElement("button");
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

    _self.canvas.setBackgroundImage(null, _self.canvas.renderAll.bind(_self.canvas));
    _self.canvas.backgroundColor = "transparent";
    _self.canvas.renderAll();

    const preview = _self.canvas.toDataURL({
      format: "png",
      multiplier: 0.2,
    });

    _self.canvas.setBackgroundImage(originalBackgroundImage, _self.canvas.renderAll.bind(_self.canvas));
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
    TemplatesList.forEach((img, index) => {
      const button = document.createElement("div");
      button.classList.add("button");
      button.dataset.index = index;

      const imgElement = document.createElement("img");
      imgElement.src = img.preview;

      button.appendChild(imgElement);
      templatesList.appendChild(button);
    });
  };

  content.appendChild(button);
}

/**
 * Apply Selected Template
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

export { templates };