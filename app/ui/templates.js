import { resizeImg } from "../utils/resizeImg.js";

/**
 * 템플릿 패널
 */

("use strict");

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

  const templateManagerTop = document.createElement("div");
  templateManagerTop.classList.add("template-manager-top");

  const openShareGalleryButton = document.createElement("button");
  openShareGalleryButton.classList.add("open-share-gallery-button");
  openShareGalleryButton.classList.add("btn_g");
  openShareGalleryButton.textContent = "이미지 저장소 관리";
  openShareGalleryButton.addEventListener("click", () => {
    openShareGallery();
  });

  templateManagerTop.appendChild(openShareGalleryButton);

  // 템플릿 추가 버튼
  const button = document.createElement("button");
  button.classList.add("template-add-button");
  button.classList.add("btn_b");
  button.innerHTML = "템플릿 추가";
  button.onclick = function () {
    const templateName = prompt("저장할 템플릿 이름을 입력해주세요:");
    if (!templateName) {
      alert("템플릿 이름이 입력되지 않았습니다!");
      return;
    }

    const canvasJsonData = _self.canvas.toJSON(["name"]);
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
      timestamp: new Date().getTime(), // 현재 시간을 기준으로 최신 timestamp 부여
    };

    TemplatesList.push(newTemplate);
    alert(`Template "${templateName}" 저장 성공!`);

    const event = new CustomEvent("ImageEditor.newTemplate", {
      detail: newTemplate,
    });
    window.dispatchEvent(event);

    // 리스트를 timestamp 기준으로 내림차순 정렬 (최신이 위로)
    TemplatesList.sort((a, b) => b.timestamp - a.timestamp);
    templatesList.innerHTML = ""; // 기존 리스트 초기화
    updateTemplates(TemplatesList, templatesList); // 정렬된 리스트로 UI 업데이트
  };

  templateManagerTop.appendChild(button);

  templateManager.appendChild(templateManagerTop);

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

  // 초기 로드 시에도 timestamp로 정렬
  TemplatesList.sort((a, b) => b.timestamp - a.timestamp);
  updateTemplates(TemplatesList, templatesList);

  function openShareGallery() {
    // 기존 openShareGallery 함수 내용 유지
    const shareGalleryModal = document.createElement("div");
    shareGalleryModal.classList.add("custom-modal-container");

    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("modal-overlay");
    modalOverlay.addEventListener("click", closeShareGallery);

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header");

    const modalLabel = document.createElement("h3");
    modalLabel.classList.add("modal-label");
    modalLabel.textContent = "템플릿 저장소";
    modalHeader.appendChild(modalLabel);

    const filterBar = document.createElement("div");
    filterBar.id = "filter-bar";

    const categories = [
      { name: "my-template", label: "내 템플릿" },
      { name: "share-template", label: "공유 템플릿" },
    ];
    const selectCategoryTab = document.createElement("div");
    selectCategoryTab.id = "select-category-tab";

    categories.forEach((category) => {
      const selectCategoryButton = document.createElement("button");
      selectCategoryButton.classList.add("select-category-button");
      selectCategoryButton.classList.add("btn_w");
      selectCategoryButton.textContent = category.label;
      selectCategoryButton.id = category.name;

      selectCategoryButton.addEventListener("click", function () {
        const templates = getFilteredTemplatesByCategory(category);
      });

      selectCategoryTab.appendChild(selectCategoryButton);
    });

    filterBar.appendChild(selectCategoryTab);

    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "검색어를 입력해주세요.";
    searchBar.classList.add("search-bar");

    filterBar.appendChild(searchBar);

    const shareGallery = document.createElement("div");
    shareGallery.classList.add("share-gallery");

    const modalFooter = document.createElement("div");
    modalFooter.classList.add("modal-footer");

    const closeButton = document.createElement("button");
    closeButton.textContent = "닫기";
    closeButton.classList.add("close-modal-button");
    closeButton.classList.add("btn_g");
    closeButton.addEventListener("click", closeShareGallery);
    modalFooter.appendChild(closeButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(filterBar);
    modalContent.appendChild(shareGallery);
    modalContent.appendChild(modalFooter);
    shareGalleryModal.appendChild(modalOverlay);
    shareGalleryModal.appendChild(modalContent);
    document.body.appendChild(shareGalleryModal);

    const sortedTemplates = [...TemplatesList].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    sortedTemplates.forEach((template) => {
      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("share-image-wrapper");

      const templateElement = document.createElement("img");
      templateElement.src = template.preview;
      templateElement.classList.add("share-gallery-image");

      const templateName = document.createElement("p");
      templateName.textContent = template.name;
      templateName.classList.add("img-title");

      const manageTemplate = document.createElement("div");
      manageTemplate.classList.add("manage-image");

      const saveButton = document.createElement("button");
      saveButton.textContent = "저장";
      saveButton.classList.add("save-button");
      saveButton.classList.add("btn_w");
      saveButton.addEventListener("click", () => saveTemplate(template));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.classList.add("delete-button");
      deleteButton.classList.add("btn_w");
      deleteButton.addEventListener("click", () => deleteTemplate(template));

      const downloadButton = document.createElement("button");
      downloadButton.textContent = "다운로드";
      downloadButton.classList.add("download-button");
      downloadButton.classList.add("btn_w");
      downloadButton.addEventListener("click", () =>
        downloadTemplate(template)
      );

      const shareButton = document.createElement("button");
      shareButton.textContent = "공유";
      shareButton.classList.add("share-button");
      shareButton.classList.add("btn_w");
      shareButton.addEventListener("click", () => shareTemplate(template));

      imageWrapper.appendChild(templateElement);
      imageWrapper.appendChild(templateName);
      imageWrapper.appendChild(manageTemplate);
      manageTemplate.appendChild(saveButton);
      manageTemplate.appendChild(deleteButton);
      manageTemplate.appendChild(downloadButton);
      manageTemplate.appendChild(shareButton);
      shareGallery.appendChild(imageWrapper);
    });
  }

  function getFilteredTemplatesByCategory(category) {
    if (category.name === "my-template") {
      console.log("내 템플릿 불러오기");
    } else if (category.name === "share-template") {
      console.log("공유 템플릿 불러오기");
    }
  }

  function closeShareGallery() {
    const modal = document.querySelector(".custom-modal-container");
    if (modal) {
      modal.remove();
    }
  }

  function saveTemplate(template) {
    console.log(template, "저장하기");
  }

  function deleteTemplate(template) {
    console.log(template, "삭제하기");
  }

  function downloadTemplate(template) {
    console.log(template, "다운로드");
    const link = document.createElement("a");
    link.href = template.preview;
    link.download = template.name || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function shareTemplate(template) {
    console.log(template, "공유하기");
  }
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
    const templateForm = document.createElement("div");

    const templateHeader = document.createElement("div");
    templateHeader.classList.add("template-header");

    const templateTitle = document.createElement("p");
    templateTitle.classList.add("template-title");
    templateTitle.textContent = template.name;
    templateHeader.appendChild(templateTitle);

    const removeButton = document.createElement("button");
    removeButton.classList.add("template-remove-button");
    removeButton.classList.add("btn_r");
    removeButton.innerHTML = "삭제";
    removeButton.addEventListener("click", () => {
      templates.splice(index, 1);
      templatesList.innerHTML = "";
      templates.sort((a, b) => b.timestamp - a.timestamp);
      updateTemplates(templates, templatesList);
    });
    templateHeader.appendChild(removeButton);
    templateForm.appendChild(templateHeader);

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
