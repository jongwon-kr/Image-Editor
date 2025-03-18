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
  openShareGalleryButton.textContent = "공유 저장소";
  openShareGalleryButton.addEventListener("click", () => {
    openShareGallery();
  });

  templateManagerTop.appendChild(openShareGalleryButton);

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
      timestamp: new Date().getTime(),
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

  updateTemplates(TemplatesList, templatesList);
  function openShareGallery() {
    // 모달창 생성
    const shareGalleryModal = document.createElement("div");
    shareGalleryModal.classList.add("custom-modal-container");

    // 모달 뒷 배경 (오버레이)
    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("modal-overlay");
    modalOverlay.addEventListener("click", closeShareGallery);

    // 모달 콘텐츠
    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header");

    const modalLabel = document.createElement("h4");
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
      selectCategoryButton.textContent = category.label;
      selectCategoryButton.id = category.name;

      selectCategoryButton.addEventListener("click", function () {
        const templates = getFilteredTemplatesByCategory(category);
      });

      selectCategoryTab.appendChild(selectCategoryButton);
    });

    filterBar.appendChild(selectCategoryTab);

    // 검색바
    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "검색어를 입력해주세요.";
    searchBar.classList.add("search-bar");

    filterBar.appendChild(searchBar);
    // 이미지 갤러리
    const shareGallery = document.createElement("div");
    shareGallery.classList.add("share-gallery");

    const modalFooter = document.createElement("div");
    modalFooter.classList.add("modal-footer");

    // 닫기 버튼
    const closeButton = document.createElement("button");
    closeButton.textContent = "닫기";
    closeButton.classList.add("close-modal-button");
    closeButton.addEventListener("click", closeShareGallery);
    modalFooter.appendChild(closeButton);

    // 모달에 요소 추가
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(filterBar);
    modalContent.appendChild(shareGallery);
    modalContent.appendChild(modalFooter);
    shareGalleryModal.appendChild(modalOverlay);
    shareGalleryModal.appendChild(modalContent);
    document.body.appendChild(shareGalleryModal);

    // 공유 갤러리에 이미지 추가 (시간순 정렬)
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
      saveButton.addEventListener("click", () => saveTemplate(template));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.classList.add("delete-button");
      deleteButton.addEventListener("click", () => deleteTemplate(template));

      // 다운로드 버튼
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "다운로드";
      downloadButton.classList.add("download-button");
      downloadButton.addEventListener("click", () =>
        downloadTemplate(template)
      );

      // 공유 버튼
      const shareButton = document.createElement("button");
      shareButton.textContent = "공유";
      shareButton.classList.add("share-button");
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
      // 내 템플릿
      // 내 템플릿들 필터링 로직 나중에 구현(템플릿 객체에 사용자 정보 및 type(개인, 공유) 추가 필요)
      console.log("내 템플릿 불러오기");
    } else if (category.name === "share-template") {
      // 공유 템플릿
      // 공유 템플릿들 필터링 로직 나중에 구현
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
