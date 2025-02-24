/**
 * Define action to add templates to canvas
 */

"use strict";

import { applyTemplate } from "../utils/utils.js";

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
  title.textContent = "Templates";

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
        applyTemplate(index, TemplatesList);
      } catch (_) {
        console.error("Can't add template", _);
      }
    }
  });

  // Create and handle "Add Template" button
  const button = document.createElement("button");
  button.innerHTML = "Add Template";
  button.onclick = function () {
    // Capture the template name
    const templateName = prompt("Digite um nome para o novo template:");
    if (!templateName) {
      alert("Nome do template é obrigatório!");
      return;
    }

    // Capture current canvas state as JSON
    const canvasData = JSON.stringify(_self.canvas.toJSON());

    // Add the new template to the list
    const newTemplate = {
      name: templateName,
      preview: null, // Add a preview if necessary
      data: canvasData,
    };

    const preview = _self.canvas.toDataURL({
      format: "png",
      multiplier: 0.2, // Reduce resolution for a thumbnail
    });
    newTemplate.preview = preview;
    TemplatesList.push(newTemplate);
    
    alert(`Template "${templateName}" salvo com sucesso!`);

    // Dispatch an event after the new template is added
    const event = new CustomEvent("ImageEditor.newTemplate", {
      detail: newTemplate,
    });
    window.dispatchEvent(event);

    // Clear the template list and re-render it
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

export { templates };
