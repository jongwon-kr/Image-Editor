import { processFiles } from "../utils/processFile.js";

/**
 * 이미지 패널
 */

("use strict");

// 로컬스토리지에서 기존 이미지 불러오기
const storedImages = JSON.parse(localStorage.getItem("ImageFileList")) || [];
const defaultImages = storedImages;

function images() {
  const _self = this;

  const ImageFileList = defaultImages;
  if (Array.isArray(this.images) && this.images.length) {
    ImageFileList.push(...this.images);
  }

  const toolPanel = document.createElement("div");
  toolPanel.classList.add("toolpanel");
  toolPanel.id = "images-panel";

  const content = document.createElement("div");
  content.classList.add("content");

  const title = document.createElement("p");
  title.classList.add("title");
  title.textContent = "이미지";

  content.appendChild(title);
  toolPanel.appendChild(content);
  document
    .querySelector(`${this.containerSelector} .main-panel`)
    .appendChild(toolPanel);

  const imageUpload = document.createElement("div");
  imageUpload.classList.add("drag-drop-input");
  const uploadInput = document.createElement("div");
  uploadInput.textContent =
    "드래그앤 드롭하거나 영역을 클릭하여 이미지를 추가할 수 있습니다.";
  imageUpload.appendChild(uploadInput);
  content.appendChild(imageUpload);

  // 드래그 영역 클릭 시 파일 업로드 버튼 클릭
  const dragDropInput = toolPanel.querySelector(".drag-drop-input");
  dragDropInput.addEventListener("click", function () {
    document
      .querySelector(`${_self.containerSelector} #btn-image-upload`)
      .click();
  });

  // 드래그 오버 시 클래스 추가
  dragDropInput.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.add("dragging");
  });

  // 드래그 리브 시 클래스 제거
  dragDropInput.addEventListener("dragleave", function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove("dragging");
  });

  // drop 이벤트
  dragDropInput.addEventListener("drop", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove("dragging");

    if (event.dataTransfer && event.dataTransfer.files.length) {
      let files = event.dataTransfer.files;

      try {
        const result = await processFiles(files);

        if (result.length > 0) {
          result.forEach((obj) => {
            ImageFileList.push(obj); // obj 전체를 추가
          });
          console.log(ImageFileList);
          // 로컬스토리지에 저장
          localStorage.setItem("ImageFileList", JSON.stringify(ImageFileList));
        }

        updateImageGallery(); // 갤러리 업데이트
      } catch (error) {
        console.error("파일 처리 중 오류 발생:", error);
      }
    }
  });

  const openShareGalleryTab = document.createElement("div");
  content.appendChild(openShareGalleryTab);

  const openShareGalleryButton = document.createElement("button");
  openShareGalleryButton.classList.add("open-share-gallery-button");
  openShareGalleryButton.textContent = "공유 저장소";
  openShareGalleryButton.addEventListener("click", function () {
    openShareGallery();
  });

  openShareGalleryTab.appendChild(openShareGalleryButton);

  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-gallery");
  content.appendChild(imageGallery);

  function updateImageGallery() {
    imageGallery.innerHTML = "";

    const sortedImages = [...ImageFileList].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    sortedImages.forEach((img, index) => {
      const button = document.createElement("div");
      button.classList.add("image-wrapper");
      button.dataset.index = index;

      const imgElement = document.createElement("img");
      imgElement.classList.add("gallery-image");
      imgElement.src = img.preview;

      button.appendChild(imgElement);
      button.addEventListener("click", async function () {
        if (!img.file || !img.file.data) {
          console.error("파일 데이터가 없습니다:", img);
          return;
        }

        let blob;
        if (
          img.file.type === "image/svg+xml" &&
          !img.file.data.startsWith("data:")
        ) {
          // SVG 텍스트를 Blob으로 변환
          blob = new Blob([img.file.data], { type: "image/svg+xml" });
        } else {
          // Data URL인 경우 fetch로 Blob 변환
          blob = await (await fetch(img.file.data)).blob();
        }

        const file = new File([blob], img.file.name, {
          type: img.file.type,
          lastModified: img.file.lastModified,
        });
        await processFiles([file]);
      });

      imageGallery.appendChild(button);
    });
  }

  updateImageGallery();

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
      selectCategoryButton.classList.add("select-category-button");
      selectCategoryButton.textContent = category.label;
      selectCategoryButton.id = category.name;

      selectCategoryButton.addEventListener("click", function () {
        const images = getFilteredImagesByCategory(category);
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
    const sortedImages = [...ImageFileList].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    sortedImages.forEach((img) => {
      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("share-image-wrapper");

      const imgElement = document.createElement("img");
      imgElement.src = img.preview;
      imgElement.classList.add("share-gallery-image");

      const imgTitle = document.createElement("p");
      imgTitle.textContent = img.title;
      imgTitle.classList.add("img-title");

      const manageImage = document.createElement("div");
      manageImage.classList.add("manage-image");

      const saveButton = document.createElement("button");
      saveButton.textContent = "저장";
      saveButton.classList.add("save-button");
      saveButton.addEventListener("click", () => saveImage(img));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.classList.add("delete-button");
      deleteButton.addEventListener("click", () => deleteImage(img));

      // 다운로드 버튼
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "다운로드";
      downloadButton.classList.add("download-button");
      downloadButton.addEventListener("click", () => downloadImage(img));

      // 공유 버튼
      const shareButton = document.createElement("button");
      shareButton.textContent = "공유";
      shareButton.classList.add("share-button");
      shareButton.addEventListener("click", () => shareImage(img));

      imageWrapper.appendChild(imgElement);
      imageWrapper.appendChild(imgTitle);
      imageWrapper.appendChild(manageImage);
      manageImage.appendChild(saveButton);
      manageImage.appendChild(deleteButton);
      manageImage.appendChild(downloadButton);
      manageImage.appendChild(shareButton);
      shareGallery.appendChild(imageWrapper);
    });
  }

  function getFilteredImagesByCategory(category) {
    if (category.name === "my-image") {
      // 내 이미지
      // 내 이미지들 필터링 로직 나중에 구현(이미지 객체에 사용자 정보 및 type(개인, 공유) 추가 필요)
      console.log("내 이미지 불러오기");
    } else if (category.name === "share-image") {
      // 공유 이미지
      // 공유 이미지들 필터링 로직 나중에 구현
      console.log("공유 이미지 불러오기");
    }
  }

  function closeShareGallery() {
    const modal = document.querySelector(".custom-modal-container");
    if (modal) {
      modal.remove();
    }
  }

  function saveImage(img) {
    console.log(img, "저장하기");
  }

  function deleteImage(img) {
    console.log(img, "삭제하기");
  }

  function downloadImage(img) {
    console.log(img, "다운로드");
    const link = document.createElement("a");
    link.href = img.preview;
    link.download = img.file.name || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function shareImage(img) {
    console.log(img, "공유하기");
  }

  this.containerEl.append(
    `<input id="btn-image-upload" type="file" accept="image/*" multiple hidden>`
  );

  // change 이벤트 수정
  document
    .querySelector(`${this.containerSelector} #btn-image-upload`)
    .addEventListener("change", async function (e) {
      if (e.target.files.length === 0) return;

      try {
        const result = await processFiles(e.target.files);

        if (result.length > 0) {
          result.forEach((obj) => {
            ImageFileList.push(obj); // obj 전체를 추가
          });
          console.log(ImageFileList);
          // 로컬스토리지에 저장
          localStorage.setItem("ImageFileList", JSON.stringify(ImageFileList));
        }

        updateImageGallery(); // 갤러리 업데이트
      } catch (error) {
        console.error("파일 업로드 중 오류 발생:", error);
      }
    });
}

export { images };
