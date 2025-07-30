// @ts-nocheck
import { getDeleteArea } from "../utils/utils.js";

function freeDrawSettings() {
  let width = 5;
  let style = "pencil";
  let color = "rgb(0, 0, 0)";
  let drawingMode = "add";
  let cursorCircle = null;

  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  if (!mainPanel) {
    return;
  }

  // 툴 패널 UI 추가 (한 번만 실행)
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="draw-panel"><div class="content"><p class="title">자유 그리기</p></div></div>`
  );
  document
    .querySelector(`${this.containerSelector} .toolpanel#draw-panel .content`)
    .insertAdjacentHTML(
      "beforeend",
      `
        <div>
          <div class="input-container">
            <label>지운 영역 복구</label>
            <button id="roll-back-delete" class="btn_b">복구하기</button>
          </div>
          <div class="input-container">
            <label for="erase">지우개</label>
            <label class="toggle-wrapper">
              <input type="checkbox" id="erase" name="erase">
              <span class="slider"></span>
            </label>
          </div>
          <div class="input-container">
            <label>두께</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="1" value="5" id="input-brush-width"/>
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>그리기 종류</label>
            <select id="input-brush-type">
              <option value="pencil" selected>연필</option>
              <option value="circle">원형</option>
              <option value="spray">스프레이</option>
            </select>
          </div>
          <div class="input-container">
            <label>그리기 색상</label>
            <input id="color-picker" value="rgb(0, 0, 0)"/>
          </div>
        </div>
      `
    );

  const rollBackDeleteBtn = document.querySelector("#roll-back-delete");
  rollBackDeleteBtn.addEventListener("click", () => {
    getDeleteArea().forEach((o) => {
      _self.canvas.remove(o);
    });
    _self.canvas.fire("object:modified");
  });

  // 브러시 업데이트 함수
  const updateBrush = () => {
    try {
      _self.canvas.isDrawingMode = true;
      switch (style) {
        case "circle":
          _self.canvas.freeDrawingBrush = new fabric.CircleBrush(_self.canvas);
          break;
        case "spray":
          _self.canvas.freeDrawingBrush = new fabric.SprayBrush(_self.canvas);
          break;
        default:
          _self.canvas.freeDrawingBrush = new fabric.PencilBrush(_self.canvas);
          break;
      }
      if (drawingMode === "delete") {
        _self.canvas.freeDrawingBrush = new fabric.PencilBrush(_self.canvas);
        _self.canvas.freeDrawingBrush.color = "white";
        _self.canvas.freeDrawingBrush.globalCompositeOperation =
          "destination-out";
      } else {
        _self.canvas.freeDrawingBrush.color = color;
        _self.canvas.freeDrawingBrush.globalCompositeOperation = "source-over";
      }
      _self.canvas.freeDrawingBrush.width = width;
    } catch (error) {
      console.error("Failed to update brush:", error);
    }
  };

  // 마우스 이벤트 핸들러 정의
  const handleMouseMove = (e) => {
    const pointer = _self.canvas.getPointer(e.e);
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
    }
    cursorCircle = new fabric.Circle({
      left: pointer.x - width / 2,
      top: pointer.y - width / 2,
      radius: width / 2,
      fill: "",
      stroke: drawingMode === "delete" ? "red" : "black",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      isControlPoint: true,
    });
    _self.canvas.add(cursorCircle);
    _self.canvas.renderAll();
  };

  const handleMouseOut = () => {
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
      cursorCircle = null;
      _self.canvas.renderAll();
    }
  };

  // draw 모드 활성화 함수
  _self.activateDrawMode = () => {
    // 기존 이벤트 리스너 제거
    if (_self.cleanupDrawMode) {
      _self.cleanupDrawMode();
    }

    // 이벤트 리스너 등록
    _self.canvas.on("mouse:move", handleMouseMove);
    _self.canvas.on("mouse:out", handleMouseOut);
    _self.canvas.on("path:created", (e) => {
      if (drawingMode === "delete") {
        e.path.noFocusing = true;
        e.path.evented = false;
        e.path.selectable = false;
        e.path.isDelete = true;
        e.path.label = "삭제영역";
      }
      _self.canvas.renderAll();
    });
    updateBrush();
  };

  // 정리 함수: 마우스 원형과 이벤트 리스너 제거
  _self.cleanupDrawMode = () => {
    if (cursorCircle) {
      _self.canvas.remove(cursorCircle);
      cursorCircle = null;
      _self.canvas.renderAll();
    }
    _self.canvas.off("mouse:move", handleMouseMove);
    _self.canvas.off("mouse:out", handleMouseOut);
    _self.canvas.off("path:created");
  };

  // 입력 이벤트 처리
  const inputBrushWidth = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-width`
  );
  inputBrushWidth.addEventListener("change", function () {
    try {
      width = parseInt(this.value, 10);
      updateBrush();
    } catch (error) {
      console.error("Failed to update brush width:", error);
    }
  });

  document
    .querySelector(
      `${this.containerSelector} .toolpanel#draw-panel .content .decrease`
    )
    .addEventListener("click", () => {
      width = Math.max(1, width - 1);
      inputBrushWidth.value = width;
      updateBrush();
    });
  document
    .querySelector(
      `${this.containerSelector} .toolpanel#draw-panel .content .increase`
    )
    .addEventListener("click", () => {
      width += 1;
      inputBrushWidth.value = width;
      updateBrush();
    });

  const inputBrushType = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #input-brush-type`
  );
  inputBrushType.addEventListener("change", function () {
    style = this.value;
    updateBrush();
  });

  const colorPicker = $(
    `${this.containerSelector} .toolpanel#draw-panel .content #color-picker`
  );
  colorPicker
    .spectrum({
      type: "color",
      showInput: "true",
      showInitial: "true",
      allowEmpty: "false",
    })
    .change(function () {
      try {
        color = $(this).val();
        if (drawingMode === "add") {
          updateBrush();
        }
      } catch (error) {
        console.error("Failed to update brush color:", error);
      }
    });

  const eraseCheckbox = document.querySelector(
    `${this.containerSelector} .toolpanel#draw-panel .content #erase`
  );
  eraseCheckbox.addEventListener("change", function () {
    drawingMode = this.checked ? "delete" : "add";
    updateBrush();
  });
}

export { freeDrawSettings };
