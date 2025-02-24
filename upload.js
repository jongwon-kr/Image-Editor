import { processFiles } from "../utils/processFile.js";

/**
 * Define action to upload, drag & drop images into canvas
 */
function upload() {
  const _self = this;
  this.openDragDropPanel = function () {
    console.log("open drag drop panel");

    // 모달 추가
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="custom-modal-container">
          <div class="custom-modal-content">
            <div class="drag-drop-input">
              <div>Drag & drop files<br>or click to browse.<br>JPG, PNG or SVG only!</div>
            </div>
          </div>
        </div>
      `
    );

    const modal = document.querySelector(".custom-modal-container");
    // 모달 닫기 기능
    modal.addEventListener("click", function () {
      this.remove();
    });

    // 드래그 드롭 영역 클릭 시 파일 업로드 버튼 클릭
    const dragDropInput = modal.querySelector(".drag-drop-input");
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
      console.log("드래그오버");
      this.classList.add("dragging");
    });

    // 드래그 리브 시 클래스 제거
    dragDropInput.addEventListener("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.classList.remove("dragging");
    });

    // 드롭 이벤트 처리
    dragDropInput.addEventListener("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.classList.remove("dragging");

      if (event.dataTransfer && event.dataTransfer.files.length) {
        let files = event.dataTransfer.files;
        processFiles(files);
        document.querySelector(".custom-modal-container").remove();
      }
    });
  };

  this.containerEl.append(
    `<input id="btn-image-upload" type="file" accept="image/*" multiple hidden>`
  );
  document
    .querySelector(`${this.containerSelector} #btn-image-upload`)
    .addEventListener("change", function (e) {
      if (e.target.files.length === 0) return;
      processFiles(e.target.files);
    });
}

export { upload };
