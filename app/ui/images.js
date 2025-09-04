"use strict";

import {
  retWgcImg,
  saveWgcImg,
  deleteWgcImg,
  getFileData,
} from "../api/wgcApiService.js";
import { processFiles } from "../utils/processFile.js";

function images() {
  const _self = this;
  let ImageFileList = [];
  let lastRenderedImages = [];
  let isMyData = true;
  let currentPage = 1;
  const itemsPerPage = 8;
  const currentUsr = currentUserId;
  let myImageButton;
  let shareImageButton;
  const imageDataCache = new Map();

  const toolPanel = document.createElement("div");
  toolPanel.classList.add("toolpanel");
  toolPanel.id = "images-panel";

  const content = document.createElement("div");
  content.classList.add("content");

  const title = document.createElement("p");
  title.classList.add("title");
  title.textContent = "이미지";
  content.appendChild(title);

  const openShareGalleryTab = document.createElement("div");
  openShareGalleryTab.classList.add("template-manager-top");
  content.appendChild(openShareGalleryTab);

  const openShareGalleryButton = document.createElement("button");
  openShareGalleryButton.classList.add("open-share-gallery-button", "btn_g");
  openShareGalleryButton.textContent = "이미지 저장소 관리";
  openShareGalleryButton.addEventListener("click", openShareGallery);
  openShareGalleryTab.appendChild(openShareGalleryButton);

  const imageUpload = document.createElement("div");
  imageUpload.classList.add("drag-drop-input");
  imageUpload.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    <span>이미지 업로드</span>
  `;
  content.appendChild(imageUpload);

  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-grid");
  content.appendChild(imageGallery);

  toolPanel.appendChild(content);
  document
    .querySelector(`${this.containerSelector} .main-panel`)
    .appendChild(toolPanel);

  const dragDropInput = toolPanel.querySelector(".drag-drop-input");
  dragDropInput.addEventListener("click", function () {
    document
      .querySelector(`${_self.containerSelector} #btn-image-upload`)
      .click();
  });

  dragDropInput.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.add("dragging");
  });

  dragDropInput.addEventListener("dragleave", function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove("dragging");
  });

  dragDropInput.addEventListener("drop", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove("dragging");

    if (event.dataTransfer && event.dataTransfer.files.length) {
      let files = event.dataTransfer.files;
      try {
        const result = await processFiles(files);
        if (result.length > 0) {
          result.forEach((img) => {
            saveDropImage({ ...img, usrId: currentUsr, shareYn: "N" });
          });
        }
        await updateImageGallery();
      } catch (error) {
        console.error("파일 처리 중 오류 발생:", error);
        alert("파일 처리에 실패했습니다.");
      }
    }
  });

  async function svgToPng(svgData) {
    try {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      canvas.width = img.width || 200;
      canvas.height = img.height || 200;
      ctx.drawImage(img, 0, 0);

      const pngData = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);
      return pngData;
    } catch (error) {
      console.error("SVG를 PNG로 변환 중 오류:", error);
      return svgData;
    }
  }

  async function fetchImageData(img) {
    if (imageDataCache.has(img.imgId)) {
      return imageDataCache.get(img.imgId);
    }
    try {
      const response = await getFileData({ filePath: img.filePath });
      if (response && response.wgcFileDataVo && response.wgcFileDataVo.data) {
        const imgData = response.wgcFileDataVo.data;
        imageDataCache.set(img.imgId, imgData);
        return imgData;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async function updateImageGallery() {
    try {
      const resImages = await retWgcImg();
      if (
        !resImages ||
        !resImages.body ||
        !Array.isArray(resImages.body.imageList)
      ) {
        console.warn("retWgcImg 응답이 유효하지 않습니다:", resImages);
        ImageFileList = [];
      } else {
        const uniqueImages = new Map();
        resImages.body.imageList.forEach((img) => {
          if (img.imgId && img.imgNm && img.filePath) {
            uniqueImages.set(img.imgId, {
              imgId: img.imgId,
              imgNm: img.imgNm,
              filePath: img.filePath,
              fileNm: img.fileNm,
              registDate: img.registDate,
              shareYn: img.shareYn,
              usrId: img.usrId,
              usrNm: img.usrNm || "Unknown",
              type: img.fileNm?.endsWith(".svg")
                ? "image/svg+xml"
                : "image/png",
            });
          } else {
            console.warn("유효하지 않은 이미지 데이터:", img);
          }
        });
        ImageFileList = Array.from(uniqueImages.values());
      }

      imageGallery.innerHTML = "";
      const myImages = ImageFileList.filter(
        (img) => img.usrId === currentUsr
      ).sort((a, b) => new Date(b.registDate) - new Date(a.registDate));

      if (myImages.length === 0) {
        imageGallery.innerHTML = `<p class="empty-gallery-message">업로드된 이미지가 없습니다.</p>`;
        return;
      }

      for (const [index, img] of myImages.entries()) {
        const button = document.createElement("div");
        button.classList.add("image-item");
        button.dataset.index = index;
        button.dataset.imgId = img.imgId;

        const imgElement = document.createElement("img");
        imgElement.classList.add("image-item-thumbnail");

        const imgData = await fetchImageData(img);
        if (imgData) {
          if (img.fileNm?.endsWith(".svg") && img.type === "image/svg+xml") {
            imgElement.src = await svgToPng(imgData);
          } else {
            imgElement.src = imgData;
          }
        } else {
          imgElement.src = "";
          imgElement.alt = "이미지 로드 실패";
        }

        button.appendChild(imgElement);
        button.addEventListener("click", async function () {
          const freshImgData = await fetchImageData(img);
          if (!freshImgData) {
            console.error("이미지 데이터가 없습니다:", img);
            alert("이미지를 캔버스에 추가하는데 실패했습니다.");
            return;
          }

          let blob =
            img.type === "image/svg+xml" && !freshImgData.startsWith("data:")
              ? new Blob([freshImgData], { type: "image/svg+xml" })
              : await (await fetch(freshImgData)).blob();

          const file = new File([blob], img.fileNm, {
            type: img.type,
            lastModified: new Date(img.registDate).getTime(),
          });
          _self.canvas.isDrawingMode = false;
          await processFiles([file], _self.canvas);
        });

        imageGallery.appendChild(button);
      }
    } catch (error) {
      console.error("갤러리 업데이트 실패:", error);
      imageGallery.innerHTML = `<p class="empty-gallery-message">이미지를 불러오는 데 실패했습니다.</p>`;
      alert("이미지 갤러리 업데이트에 실패했습니다.");
    }
  }

  async function openShareGallery() {
    await updateImageGallery();

    const shareGalleryModal = document.createElement("div");
    shareGalleryModal.classList.add("custom-modal-container");

    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("modal-overlay");
    modalOverlay.addEventListener("click", closeShareGallery);

    const modalContent = document.createElement("div");
    modalContent.classList.add("custom-modal-content");

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header");

    const modalLabel = document.createElement("h3");
    modalLabel.classList.add("modal-label");
    modalLabel.textContent = "이미지 저장소";
    modalHeader.appendChild(modalLabel);

    const filterBar = document.createElement("div");
    filterBar.id = "filter-bar";

    const categories = [
      { name: "my-image", label: "내 이미지" },
      { name: "share-image", label: "공유 이미지" },
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
        await getFilteredImagesByCategory(category.name, e.currentTarget);
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
        filterImagesBySearch(e.target.value);
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

    myImageButton = document.querySelector("#my-image");
    shareImageButton = document.querySelector("#share-image");
    if (myImageButton) {
      myImageButton.classList.add("active");
      await getFilteredImagesByCategory("my-image", myImageButton);
    }

    setTimeout(() => {
      shareGalleryModal.classList.add("active");
    }, 10);
  }

  async function renderShareGallery(imageList) {
    const shareGallery = document.querySelector(".share-gallery");
    if (!shareGallery) return;

    shareGallery.innerHTML = "";
    lastRenderedImages = [];

    const sortedImages = [...imageList].sort(
      (a, b) => new Date(b.registDate) - new Date(a.registDate)
    );

    $("#pagination").pagination({
      dataSource: sortedImages,
      pageSize: itemsPerPage,
      pageRange: 1,
      showPrevious: true,
      showNext: true,
      prevText: "<",
      nextText: ">",
      showPageNumbers: true,
      callback: async function (paginatedImages, pagination) {
        shareGallery.innerHTML = "";
        lastRenderedImages = [];

        const imgDataPromises = paginatedImages.map(async (img) => ({
          img,
          imgData: await fetchImageData(img),
        }));
        const imgDataResults = await Promise.all(imgDataPromises);

        for (const { img, imgData } of imgDataResults) {
          const imageWrapper = document.createElement("div");
          imageWrapper.classList.add("share-image-wrapper");
          imageWrapper.dataset.imgId = img.imgId;
          imageWrapper.style.opacity = "0";

          if (img.usrId === currentUsr) {
            imageWrapper.classList.add("is-owner");
          }

          const imageContent = document.createElement("div");
          imageContent.classList.add("image-content");

          const imgElement = document.createElement("img");
          if (imgData) {
            imgElement.src =
              img.fileNm?.endsWith(".svg") && img.type === "image/svg+xml"
                ? await svgToPng(imgData)
                : imgData;
          } else {
            imgElement.src = "";
            imgElement.alt = "이미지 로드 실패";
          }
          imgElement.classList.add("share-gallery-image");

          const imgTitle = document.createElement("p");
          imgTitle.textContent = img.imgNm;
          imgTitle.classList.add("img-title");

          const manageImage = document.createElement("div");
          manageImage.classList.add("manage-image");

          if (img.shareYn === "N" || img.usrId === currentUsr) {
            const downloadButton = document.createElement("button");
            downloadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#333" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;
            downloadButton.classList.add("download-button", "btn_w");
            downloadButton.addEventListener("click", () => downloadImage(img));

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
            deleteButton.classList.add("delete-button", "btn_r");
            deleteButton.addEventListener("click", () => deleteImage(img));

            const shareButton = document.createElement("button");
            shareButton.textContent = img.shareYn === "Y" ? "공유해제" : "공유";
            shareButton.classList.add("share-button", "btn_w");
            if (img.shareYn === "Y") {
              shareButton.classList.add("shared");
            }
            shareButton.addEventListener("click", () => shareImage(img));

            manageImage.appendChild(downloadButton);
            manageImage.appendChild(deleteButton);
            manageImage.appendChild(shareButton);
          } else {
            const saveButton = document.createElement("button");
            saveButton.textContent = "담기";
            saveButton.classList.add("save-button", "btn_b");
            saveButton.addEventListener("click", () => saveImage(img));

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
            deleteButton.classList.add("delete-button", "btn_r");
            deleteButton.style.display = "none";

            const downloadButton = document.createElement("button");
            downloadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#333" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;
            downloadButton.classList.add("download-button", "btn_w");
            downloadButton.addEventListener("click", () => downloadImage(img));

            const shareButton = document.createElement("button");
            shareButton.textContent = "공유";
            shareButton.classList.add("share-button", "btn_w");
            shareButton.style.display = "none";

            manageImage.appendChild(deleteButton);
            manageImage.appendChild(downloadButton);
            manageImage.appendChild(saveButton);
            manageImage.appendChild(shareButton);
          }

          imageContent.appendChild(imgElement);
          imageContent.appendChild(imgTitle);
          imageWrapper.appendChild(imageContent);
          imageWrapper.appendChild(manageImage);
          shareGallery.appendChild(imageWrapper);

          setTimeout(() => {
            imageWrapper.style.opacity = "1";
          }, 10);

          lastRenderedImages.push(img);
        }

        currentPage = pagination.pageNumber;
      },
    });
  }

  async function renderFilteredImages() {
    let categoryName;
    let categoryBtn;
    if (isMyData) {
      categoryName = "my-image";
      categoryBtn = myImageButton;
    } else {
      categoryName = "share-image";
      categoryBtn = shareImageButton;
    }

    await getFilteredImagesByCategory(categoryName, categoryBtn);
  }

  async function getFilteredImagesByCategory(categoryName, target) {
    try {
      if (categoryName === "my-image") {
        isMyData = true;
      } else {
        isMyData = false;
      }

      const filteredImages = isMyData
        ? ImageFileList.filter((img) => img.usrId === currentUsr)
        : ImageFileList.filter((img) => img.shareYn === "Y");
      currentPage = 1;
      renderShareGallery(filteredImages);
      toggleRepoCategory(target);
    } catch (error) {
      console.error("이미지 필터링 실패:", error);
      alert("이미지 필터링에 실패했습니다.");
    }
  }

  function filterImagesBySearch(query) {
    let filteredImages;

    if (isMyData) {
      filteredImages = ImageFileList.filter(
        (img) =>
          img.imgNm.toLowerCase().includes(query.toLowerCase()) &&
          img.usrId === currentUsr
      );
    } else {
      filteredImages = ImageFileList.filter(
        (img) =>
          img.imgNm.toLowerCase().includes(query.toLowerCase()) &&
          img.shareYn === "Y"
      );
    }

    currentPage = 1;
    renderShareGallery(filteredImages);
  }

  function closeShareGallery() {
    const modal = document.querySelector(".custom-modal-container");
    if (modal) modal.remove();
  }

  async function saveImage(img) {
    if (confirm(`"${img.imgNm}"을(를) 저장하시겠습니까?`)) {
      try {
        const imgData = await fetchImageData(img);
        if (!imgData) {
          throw new Error("이미지 데이터를 가져올 수 없습니다.");
        }
        const newImage = {
          usrId: currentUsr,
          imgNm: img.imgNm,
          imgData: imgData,
          fileNm: img.fileNm,
          registDate: new Date().getTime(),
          shareYn: "N",
        };
        await saveWgcImg(newImage);
        await updateImageGallery();
        await renderFilteredImages();
        alert(`"${img.imgNm}"을(를) 저장했습니다.`);
      } catch (error) {
        console.error("저장 실패:", error);
        alert("이미지 저장에 실패했습니다.");
      }
    }
  }

  async function saveDropImage(img) {
    try {
      const newImage = {
        usrId: currentUsr,
        imgNm: img.imgNm,
        imgData: img.imgData,
        fileNm: img.fileNm,
        registDate: new Date().getTime(),
        shareYn: "N",
      };
      await saveWgcImg(newImage);
      imageDataCache.set(newImage.imgId, newImage.imgData);
      await updateImageGallery();
      await renderFilteredImages();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("이미지 저장에 실패했습니다.");
    }
  }

  async function deleteImage(img) {
    if (img.usrId !== currentUsr) {
      alert("본인의 이미지만 삭제할 수 있습니다.");
      return;
    }

    if (confirm(`정말로 "${img.imgNm}"을(를) 삭제하시겠습니까?`)) {
      try {
        await deleteWgcImg({ imgId: img.imgId });
        ImageFileList = ImageFileList.filter((i) => i.imgId !== img.imgId);
        imageDataCache.delete(img.imgId);
        const totalItems = ImageFileList.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          currentPage = totalPages;
        } else if (totalPages === 0) {
          currentPage = 1;
        }
        await updateImageGallery();
        await renderFilteredImages();
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("이미지 삭제에 실패했습니다.");
      }
    }
  }

  async function downloadImage(img) {
    const imgData = await fetchImageData(img);
    if (!imgData) {
      alert("이미지 데이터를 가져올 수 없습니다.");
      return;
    }
    const link = document.createElement("a");
    link.href = imgData;
    link.download = img.fileNm || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function shareImage(img) {
    if (img.usrId !== currentUsr) {
      alert("본인의 이미지만 공유할 수 있습니다.");
      return;
    }

    if (img.shareYn === "N") {
      if (confirm(`정말로 "${img.imgNm}"을(를) 공유하시겠습니까?`)) {
        try {
          const imgData = await fetchImageData(img);
          if (!imgData) {
            throw new Error("이미지 데이터를 가져올 수 없습니다.");
          }
          await deleteWgcImg({ imgId: img.imgId });
          await saveWgcImg({ ...img, imgData, shareYn: "Y" });
          imageDataCache.set(img.imgId, imgData);
          await updateImageGallery();
          await renderFilteredImages();
        } catch (error) {
          console.error("공유 실패:", error);
          alert("이미지 공유에 실패했습니다.");
        }
      }
    } else if (img.shareYn === "Y") {
      if (confirm(`정말로 "${img.imgNm}"을(를) 공유 해제하시겠습니까?`)) {
        try {
          const imgData = await fetchImageData(img);
          if (!imgData) {
            throw new Error("이미지 데이터를 가져올 수 없습니다.");
          }
          await deleteWgcImg({ imgId: img.imgId });
          await saveWgcImg({ ...img, imgData, shareYn: "N" });
          imageDataCache.set(img.imgId, imgData);
          await updateImageGallery();
          await renderFilteredImages();
        } catch (error) {
          console.error("공유 해제 실패:", error);
          alert("이미지 공유해제를 실패했습니다.");
        }
      }
    }
  }

  function toggleRepoCategory(target) {
    const selectMyImgButton = document.querySelector("#my-image");
    const selectShareImgButton = document.querySelector("#share-image");

    if (!selectMyImgButton || !selectShareImgButton) {
      console.warn("버튼 요소를 찾을 수 없습니다.");
      return;
    }

    const isMyImageButton =
      target.id === "my-image" || target.closest("#my-image");
    const isShareImageButton =
      target.id === "share-image" || target.closest("#share-image");

    if (isMyImageButton) {
      selectMyImgButton.classList.add("active");
      selectShareImgButton.classList.remove("active");
    } else if (isShareImageButton) {
      selectShareImgButton.classList.add("active");
      selectMyImgButton.classList.remove("active");
    }
  }

  this.containerEl.append(
    `<input id="btn-image-upload" type="file" accept="image/*" multiple hidden>`
  );

  document
    .querySelector(`${this.containerSelector} #btn-image-upload`)
    .addEventListener("change", async function (e) {
      if (e.target.files.length === 0) return;
      try {
        const result = await processFiles(e.target.files);
        if (result.length > 0) {
          result.forEach((img) => {
            saveDropImage({ ...img, usrId: currentUsr, shareYn: "N" });
          });
        }
        await updateImageGallery();
      } catch (error) {
        console.error("파일 업로드 중 오류 발생:", error);
        alert("파일 업로드에 실패했습니다.");
      }
    });

  updateImageGallery();
}

export { images };
