import { processFiles } from "../utils/processFile.js";

/**
 * Define action to add templates to canvas
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
  
  content.appendChild(imageUpload);

  // 드래그 영역 클릭 시 파일 업로드 버튼 클릭
  const dragDropInput = toolPanel.querySelector(".drag-drop-input");
  dragDropInput.addEventListener("click", function () {
    console.log("click drag drop");
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

  // 드롭 이벤트 처리
  dragDropInput.addEventListener("drop", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove("dragging");

    if (event.dataTransfer && event.dataTransfer.files.length) {
      let files = event.dataTransfer.files;

      try {
        const result = await processFiles(files);
        console.log("result", result);

        if (result.length > 0) {
          result.forEach((obj) => {
            ImageFileList.push(obj);
          });

          // 로컬스토리지에 저장
          localStorage.setItem("ImageFileList", JSON.stringify(ImageFileList));
        }

        console.log("upload files result", ImageFileList);
        updateImageGallery(); // 갤러리 업데이트
      } catch (error) {
        console.error("파일 처리 중 오류 발생:", error);
      }
    }
  });

  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-gallery");
  content.appendChild(imageGallery);

  const paginationContainer = document.createElement("div");
  paginationContainer.classList.add("pagination-container");

  const prevButton = document.createElement("button");
  prevButton.textContent = "이전";
  prevButton.classList.add("prev-button");
  prevButton.disabled = true;
  paginationContainer.appendChild(prevButton);

  const pageIndicator = document.createElement("span");
  pageIndicator.classList.add("page-indicator");
  paginationContainer.appendChild(pageIndicator);

  const nextButton = document.createElement("button");
  nextButton.textContent = "다음";
  nextButton.classList.add("next-button");
  paginationContainer.appendChild(nextButton);

  content.appendChild(paginationContainer);

  const itemsPerPage = 12;
  let currentPage = 1;

  function updateImageGallery() {
    imageGallery.innerHTML = "";

    const sortedImages = [...ImageFileList].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const totalPages = Math.ceil(sortedImages.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedImages = sortedImages.slice(start, start + itemsPerPage);

    paginatedImages.forEach((img, index) => {
      const button = document.createElement("div");
      button.classList.add("image-wrapper");
      button.dataset.index = index;

      const imgElement = document.createElement("img");
      imgElement.classList.add("gallery-image");
      imgElement.src = img.preview;

      button.appendChild(imgElement);
      button.addEventListener("click", async function () {
        if (!img.file) {
          console.error("파일 정보가 없습니다.", img);
          return;
        }
        console.log("img:", img);
        await processFiles([img.file]);
      });

      imageGallery.appendChild(button);
    });

    pageIndicator.textContent = `${currentPage} / ${totalPages || 1}`;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= totalPages;
  }

  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateImageGallery();
    }
  });

  nextButton.addEventListener("click", () => {
    const totalPages = Math.ceil(ImageFileList.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      updateImageGallery();
    }
  });

  updateImageGallery();
}

export { images };
