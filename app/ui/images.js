import { processFiles } from "../utils/processFile.js";

/**
 * Define action to add templates to canvas
 */

("use strict");

// 초기 이미지
const defaultImages = [];

function images() {
  const _self = this;

  const ImageList = defaultImages;
  if (Array.isArray(this.images) && this.images.length) {
    ImageList.push(...this.images);
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

  // 드래그 드롭 영역 클릭 시 파일 업로드 버튼 클릭
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
            ImageList.push(obj);
          });
        }

        console.log("ImageList", ImageList);
        console.log("files", files);
      } catch (error) {
        console.error("파일 처리 중 오류 발생:", error);
      }
    }
  });

  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-gallery");
  content.appendChild(imageGallery);

  // 갤러리에 이미지 저장
  ImageList.forEach((img, index) => {
    const button = document.createElement("div");
    button.classList.add("button");
    button.dataset.index = index;

    const imgElement = document.createElement("div");
    imgElement.src = img.preview;

    button.appendChild(imgElement);
    imageGallery.appendChild(button);
  });
}

export { images };
