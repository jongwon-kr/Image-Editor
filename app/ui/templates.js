// @ts-nocheck
"use strict";

import { resizeImg } from "../utils/resizeImg.js";
import { canvasToJsonData, restoreControlPoints } from "../utils/utils.js";
import {
  retWgcTmplt,
  saveWgcTmplt,
  deleteWgcTmplt,
  getFileData,
} from "../api/wgcApiService.js";

const defaultTemplates = [];

function templates() {
  const _self = this;
  let lastRenderedTemplates = [];
  let TemplatesList = defaultTemplates;
  let isMyData = true;
  let currentPage = 1;
  const itemsPerPage = 8;
  const currentUsr = currentUserId;
  let myTemplateButton;
  let shareTemplateButton;
  let defaultTemplateButton;
  let defaultUserTemplates = [];
  const templateDataCache = new Map();
  const previewCache = new Map();

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

  const openShareGalleryTab = document.createElement("div");
  openShareGalleryTab.classList.add("template-manager-top");
  content.appendChild(openShareGalleryTab);

  const openShareGalleryButton = document.createElement("button");
  openShareGalleryButton.classList.add("open-share-gallery-button", "btn_g");
  openShareGalleryButton.textContent = "템플릿 저장소 관리";
  openShareGalleryButton.addEventListener("click", openShareGallery);
  openShareGalleryTab.appendChild(openShareGalleryButton);

  const templateAdd = document.createElement("div");
  templateAdd.classList.add("template-add");
  const addButton = document.createElement("button");
  addButton.classList.add("template-add-button", "btn_b");
  addButton.textContent = "템플릿 저장";
  templateAdd.appendChild(addButton);
  openShareGalleryTab.appendChild(templateAdd);

  const baseTemplateLabel = document.createElement("p");
  baseTemplateLabel.textContent = "기본 템플릿";
  baseTemplateLabel.classList.add("title");
  baseTemplateLabel.style.marginTop = "0px";
  content.appendChild(baseTemplateLabel);

  const templatesList = document.createElement("div");
  templatesList.classList.add("list-templates");
  content.appendChild(templatesList);

  addButton.addEventListener("click", async function () {
    const templateName = prompt("저장할 템플릿 이름을 입력해주세요:");
    if (!templateName) {
      alert("템플릿 이름이 입력되지 않았습니다!");
      return;
    }

    const canvasJsonData = canvasToJsonData(_self.canvas);
    canvasJsonData.objects = canvasJsonData.objects.filter(
      (obj) => !obj.isControlPoint
    );
    const filteredData = {
      objects: canvasJsonData.objects.filter((obj) => {
        const isValid = obj && typeof obj.type === "string";
        if (!isValid) console.warn("잘못된 객체입니다:", obj);
        return isValid && (obj.type !== "image" || !obj.isBackground);
      }),
    };

    const canvasData = JSON.stringify(filteredData);

    const newTemplate = {
      tmpltNm: templateName,
      tmpltData: canvasData,
      registDate: new Date().getTime(),
      shareYn: "N",
      usrId: currentUsr,
    };

    try {
      await saveWgcTmplt(newTemplate);
      await updateTemplateGallery();
      const event = new CustomEvent("ImageEditor.newTemplate", {
        detail: newTemplate,
      });
      window.dispatchEvent(event);
      alert(`템플릿이 저장되었습니다.`);
    } catch (error) {
      console.error("템플릿 저장 실패:", error);
      alert("템플릿 저장에 실패했습니다.");
    }
  });

  templatesList.addEventListener("click", function (event) {
    const templateButton = event.target.closest(".template-button");
    if (templateButton) {
      const tmpltId = templateButton.dataset.tmpltId;
      const template = TemplatesList.find((t) => t.tmpltId === tmpltId);
      if (!template) {
        console.error("템플릿을 찾을 수 없습니다. tmpltId:", tmpltId);
        return;
      }
      try {
        applyTemplate(template, _self.canvas);
      } catch (error) {
        console.error("템플릿을 추가할 수 없습니다.", error);
        alert("템플릿 적용에 실패했습니다.");
      }
    }
  });

  async function fetchTemplateData(filePath) {
    if (templateDataCache.has(filePath)) {
      return templateDataCache.get(filePath);
    }
    try {
      const response = await getFileData({ filePath });
      if (response && response.wgcFileDataVo && response.wgcFileDataVo.data) {
        const tmpltData = response.wgcFileDataVo.data;
        templateDataCache.set(filePath, tmpltData);
        return tmpltData;
      } else {
        console.warn(`템플릿 데이터 조회 실패: filePath=${filePath}`);
        return null;
      }
    } catch (error) {
      console.error(`템플릿 데이터 로드 실패: filePath=${filePath}`, error);
      return null;
    }
  }

  async function updateTemplateGallery() {
    try {
      const resTemplates = await retWgcTmplt();
      if (
        !resTemplates ||
        !resTemplates.body ||
        !Array.isArray(resTemplates.body.templateList)
      ) {
        console.warn("retWgcTmplt 응답이 유효하지 않습니다:", resTemplates);
        TemplatesList = [];
      } else {
        const uniqueTemplates = new Map();
        resTemplates.body.templateList.forEach((tmplt) => {
          if (tmplt.tmpltId && tmplt.filePath) {
            uniqueTemplates.set(tmplt.tmpltId, {
              tmpltId: tmplt.tmpltId,
              tmpltNm: tmplt.tmpltNm,
              filePath: tmplt.filePath,
              registDate: tmplt.registDate,
              shareYn: tmplt.shareYn,
              usrId: tmplt.usrId,
              usrNm: tmplt.usrNm || "Unknown",
            });
          }
        });
        TemplatesList = Array.from(uniqueTemplates.values());
      }

      templatesList.innerHTML = "";
      defaultUserTemplates = [...TemplatesList]
        .filter((template) => template.usrId === "default")
        .sort((a, b) => b.registDate - a.registDate);

      await Promise.all(
        defaultUserTemplates.map(async (template) => {
          const button = document.createElement("div");
          button.classList.add("template-wrapper");
          button.dataset.tmpltId = template.tmpltId;

          const templateForm = document.createElement("div");
          const templateHeader = document.createElement("div");
          templateHeader.classList.add("template-header");

          const templateTitle = document.createElement("p");
          templateTitle.classList.add("template-title");
          templateTitle.textContent = template.tmpltNm;
          templateHeader.appendChild(templateTitle);
          templateForm.appendChild(templateHeader);

          const templateButton = document.createElement("div");
          templateButton.classList.add("template-button");
          templateButton.dataset.tmpltId = template.tmpltId;

          const tmpltData = await fetchTemplateData(template.filePath);
          const imgElement = document.createElement("img");
          imgElement.classList.add("gallery-template");
          if (tmpltData) {
            generatePreviewFromTemplateData(
              template.filePath,
              tmpltData,
              (dataUrl) => {
                resizeImg(dataUrl, 239, function (resizedImageUrl) {
                  imgElement.src = resizedImageUrl;
                });
              }
            );
          } else {
            imgElement.src = "";
            imgElement.alt = "템플릿 로드 실패";
          }

          templateButton.appendChild(imgElement);
          templateForm.appendChild(templateButton);
          button.appendChild(templateForm);
          templatesList.appendChild(button);
        })
      );
    } catch (error) {
      console.error("템플릿 갤러리 업데이트 실패:", error);
      templatesList.innerHTML = "";
      alert("템플릿 갤러리 업데이트에 실패했습니다.");
    }
  }

  async function openShareGallery() {
    // 기존 모달 제거 (중복 생성 방지)
    const existingModal = document.querySelector(".custom-modal-container");
    if (existingModal) existingModal.remove();

    const shareGalleryModal = document.createElement("div");
    shareGalleryModal.classList.add("custom-modal-container");
    shareGalleryModal.style.display = "none"; // 초기에는 숨김

    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("modal-overlay");
    modalOverlay.addEventListener("click", closeShareGallery);

    const modalContent = document.createElement("div");
    modalContent.classList.add("custom-modal-content");

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
      { name: "share-template", label: "공유 텐플릿" },
      { name: "default-template", label: "기본 템플릿" },
    ];
    const selectCategoryTab = document.createElement("div");
    selectCategoryTab.id = "select-category-tab";

    categories.forEach((category) => {
      const selectCategoryButton = document.createElement("button");
      selectCategoryButton.classList.add("toggle-switch-btn", "btn_w");
      selectCategoryButton.textContent = category.label;
      selectCategoryButton.id = category.name;
      selectCategoryButton.addEventListener("click", async (e) => {
        currentPage = 1;
        await getFilteredTemplatesByCategory(category.name, e.currentTarget);
      });
      selectCategoryTab.appendChild(selectCategoryButton);
    });

    filterBar.appendChild(selectCategoryTab);

    const paginationContainer = document.createElement("div");
    paginationContainer.id = "pagination";
    paginationContainer.classList.add("pagination-container");

    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "검색어를 입력해주세요.";
    searchBar.classList.add("search-bar");
    searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        currentPage = 1;
        filterTemplatesBySearch(e.target.value);
      }
    });
    filterBar.appendChild(searchBar);

    const shareGallery = document.createElement("div");
    shareGallery.classList.add("share-gallery");

    const modalFooter = document.createElement("div");
    modalFooter.classList.add("modal-footer");

    const closeButton = document.createElement("button");
    closeButton.textContent = "닫기";
    closeButton.classList.add("close-modal-button", "btn_g");
    closeButton.addEventListener("click", closeShareGallery);
    modalFooter.appendChild(closeButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(filterBar);
    modalContent.appendChild(shareGallery);
    modalContent.appendChild(paginationContainer);
    modalContent.appendChild(modalFooter);
    shareGalleryModal.appendChild(modalOverlay);
    shareGalleryModal.appendChild(modalContent);
    document.body.appendChild(shareGalleryModal);

    myTemplateButton = document.querySelector("#my-template");
    shareTemplateButton = document.querySelector("#share-template");
    defaultTemplateButton = document.querySelector("#default-template");

    setTimeout(() => {
      shareGalleryModal.style.display = "flex"; // 표시
      shareGalleryModal.classList.add("active");
    }, 10);

    if (myTemplateButton) {
      myTemplateButton.classList.add("active");
      await updateTemplateGallery();
      await getFilteredTemplatesByCategory("my-template", myTemplateButton);
    }
  }

  function closeShareGallery() {
    const modal = document.querySelector(".custom-modal-container");
    if (modal) {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.style.display = "none";
        modal.remove();
      }, 300); // 애니메이션 시간과 일치
    }
  }

  function renderTemplateGallery(templateList) {
    const shareGallery = document.querySelector(".share-gallery");
    if (!shareGallery) {
      console.warn("share-gallery 요소가 존재하지 않습니다.");
      return;
    }

    shareGallery.innerHTML = "";
    lastRenderedTemplates = [];

    const sortedTemplates = [...templateList].sort(
      (a, b) => b.registDate - a.registDate
    );

    const paginationEl = $("#pagination");
    if (!paginationEl.length) {
      console.warn("#pagination 요소가 존재하지 않습니다.");
      return;
    }

    paginationEl.pagination({
      dataSource: sortedTemplates,
      pageSize: itemsPerPage,
      pageRange: 1,
      showPrevious: true,
      showNext: true,
      prevText: "<",
      nextText: ">",
      showPageNumbers: true,
      callback: async function (paginatedTemplates, pagination) {
        shareGallery.innerHTML = "";
        lastRenderedTemplates = [];

        const templateDataPromises = paginatedTemplates.map(
          async (template) => ({
            template,
            tmpltData: await fetchTemplateData(template.filePath),
          })
        );
        const templateDataResults = await Promise.all(templateDataPromises);

        for (const { template, tmpltData } of templateDataResults) {
          const templateWrapper = document.createElement("div");
          templateWrapper.classList.add("share-template-wrapper");
          templateWrapper.dataset.tmpltId = template.tmpltId;
          templateWrapper.style.opacity = "0";

          if (template.usrId === currentUsr) {
            templateWrapper.classList.add("is-owner");
          }

          const templateContent = document.createElement("div");
          templateContent.classList.add("template-content");

          const templateElement = document.createElement("img");
          if (tmpltData) {
            generatePreviewFromTemplateData(
              template.filePath,
              tmpltData,
              (dataUrl) => {
                resizeImg(dataUrl, 184, function (resizedImageUrl) {
                  templateElement.src = resizedImageUrl;
                });
              }
            );
          } else {
            templateElement.src = "";
            templateElement.alt = "템플릿 로드 실패";
          }
          templateElement.classList.add("share-gallery-template");

          const templateName = document.createElement("p");
          templateName.textContent = template.tmpltNm;
          templateName.classList.add("template-title");

          const manageTemplate = document.createElement("div");
          manageTemplate.classList.add("manage-template");

          if (template.shareYn === "N" || template.usrId === currentUsr) {
            const applyButton = document.createElement("button");
            applyButton.textContent = "적용";
            applyButton.classList.add("apply-button", "btn_w");
            applyButton.addEventListener("click", () =>
              applyTemplate(template, _self.canvas)
            );

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
            deleteButton.classList.add("delete-button", "btn_r");
            deleteButton.addEventListener("click", () =>
              deleteTemplate(template)
            );

            const shareButton = document.createElement("button");
            shareButton.textContent =
              template.shareYn === "Y" ? "공유해제" : "공유";
            shareButton.classList.add("share-button", "btn_w");
            if (template.shareYn === "Y") {
              shareButton.classList.add("shared");
            }
            shareButton.addEventListener("click", () =>
              shareTemplate(template)
            );

            manageTemplate.appendChild(applyButton);
            manageTemplate.appendChild(deleteButton);
            manageTemplate.appendChild(shareButton);
          } else {
            const saveButton = document.createElement("button");
            saveButton.textContent = "담기";
            saveButton.classList.add("save-button", "btn_b");
            saveButton.addEventListener("click", () => saveTemplate(template));

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
            deleteButton.classList.add("delete-button", "btn_r");
            deleteButton.style.display = "none";

            const applyButton = document.createElement("button");
            applyButton.textContent = "적용";
            applyButton.classList.add("apply-button", "btn_w");
            applyButton.addEventListener("click", () =>
              applyTemplate(template, _self.canvas)
            );

            const shareButton = document.createElement("button");
            shareButton.textContent = "공유";
            shareButton.classList.add("share-button", "btn_w");
            shareButton.style.display = "none";

            manageTemplate.appendChild(applyButton);
            manageTemplate.appendChild(saveButton);
            manageTemplate.appendChild(deleteButton);
            manageTemplate.appendChild(shareButton);
          }

          templateContent.appendChild(templateElement);
          templateContent.appendChild(templateName);
          templateWrapper.appendChild(templateContent);
          templateWrapper.appendChild(manageTemplate);
          shareGallery.appendChild(templateWrapper);

          setTimeout(() => {
            templateWrapper.style.opacity = "1";
          }, 10);

          lastRenderedTemplates.push(template);
        }

        currentPage = pagination.pageNumber;
      },
    });
  }

  async function renderFilteredTemplates() {
    let categoryName;
    let categoryBtn;
    if (isMyData) {
      categoryName = "my-template";
      categoryBtn = myTemplateButton;
    } else {
      categoryName = "share-template";
      categoryBtn = shareTemplateButton;
    }
    getFilteredTemplatesByCategory(categoryName, categoryBtn);
  }

  async function getFilteredTemplatesByCategory(categoryName, target) {
    try {
      if (categoryName === "my-template") {
        isMyData = true;
      } else {
        isMyData = false;
      }

      let filteredTemplates = isMyData
        ? TemplatesList.filter((template) => template.usrId === currentUsr)
        : TemplatesList.filter(
            (template) =>
              template.shareYn === "Y" && template.usrId !== "default"
          );
      currentPage = 1;

      if (categoryName === "default-template") {
        filteredTemplates = defaultUserTemplates;
      }

      renderTemplateGallery(filteredTemplates);
      toggleRepoCategory(target);
    } catch (error) {
      console.error("템플릿 필터링 실패:", error);
      alert("템플릿 필터링에 실패했습니다.");
    }
  }

  function filterTemplatesBySearch(query) {
    let filteredTemplates;
    if (isMyData) {
      filteredTemplates = TemplatesList.filter(
        (template) =>
          template.tmpltNm.toLowerCase().includes(query.toLowerCase()) &&
          template.usrId === currentUsr
      );
    } else {
      filteredTemplates = TemplatesList.filter(
        (template) =>
          template.tmpltNm.toLowerCase().includes(query.toLowerCase()) &&
          template.shareYn === "Y"
      );
    }
    currentPage = 1;
    renderTemplateGallery(filteredTemplates);
  }

  async function saveTemplate(template) {
    if (confirm(`"${template.tmpltNm}"을(를) 저장하시겠습니까?`)) {
      try {
        const tmpltData = await fetchTemplateData(template.filePath);
        if (!tmpltData) {
          throw new Error("템플릿 데이터를 가져올 수 없습니다.");
        }
        const newTemplate = {
          usrId: currentUsr,
          tmpltNm: template.tmpltNm,
          tmpltData: tmpltData,
          registDate: new Date().getTime(),
          shareYn: "N",
        };
        await saveWgcTmplt(newTemplate);
        templateDataCache.delete(template.filePath);
        previewCache.delete(template.filePath);
        await updateTemplateGallery();
        await renderFilteredTemplates();
        alert(`"${template.tmpltNm}"을(를) 저장했습니다.`);
      } catch (error) {
        console.error("저장 실패:", error);
        alert("템플릿 저장에 실패했습니다.");
      }
    }
  }

  async function deleteTemplate(template) {
    if (template.usrId !== currentUsr) {
      alert("본인의 템플릿만 삭제할 수 있습니다.");
      return;
    }

    if (confirm(`정말로 "${template.tmpltNm}"을(를) 삭제하시겠습니까?`)) {
      try {
        await deleteWgcTmplt({ tmpltId: template.tmpltId });
        TemplatesList = TemplatesList.filter(
          (t) => t.tmpltId !== template.tmpltId
        );
        templateDataCache.delete(template.filePath);
        previewCache.delete(template.filePath);
        const totalItems = TemplatesList.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          currentPage = totalPages;
        } else if (totalPages === 0) {
          currentPage = 1;
        }
        await updateTemplateGallery();
        await renderFilteredTemplates();
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("템플릿 삭제에 실패했습니다.");
      }
    }
  }

  async function shareTemplate(template) {
    if (template.usrId !== currentUsr) {
      alert("본인의 템플릿만 공유할 수 있습니다.");
      return;
    }

    if (template.shareYn === "N") {
      if (confirm(`정말로 "${template.tmpltNm}"을(를) 공유하시겠습니까?`)) {
        try {
          const tmpltData = await fetchTemplateData(template.filePath);
          if (!tmpltData) {
            throw new Error("템플릿 데이터를 가져올 수 없습니다.");
          }
          await deleteWgcTmplt({ tmpltId: template.tmpltId });
          await saveWgcTmplt({ ...template, tmpltData, shareYn: "Y" });
          templateDataCache.delete(template.filePath);
          previewCache.delete(template.filePath);
          await updateTemplateGallery();
          await renderFilteredTemplates();
        } catch (error) {
          console.error("공유 실패:", error);
          alert("템플릿 공유에 실패했습니다.");
        }
      }
    } else if (template.shareYn === "Y") {
      if (
        confirm(`정말로 "${template.tmpltNm}"을(를) 공유 해제하시겠습니까?`)
      ) {
        try {
          const tmpltData = await fetchTemplateData(template.filePath);
          if (!tmpltData) {
            throw new Error("템플릿 데이터를 가져올 수 없습니다.");
          }
          await deleteWgcTmplt({ tmpltId: template.tmpltId });
          await saveWgcTmplt({ ...template, tmpltData, shareYn: "N" });
          templateDataCache.delete(template.filePath);
          previewCache.delete(template.filePath);
          await updateTemplateGallery();
          await renderFilteredTemplates();
        } catch (error) {
          console.error("공유 해제 실패:", error);
          alert("템플릿 공유해제를 실패했습니다.");
        }
      }
    }
  }

  async function applyTemplate(template, canvas) {
    const tmpltData = templateDataCache.get(template.filePath);
    if (!tmpltData) {
      console.error("유효하지 않은 템플릿 데이터입니다:", template);
      alert("템플릿 데이터를 로드할 수 없습니다.");
      return;
    }

    try {
      const jsonData =
        typeof tmpltData === "string" ? JSON.parse(tmpltData) : tmpltData;
      if (!jsonData || !jsonData.objects || !Array.isArray(jsonData.objects)) {
        throw new Error(
          "유효하지 않은 JSON 데이터: objects 속성이 없거나 배열이 아닙니다."
        );
      }
      const tempCanvas = new fabric.Canvas();
      await tempCanvas.loadFromJSON(jsonData);
      const newObjects = tempCanvas.getObjects();

      newObjects.forEach((obj, index) => {
        canvas.add(obj);
        try {
          if (obj.noFocusing) {
            obj.selectable = false;
            obj.evented = false;
          }
          restoreControlPoints(canvas, obj);
        } catch (err) {
          console.error(`객체 ${index} 처리 실패:`, err);
        }
      });

      if (newObjects.length > 0) {
        const group = new fabric.Group(newObjects, {
          name: `template_${template.tmpltNm}_${template.tmpltId}`,
        });

        newObjects.forEach((obj) => canvas.remove(obj));

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.fire("object:modified");
      } else {
        console.warn("그룹화할 객체가 없습니다.");
      }
      canvas.renderAll();
    } catch (error) {
      console.error("템플릿 적용 실패:", error);
      alert("템플릿 적용에 실패했습니다: " + error.message);
    }
  }

  async function generatePreviewFromTemplateData(
    filePath,
    tmpltData,
    callback
  ) {
    if (previewCache.has(filePath)) {
      callback(previewCache.get(filePath));
      return;
    }

    if (!tmpltData) {
      console.warn("tmpltData is empty or undefined");
      callback("");
      return;
    }

    let tempCanvas = null;
    let canvasElement = null;

    try {
      const canvasData =
        typeof tmpltData === "string" ? JSON.parse(tmpltData) : tmpltData;

      if (!canvasData || !canvasData.objects) {
        throw new Error("Invalid canvasData: Missing objects property");
      }

      canvasElement = document.createElement("canvas");
      canvasElement.id = `temp-canvas-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const container = document.createElement("div");
      container.style.display = "none";
      container.appendChild(canvasElement);
      document.body.appendChild(container);

      tempCanvas = new fabric.Canvas(canvasElement, {
        width: 1280,
        height: 720,
        enableRetinaScaling: false,
      });

      if (!tempCanvas.getContext()) {
        throw new Error("Failed to initialize canvas context");
      }

      if (typeof tempCanvas.loadFromJSON !== "function") {
        throw new Error(
          "loadFromJSON method is not available on fabric.Canvas"
        );
      }

      await tempCanvas.loadFromJSON(canvasData, (o, object) => {}, {
        signal: undefined,
      });

      tempCanvas.backgroundColor = "transparent";
      tempCanvas.renderAll();

      const dataUrl = tempCanvas.toDataURL({
        format: "png",
        multiplier: 0.2,
        quality: 1,
        enableRetinaScaling: false,
      });

      previewCache.set(filePath, dataUrl);
      callback(dataUrl);
    } catch (error) {
      console.error(`Failed to generate preview: filePath=${filePath}`, error);
      callback("");
    } finally {
      if (tempCanvas) {
        tempCanvas.dispose();
      }
      if (canvasElement && canvasElement.parentNode) {
        canvasElement.parentNode.parentNode?.removeChild(
          canvasElement.parentNode
        );
      }
    }
  }

  function toggleRepoCategory(target) {
    const selectMyTemplateButton = document.querySelector("#my-template");
    const selectShareTemplateButton = document.querySelector("#share-template");
    const selectDefaultTemplateButton =
      document.querySelector("#default-template");

    if (!selectMyTemplateButton || !selectShareTemplateButton) {
      console.warn("버튼 요소를 찾을 수 없습니다.");
      return;
    }

    const isMyTemplateButton =
      target.id === "my-template" || target.closest("#my-template");
    const isShareTemplateButton =
      target.id === "share-template" || target.closest("#share-template");
    const isDefaultTemplateButton =
      target.id === "default-template" || target.closest("#default-template");

    if (isMyTemplateButton) {
      selectMyTemplateButton.classList.add("active");
      selectShareTemplateButton.classList.remove("active");
      selectDefaultTemplateButton.classList.remove("active");
    } else if (isShareTemplateButton) {
      selectShareTemplateButton.classList.add("active");
      selectMyTemplateButton.classList.remove("active");
      selectDefaultTemplateButton.classList.remove("active");
    } else if (isDefaultTemplateButton) {
      selectDefaultTemplateButton.classList.add("active");
      selectMyTemplateButton.classList.remove("active");
      selectShareTemplateButton.classList.remove("active");
    }
  }

  updateTemplateGallery();
}

export { templates };
