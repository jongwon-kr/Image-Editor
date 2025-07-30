// @ts-nocheck
import { updatePathFromControlPoints as updateArrowPathFromControlPoints } from "../drawing-tools/drawingArrow.js";

import {
  alignObject,
  getActiveFontStyle,
  getFilteredFocusObjects,
  restoreControlPoints,
  setActiveFontStyle,
  toggleGroup,
} from "../utils/utils.js";
import { processObjects } from "./canvas.js";

/**
 * 선택 영역 설정 패널
 */

("use strict");

const frontStyleList = [
  {
    value: "warm",
    label: "온난전선",
  },
  {
    value: "cold",
    label: "한랭전선",
  },
  {
    value: "stationary",
    label: "정체전선",
  },
  {
    value: "occluded",
    label: "폐색전선",
  },
];

const BorderStyleList = [
  {
    value: {
      strokeDashArray: [],
      strokeLineCap: "butt",
    },
    label: "────────",
  },
  {
    value: {
      strokeDashArray: [10, 10],
      strokeLineCap: "square",
    },
    label: "━ ━ ━ ━ ━ ━ ━",
  },
  {
    value: {
      strokeDashArray: [1, 10],
      strokeLineCap: "round",
    },
    label: "• • • • • • • • • • • •",
  },
  {
    value: {
      strokeDashArray: [15, 10, 5, 10],
      strokeLineCap: "square",
    },
    label: "━ ━━ ━ ━━ ━",
  },
];

const AlignmentButtonList = [
  {
    pos: "left",
    title: "좌측 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect x="14.815" y="48.16" width="85.185" height="24.691"></rect><rect x="14.815" y="87.025" width="45.679" height="24.691"></rect><rect y="34.877" width="8.642" height="90.123"></rect></g></svg>`,
  },
  {
    pos: "center-h",
    title: "수평 중앙 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect x="7.4075" y="30.722" width="85.185" height="24.691"></rect><rect x="27.16" y="69.587" width="45.679" height="24.691"></rect><rect x="45.679" y="17.439" width="8.642" height="90.123"></rect></g></svg>`,
  },
  {
    pos: "right",
    title: "우측 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></svg>`,
  },
  {
    pos: "top",
    title: "상단 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="matrix(0 -1 -1 0 129.94 129.94)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`,
  },
  {
    pos: "center-v",
    title: "수직 중앙 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect transform="rotate(90)" x="19.908" y="-81.779" width="85.185" height="24.691"></rect><rect transform="rotate(90)" x="39.66" y="-42.913" width="45.679" height="24.691"></rect><rect transform="rotate(90)" x="58.179" y="-95.062" width="8.642" height="90.123"></rect></g></svg>`,
  },
  {
    pos: "bottom",
    title: "하단 정렬",
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="rotate(90 50 79.938)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`,
  },
];

function selectionSettings() {
  const _self = this;

  // DOM 확인
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  if (!mainPanel) {
    console.error(
      `Main panel not found for selector: ${this.containerSelector} .main-panel`
    );
    return;
  }
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="select-panel"><div class="content"><p class="title">선택 영역 설정</p></div></div>`
  );

  if (!this.canvas) {
    console.error("Canvas is not initialized");
    return;
  }

  // font section
  (() => {
    const selectorPanelContent = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .content`
    );
    selectorPanelContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="text-section">
        <h4>폰트 스타일</h4>
        <div class="style">
          <button data-title="굵게" id="bold"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M218.133,144.853c20.587-14.4,35.2-37.653,35.2-59.52C253.333,37.227,216.107,0,168,0H34.667v298.667h150.187 c44.693,0,79.147-36.267,79.147-80.853C264,185.387,245.547,157.76,218.133,144.853z M98.667,53.333h64c17.707,0,32,14.293,32,32 s-14.293,32-32,32h-64V53.333z M173.333,245.333H98.667v-64h74.667c17.707,0,32,14.293,32,32S191.04,245.333,173.333,245.333z"></path></svg></button>
          <button data-title="기울임꼴" id="italic"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="106.667,0 106.667,64 153.92,64 80.747,234.667 21.333,234.667 21.333,298.667 192,298.667 192,234.667 144.747,234.667 217.92,64 277.333,64 277.333,0  "></polygon></svg></button>
          <button data-title="밑줄" id="underline"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M192,298.667c70.72,0,128-57.28,128-128V0h-53.333v170.667c0,41.28-33.387,74.667-74.667,74.667 s-74.667-33.387-74.667-74.667V0H64v170.667C64,241.387,121.28,298.667,192,298.667z"></path><rect x="42.667" y="341.333" width="298.667" height="42.667"></rect></svg></button>
          <button data-title="취소선" id="linethrough"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="149.333,160 234.667,160 234.667,96 341.333,96 341.333,32 42.667,32 42.667,96 149.333,96"></polygon><rect x="149.333" y="288" width="85.333" height="64"></rect><rect x="0" y="202.667" width="384" height="42.667"></rect></svg></button>
          <button data-title="아래 첨자" id="subscript"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M248.257,256l103.986-103.758c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455l-49.057-48.948 c-5.765-5.753-15.098-5.753-20.863,0L178.29,186.188L74.258,82.384c-5.764-5.751-15.098-5.752-20.863,0L4.337,131.333 C1.561,134.103,0,137.865,0,141.788c0,3.923,1.561,7.684,4.337,10.455L108.324,256L4.337,359.758 C1.561,362.528,0,366.29,0,370.212c0,3.923,1.561,7.684,4.337,10.455l49.057,48.948c5.765,5.753,15.098,5.753,20.863,0 l104.033-103.804l104.032,103.804c2.883,2.876,6.657,4.315,10.432,4.315s7.549-1.438,10.432-4.315l49.056-48.948 c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455L248.257,256z"></path><path d="M497.231,384.331h-44.973l35.508-31.887c14.878-13.36,20.056-34.18,13.192-53.04 c-6.874-18.89-23.565-31.044-43.561-31.717c-0.639-0.021-1.283-0.032-1.928-0.032c-31.171,0-56.531,25.318-56.531,56.439 c0,8.157,6.613,14.769,14.769,14.769c8.156,0,14.769-6.613,14.769-14.769c0-14.833,12.109-26.901,26.992-26.901 c0.316,0,0.631,0.005,0.937,0.016c11.573,0.39,15.78,9.511,16.795,12.297c2.163,5.946,1.942,14.574-5.171,20.962l-64.19,57.643 c-4.552,4.088-6.112,10.56-3.923,16.273c2.189,5.714,7.673,9.486,13.792,9.486h83.523c8.157,0,14.769-6.613,14.769-14.769 S505.387,384.331,497.231,384.331z"></path></svg></button>
          <button data-title="위 첨자" id="superscript"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M248.257,259.854l103.986-103.758c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455l-49.057-48.948 c-5.765-5.753-15.098-5.753-20.863,0L178.29,190.042L74.258,86.238c-5.764-5.751-15.099-5.752-20.863,0L4.337,135.187 C1.561,137.958,0,141.719,0,145.642s1.561,7.684,4.337,10.455l103.986,103.758L4.337,363.612C1.561,366.383,0,370.145,0,374.067 c0,3.922,1.561,7.684,4.337,10.455l49.057,48.948c5.765,5.753,15.098,5.753,20.863,0l104.033-103.804l104.032,103.804 c2.883,2.876,6.657,4.315,10.432,4.315s7.549-1.438,10.432-4.315l49.056-48.948c2.777-2.771,4.337-6.532,4.337-10.455 s-1.561-7.684-4.337-10.455L248.257,259.854z"></path><path d="M497.231,190.893h-44.973l35.508-31.887c14.878-13.36,20.056-34.18,13.192-53.04 c-6.874-18.89-23.565-31.044-43.561-31.717c-0.639-0.021-1.283-0.032-1.928-0.032c-31.171,0-56.531,25.318-56.531,56.439 c0,8.157,6.613,14.769,14.769,14.769c8.156,0,14.769-6.613,14.769-14.769c0-14.833,12.109-26.901,26.992-26.901 c0.316,0,0.631,0.005,0.937,0.016c11.573,0.39,15.78,9.511,16.795,12.297c2.163,5.946,1.942,14.574-5.171,20.962l-64.19,57.643 c-4.552,4.088-6.112,10.56-3.923,16.273c2.189,5.714,7.673,9.486,13.792,9.486h83.523c8.157,0,14.769-6.613,14.769-14.769 S505.387,190.893,497.231,190.893z"></path></svg></button>
        </div>
        <div class="family">
          <div class="input-container">
            <label>글꼴</label>
            <select id="font-family">
              <option value="바탕체">바탕체</option>
              <option value="궁서체">궁서체</option>
              <option value="돋움체">돋움체</option>
              <option value="맑은 고딕">맑은 고딕</option>
              <option value="HY견고딕">HY견고딕</option>
            </select>
          </div>
        </div>
        <div class="sizes">
          <div class="input-container">
            <label>글꼴 크기</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="1" max="256" value="20" step="0" id="fontSize">
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>줄 간격</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="0.1" max="3" value="1" step="0.0" id="lineHeight">
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>글자 간격</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="0" max="2000" value="0" step="0" id="charSpacing">
              <button class="increase">+</button>
            </div>
          </div>
        </div>
        <div class="align">
          <div class="input-container">
            <label>텍스트 정렬</label>
            <select id="text-align">
              <option value="left">왼쪽 정렬</option>
              <option value="center">가운데 정렬</option>
              <option value="right">오른쪽 정렬</option>
              <option value="justify">일정 간격</option>
            </select>
          </div>
        </div>
        <div class="color">
          <div class="input-container">
            <label>텍스트 색상</label>
            <input id="color-picker" value="black">
          </div>
        </div>
        <div class="horizontal-line"></div>
        <div class="border-settings">
          <h4>텍스트 테두리 설정</h4>
          <div class="input-container"><label>두께</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="1" value="1" step="0" id="input-border-width">
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container"><label>스타일</label>
            <select id="input-border-style">${BorderStyleList.map(
              (item) =>
                `<option value='${JSON.stringify(item.value)}'>${
                  item.label
                }</option>`
            )}</select>
          </div>
          <div class="input-container"><label>모서리 타입</label>
            <select id="input-corner-type">
              <option value="miter" selected>사각형</option>
              <option value="round">둥근 모서리</option>
            </select>
          </div>
          <div class="input-container"><label>색상</label>
            <input id="border-color-picker" value="black">
          </div>
        </div>
        <div class="horizontal-line"></div>
      </div>
    `
    );

    const styleButtons = document.querySelectorAll(
      `${_self.containerSelector} .toolpanel#select-panel .style button`
    );
    styleButtons.forEach((button) => {
      button.addEventListener("click", function () {
        if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
          return;
        let type = this.id;
        switch (type) {
          case "bold":
            setActiveFontStyle(
              _self.activeSelection,
              "fontWeight",
              getActiveFontStyle(_self.activeSelection, "fontWeight") === "bold"
                ? ""
                : "bold"
            );
            break;
          case "italic":
            setActiveFontStyle(
              _self.activeSelection,
              "fontStyle",
              getActiveFontStyle(_self.activeSelection, "fontStyle") ===
                "italic"
                ? ""
                : "italic"
            );
            break;
          case "underline":
            setActiveFontStyle(
              _self.activeSelection,
              "underline",
              !getActiveFontStyle(_self.activeSelection, "underline")
            );
            break;
          case "linethrough":
            setActiveFontStyle(
              _self.activeSelection,
              "linethrough",
              !getActiveFontStyle(_self.activeSelection, "linethrough")
            );
            break;
          case "subscript":
            if (getActiveFontStyle(_self.activeSelection, "deltaY") > 0) {
              setActiveFontStyle(_self.activeSelection, "fontSize", undefined);
              setActiveFontStyle(_self.activeSelection, "deltaY", undefined);
            } else {
              _self.activeSelection.setSubscript();
            }
            break;
          case "superscript":
            if (getActiveFontStyle(_self.activeSelection, "deltaY") < 0) {
              setActiveFontStyle(_self.activeSelection, "fontSize", undefined);
              setActiveFontStyle(_self.activeSelection, "deltaY", undefined);
            } else {
              _self.activeSelection.setSuperscript();
            }
            break;
        }
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      });
      button.addEventListener("mouseenter", function () {
        showTooltip(this);
      });
      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
    });

    const fontFamilySelect = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .family #font-family`
    );
    fontFamilySelect.addEventListener("input", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let family = this.value;
      setActiveFontStyle(_self.activeSelection, "fontFamily", family);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    let fontSizeInput = document.querySelectorAll(
      `${_self.containerSelector} .toolpanel#select-panel .sizes input`
    );
    fontSizeInput.forEach((input) => {
      let step;
      if (input.id === "fontSize") {
        step = 1;
      } else if (input.id === "lineHeight") {
        step = 0.1;
      } else if (input.id === "charSpacing") {
        step = 100;
      }

      // 엔터 키 입력 처리
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (
            !_self.activeSelection ||
            _self.activeSelection.type !== "textbox"
          )
            return;
          let value = parseFloat(this.value);
          if (value <= step) {
            value = step;
          }
          let type = this.id;
          setActiveFontStyle(_self.activeSelection, type, value);
          _self.canvas.fire("object:modified");
          _self.canvas.renderAll();
          syncPanelWithSelection(_self);
        }
      });

      const decreaseButton = input.previousElementSibling;
      const increaseButton = input.nextElementSibling;

      decreaseButton.addEventListener("click", function () {
        if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
          return;
        let value = parseFloat(input.value) - (parseFloat(step) || 1);
        if (value < parseFloat(input.min)) value = parseFloat(input.min);
        input.value = value;
        setActiveFontStyle(_self.activeSelection, input.id, value);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      });

      increaseButton.addEventListener("click", function () {
        if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
          return;
        let value = parseFloat(input.value) + (parseFloat(step) || 1);
        if (input.max && value > parseFloat(input.max))
          value = parseFloat(input.max);
        input.value = value;
        setActiveFontStyle(_self.activeSelection, input.id, value);
        _self.canvas.renderAll();
        _self.canvas.fire("object:modified");
        syncPanelWithSelection(_self);
      });
    });

    const textAlignSelect = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .align #text-align`
    );
    textAlignSelect.addEventListener("input", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let mode = this.value;
      setActiveFontStyle(_self.activeSelection, "textAlign", mode);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    const colorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .color #color-picker`
    );
    colorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
          return;
        let hex = color.toRgbString();
        setActiveFontStyle(_self.activeSelection, "fill", hex);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      },
    });

    // 테두리 설정 이벤트 리스너
    const borderWidthInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-settings #input-border-width`
    );
    borderWidthInput.addEventListener("change", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let width = parseInt(this.value);
      _self.activeSelection.set({
        strokeUniform: true,
        strokeWidth: width,
      });
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    const borderStyleInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-settings #input-border-style`
    );
    borderStyleInput.addEventListener("change", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      try {
        let style = JSON.parse(this.value);
        _self.activeSelection.set({
          strokeUniform: true,
          strokeDashArray: style.strokeDashArray,
          strokeLineCap: style.strokeLineCap,
        });
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      } catch (e) {
        console.error("Invalid border style:", e);
      }
    });

    const cornerTypeInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-settings #input-corner-type`
    );
    cornerTypeInput.addEventListener("change", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let corner = this.value;
      _self.activeSelection.set("strokeLineJoin", corner);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    const borderColorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .border-settings #border-color-picker`
    );
    borderColorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
          return;
        let hex = color.toRgbString();
        _self.activeSelection.set("stroke", hex);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      },
    });

    const decreaseButton = borderWidthInput.previousElementSibling;
    const increaseButton = borderWidthInput.nextElementSibling;

    decreaseButton.addEventListener("click", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let value = parseInt(borderWidthInput.value) - 1;
      if (value < parseInt(borderWidthInput.min))
        value = parseInt(borderWidthInput.min);
      borderWidthInput.value = value;
      _self.activeSelection.set({
        strokeUniform: true,
        strokeWidth: value,
      });
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    increaseButton.addEventListener("click", function () {
      if (!_self.activeSelection || _self.activeSelection.type !== "textbox")
        return;
      let value = parseInt(borderWidthInput.value) + 1;
      borderWidthInput.value = value;
      _self.activeSelection.set({
        strokeUniform: true,
        strokeWidth: value,
      });
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });
  })();
  // end font section

  // text box section
  (() => {
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="textBox-section">
        <h4>텍스트 박스</h4>
        <div class="input-container"><label>배경 색상</label>
          <input id="color-picker" value="transparent">
        </div>
        <div class="horizontal-line"></div>
      </div>
    `
    );

    const colorPicker = $(
      `${this.containerSelector} .toolpanel#select-panel .textBox-section #color-picker`
    );
    colorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        let hex = color ? color.toRgbString() : "transparent";
        _self.canvas
          .getActiveObjects()
          .forEach((obj) => obj.set("backgroundColor", hex));
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self); // 배경 색상 변경 시 패널 동기화
      },
    });
  })();
  // end text box section

  // 화살표 섹션
  (() => {
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="arrow-section">
          <h4>화살표 스타일</h4>
          <div class="input-container">
            <label for="show-start-arrow">시작 화살표</label>
            <label class="toggle-wrapper">
              <input type="checkbox" id="show-start-arrow" name="show-start-arrow">
              <span class="slider"></span>
            </label>
          </div>
          <div class="input-container">
            <label for="show-end-arrow">끝 화살표</label>
            <label class="toggle-wrapper">
              <input type="checkbox" id="show-end-arrow" name="show-end-arrow">
              <span class="slider"></span>
            </label>
          </div>
          <div class="horizontal-line"></div>
        </div>
      `
    );
  })();

  // weatherFront section
  (() => {
    const selectPanelContent = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="weatherFront-section">
        <h4>전선 스타일</h4>
        <div class="input-container"><label>전선 종류</label>
          <select id="front-type">
            ${frontStyleList
              .map(
                (item) => `<option value="${item.value}">${item.label}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="input-container">
          <label>전선 도형 반전</label>
          <button id="front-shape-reflect-btn" class="btn_g">방향전환</button>
        </div>
        <div class="horizontal-line"></div>
      </div>
    `
    );

    const frontTypeSelect = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .weatherFront-section #front-type`
    );
    frontTypeSelect.addEventListener("change", function () {
      if (
        !_self.activeSelection ||
        _self.activeSelection.pathType !== "weatherFront"
      )
        return;
      const frontType = this.value;
      _self.activeSelection.set({ frontType });
      // 전선 경로와 도형을 다시 생성
      import("../drawing-tools/drawingWeatherFront.js").then((module) => {
        module.generateWeatherFrontPath(_self.activeSelection, _self.canvas);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      });
    });

    const frontShapeReflectBtn = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .weatherFront-section #front-shape-reflect-btn`
    );
    frontShapeReflectBtn.addEventListener("click", function () {
      if (
        !_self.activeSelection ||
        _self.activeSelection.pathType !== "weatherFront"
      )
        return;
      // isReflect 토글
      const currentReflect = _self.activeSelection.isReflect || false;
      _self.activeSelection.set({ isReflect: !currentReflect });
      // 버튼 텍스트 업데이트
      this.textContent = `도형 반전 ${
        _self.activeSelection.isReflect ? "해제" : "적용"
      }`;
      // 전선 경로와 도형을 다시 생성
      import("../drawing-tools/drawingWeatherFront.js").then((module) => {
        module.generateWeatherFrontPath(_self.activeSelection, _self.canvas);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      });
    });
  })();

  // border section
  (() => {
    const selectPanelContent = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="border-section">
        <h4>테두리</h4>
        <div class="input-container"><label>두께</label>
          <div class="custom-number-input">
            <button class="decrease">-</button>
            <input type="number" min="1" value="1" step="0" id="input-border-width">
            <button class="increase">+</button>
          </div>
        </div>
        <div class="input-container"><label>스타일</label>
          <select id="input-border-style">${BorderStyleList.map(
            (item) =>
              `<option value='${JSON.stringify(item.value)}'>${
                item.label
              }</option>`
          )}</select>
        </div>
        <div class="input-container"><label>모서리 타입</label>
          <select id="input-corner-type">
            <option value="miter" selected>사각형</option>
            <option value="round">둥근 모서리</option>
          </select>
        </div>
        <div class="input-container"><label>색상</label>
          <input id="color-picker" value="black">
        </div>
        <div class="neon-section">
          <div class="horizontal-line"></div>
          <h4>네온 효과</h4>
          <div class="input-container"><label>색상</label>
            <input id="neon-color-picker" value="transparent">
          </div>
        </div>
        <div class="horizontal-line"></div>
      </div>
    `
    );

    const colorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .border-section #color-picker`
    );
    colorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        if (
          !_self.activeSelection ||
          !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
            _self.activeSelection.type
          )
        )
          return;
        let hex = color.toRgbString();
        _self.activeSelection.set("stroke", hex);
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      },
    });

    const neonColorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .border-section #neon-color-picker`
    );
    neonColorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        if (
          !_self.activeSelection ||
          !["textbox", "path", "polygon", "circle", "rect"].includes(
            _self.activeSelection.type
          )
        )
          return;
        let hex = color.toRgbString();
        _self.activeSelection.set({
          shadow: new fabric.Shadow({
            color: hex,
            blur: 10,
            offsetX: 0,
            offsetY: 0,
            affectStroke: true,
          }),
        });
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      },
    });

    const borderWidthInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-section #input-border-width`
    );
    const borderStyleInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-section #input-border-style`
    );

    function adjustDashArray(style, strokeWidth) {
      if (!style.strokeDashArray || style.strokeDashArray.length === 0) {
        return [];
      }
      return style.strokeDashArray.map(
        (val) => Math.round(val * (strokeWidth * 0.2) * 100) / 100
      );
    }

    borderWidthInput.addEventListener("change", function () {
      if (
        !_self.activeSelection ||
        !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
          _self.activeSelection.type
        )
      )
        return;
      let width = parseInt(this.value);
      try {
        let style = JSON.parse(borderStyleInput.value);
        const adjustedDashArray = adjustDashArray(style, width);
        _self.activeSelection.set({
          strokeUniform: true,
          strokeWidth: width,
          strokeDashArray: adjustedDashArray,
          strokeLineCap: style.strokeLineCap,
        });
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        syncPanelWithSelection(_self);
      } catch (e) {
        console.error("Invalid border style:", e);
      }
    });

    borderStyleInput.addEventListener("change", function () {
      if (
        !_self.activeSelection ||
        !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
          _self.activeSelection.type
        )
      )
        return;
      try {
        let style = JSON.parse(this.value);
        const strokeWidth = _self.activeSelection.strokeWidth || 1;
        const adjustedDashArray = adjustDashArray(style, strokeWidth);
        const currentDashArray = _self.activeSelection.strokeDashArray || [];
        const currentLineCap = _self.activeSelection.strokeLineCap || "butt";

        const isDashArrayEqual =
          adjustedDashArray.length === currentDashArray.length &&
          adjustedDashArray.every(
            (val, i) => Math.abs(val - currentDashArray[i]) < 0.01
          );

        const hasChanges =
          !isDashArrayEqual || style.strokeLineCap !== currentLineCap;

        if (hasChanges) {
          _self.activeSelection.set({
            strokeUniform: true,
            strokeDashArray: adjustedDashArray,
            strokeLineCap: style.strokeLineCap,
          });
          _self.canvas.fire("object:modified");
          _self.canvas.renderAll();
          syncPanelWithSelection(_self);
        }
      } catch (e) {
        console.error("Invalid border style:", e);
      }
    });

    const cornerTypeInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .border-section #input-corner-type`
    );
    cornerTypeInput.addEventListener("change", function () {
      if (
        !_self.activeSelection ||
        !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
          _self.activeSelection.type
        )
      )
        return;
      let corner = this.value;
      _self.activeSelection.set("strokeLineJoin", corner);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });

    const decreaseButton = borderWidthInput.previousElementSibling;
    const increaseButton = borderWidthInput.nextElementSibling;

    decreaseButton.addEventListener("click", function () {
      if (
        !_self.activeSelection ||
        !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
          _self.activeSelection.type
        )
      )
        return;

      let value = parseInt(borderWidthInput.value) - 1;
      if (value < parseInt(borderWidthInput.min))
        value = parseInt(borderWidthInput.min);

      // 변경 여부 확인
      const currentStrokeWidth = _self.activeSelection.strokeWidth || 1;
      if (value === currentStrokeWidth) return; // 변경 없으면 종료

      borderWidthInput.value = value;
      try {
        let style = JSON.parse(borderStyleInput.value);
        const adjustedDashArray = adjustDashArray(style, value);
        const currentDashArray = _self.activeSelection.strokeDashArray || [];
        const currentLineCap = _self.activeSelection.strokeLineCap || "butt";

        // strokeDashArray 비교 (부동소수점 오차 고려)
        const isDashArrayEqual =
          adjustedDashArray.length === currentDashArray.length &&
          adjustedDashArray.every(
            (val, i) => Math.abs(val - currentDashArray[i]) < 0.01
          );

        // 변경 여부 확인
        const hasChanges =
          value !== currentStrokeWidth ||
          !isDashArrayEqual ||
          style.strokeLineCap !== currentLineCap;

        if (hasChanges) {
          _self.activeSelection.set({
            strokeUniform: true,
            strokeWidth: value,
            strokeDashArray: adjustedDashArray,
            strokeLineCap: style.strokeLineCap,
          });
          _self.canvas.renderAll();
          // change 이벤트와 중복 방지를 위해 플래그 설정
          _self._isProgrammaticChange = true;
          syncPanelWithSelection(_self);
          _self._isProgrammaticChange = false;
        }
      } catch (e) {
        console.error("Invalid border style:", e);
      }
    });

    increaseButton.addEventListener("click", function () {
      if (
        !_self.activeSelection ||
        !["textbox", "path", "image", "polygon", "circle", "rect"].includes(
          _self.activeSelection.type
        )
      )
        return;

      let value = parseInt(borderWidthInput.value) + 1;

      // 변경 여부 확인
      const currentStrokeWidth = _self.activeSelection.strokeWidth || 1;
      if (value === currentStrokeWidth) return; // 변경 없으면 종료

      borderWidthInput.value = value;
      try {
        let style = JSON.parse(borderStyleInput.value);
        const adjustedDashArray = adjustDashArray(style, value);
        const currentDashArray = _self.activeSelection.strokeDashArray || [];
        const currentLineCap = _self.activeSelection.strokeLineCap || "butt";

        // strokeDashArray 비교 (부동소수점 오차 고려)
        const isDashArrayEqual =
          adjustedDashArray.length === currentDashArray.length &&
          adjustedDashArray.every(
            (val, i) => Math.abs(val - currentDashArray[i]) < 0.01
          );

        // 변경 여부 확인
        const hasChanges =
          value !== currentStrokeWidth ||
          !isDashArrayEqual ||
          style.strokeLineCap !== currentLineCap;

        if (hasChanges) {
          _self.activeSelection.set({
            strokeUniform: true,
            strokeWidth: value,
            strokeDashArray: adjustedDashArray,
            strokeLineCap: style.strokeLineCap,
          });
          _self.canvas.renderAll();
          // change 이벤트와 중복 방지를 위해 플래그 설정
          _self._isProgrammaticChange = true;
          syncPanelWithSelection(_self);
          _self._isProgrammaticChange = false;
        }
      } catch (e) {
        console.error("Invalid border style:", e);
      }
    });
  })();
  // end border section

  // fill color section
  (() => {
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="fill-section">
          <h4>배경</h4>
          <div class="input-container"><label>색상</label>
            <input id="color-picker" value="transparent">
          </div>
          <div class="horizontal-line"></div>
        </div>
      `
    );

    const colorPicker = $(
      `${this.containerSelector} .toolpanel#select-panel .fill-section #color-picker`
    );
    colorPicker.spectrum({
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      palette: [
        [
          "#000000",
          "#444444",
          "#5b5b5b",
          "#999999",
          "#bcbcbc",
          "#eeeeee",
          "#f3f6f4",
          "#ffffff",
        ],
        [
          "#f44336",
          "#744700",
          "#ce7e00",
          "#8fce00",
          "#2986cc",
          "#16537e",
          "#6a329f",
          "#c90076",
        ],
        [
          "#f4cccc",
          "#fce5cd",
          "#fff2cc",
          "#d9ead3",
          "#d0e0e3",
          "#cfe2f3",
          "#d9d2e9",
          "#ead1dc",
        ],
        [
          "#ea9999",
          "#f9cb9c",
          "#ffe599",
          "#b6d7a8",
          "#a2c4c9",
          "#9fc5e8",
          "#b4a7d6",
          "#d5a6bd",
        ],
        [
          "#e06666",
          "#f6b26b",
          "#ffd966",
          "#93c47d",
          "#76a5af",
          "#6fa8dc",
          "#8e7cc3",
          "#c27ba0",
        ],
        [
          "#cc0000",
          "#e69138",
          "#f1c232",
          "#6aa84f",
          "#45818e",
          "#3d85c6",
          "#674ea7",
          "#a64d79",
        ],
        [
          "#990000",
          "#b45f06",
          "#bf9000",
          "#38761d",
          "#134f5c",
          "#0b5394",
          "#351c75",
          "#741b47",
        ],
        [
          "#660000",
          "#783f04",
          "#7f6000",
          "#274e13",
          "#0c343d",
          "#073763",
          "#20124d",
          "#4c1130",
        ],
        ["#ffdb23", "#ff9500", "#ff0100"],
      ],
      move: function (color) {
        let hex = "transparent";
        color && (hex = color.toRgbString());
        _self.canvas.getActiveObjects().forEach((obj) => obj.set("fill", hex));
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
      },
    });
  })();
  // end fill color section

  // effect section
  (() => {
    const selectPanelContent = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="effect-section">
        <h4>효과</h4>
        <div class="input-container"><label>불투명도</label><input id="opacity" type="range" min="0" max="1" value="1" step="0.01"></div>
        <div class="horizontal-line"></div>
      </div>
    `
    );

    const opacityInput = document.querySelector(
      `${_self.containerSelector} .toolpanel#select-panel .effect-section #opacity`
    );
    opacityInput.addEventListener("input", function () {
      if (!_self.activeSelection) return;
      let opacity = parseFloat(this.value);
      _self.activeSelection.set("opacity", opacity);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
    });

    opacityInput.addEventListener("change", function () {
      if (!_self.activeSelection) return;
      let opacity = parseFloat(this.value);
      _self.activeSelection.set("opacity", opacity);
      _self.canvas.fire("object:modified");
      _self.canvas.renderAll();
      syncPanelWithSelection(_self);
    });
  })();
  // end effect section

  // alignment section
  (() => {
    let buttons = ``;
    AlignmentButtonList.forEach((item) => {
      buttons += `<button data-pos="${item.pos}" data-title="${item.title}">${item.icon}</button>`;
    });
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="alignment-section">
          <h4>정렬</h4>
          ${buttons}
          <div class="horizontal-line"></div>
        </div>
      `
    );

    // alignment section button은 여러개이기 떄문에 querySelectorAll을 통해 모든 요소를 얻고 이벤트 부여
    const alignmentSectionButton = document.querySelectorAll(
      `${this.containerSelector} .toolpanel#select-panel .alignment-section button`
    );
    alignmentSectionButton.forEach(function (button) {
      button.addEventListener("click", function () {
        let pos = $(this).data("pos");
        alignObject(_self.canvas, _self.activeSelection, pos);
      });

      button.addEventListener("mouseenter", function () {
        showTooltip(this);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
    });
  })();
  // end alignment section

  // object options section
  (() => {
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );

    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="object-options">
          <h4>개체 복사/삭제</h4>
          <button data-title="복제" id="duplicate"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><g><path d="M42.667,256c0-59.52,35.093-110.827,85.547-134.827V75.2C53.653,101.44,0,172.48,0,256s53.653,154.56,128.213,180.8 v-45.973C77.76,366.827,42.667,315.52,42.667,256z"></path><path d="M320,64c-105.92,0-192,86.08-192,192s86.08,192,192,192s192-86.08,192-192S425.92,64,320,64z M320,405.333 c-82.347,0-149.333-66.987-149.333-149.333S237.653,106.667,320,106.667S469.333,173.653,469.333,256 S402.347,405.333,320,405.333z"></path><polygon points="341.333,170.667 298.667,170.667 298.667,234.667 234.667,234.667 234.667,277.333 298.667,277.333 298.667,341.333 341.333,341.333 341.333,277.333 405.333,277.333 405.333,234.667 341.333,234.667  "></polygon></g></g></g></svg></button>
          <button data-title="삭제" id="delete"><svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="red" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="red" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="red" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="red" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg></button>
          <h4>개체 순서</h4>
          <button data-title="앞으로 가져오기" id="bring-fwd"><svg x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M10,10h686v686H10V10 M990,304v686H304V794h98v98h490V402h-98v-98H990z"></path></g></svg></button>
          <button data-title="뒤로 보내기" id="bring-back"><svg enable-background="new 0 0 1000 1000" viewBox="0 0 1e3 1e3" xml:space="preserve"><path d="m990 990h-686v-686h686v686m-980-294v-686h686v680h-98v-582h-490v490h200v98z"></path><rect x="108.44" y="108" width="490" height="490" fill="#fff"></rect></svg></button>
          <h4>개체 그룹</h4>
          <button data-title="그룹화" id="group"><svg width="248" height="249" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="14" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect><rect id="svg_4" height="26.016205" width="26.016205" y="4.813006" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_5" height="26.016205" width="26.016205" y="3.999999" x="217.820703" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_7" height="26.016205" width="26.016205" y="218.633712" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_8" height="26.016205" width="26.016205" y="218.633712" x="217.820694" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect></g></svg></button>
          <button data-title="그룹 해제" id="ungroup"><svg width="247.99999999999997" height="248.99999999999997" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect stroke-dasharray="20" id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="16" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect></g></svg></button>
          <div class="horizontal-line"></div>
        </div>
      `
    );

    /* 개체 대칭
      <h4 id="object-flip">개체 대칭</h4>
      <button data-title="좌우 대칭" id="flip-h"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(0 1.5365 1.5385 0 -5.0769 1.5495)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="10 15 5.5 11 1 15"></polygon></g></svg></button>
      <button data-title="상하 대칭" id="flip-v"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(1.5365 0 0 1.5385 -.45052 -3.0769)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="5.5 11 1 15 10 15"></polygon></g></svg></button>

    // Flip horizontally
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #flip-h`
      )
      .addEventListener("click", () => {
        this.activeSelection.set("flipX", !this.activeSelection.flipX);
        getFilteredFocusObjects().forEach((obj) => {
          restoreControlPoints(this.canvas, obj);
        });
        this.canvas.fire("object:modified");
        this.canvas.renderAll();
      });

    // Flip vertically
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #flip-v`
      )
      .addEventListener("click", () => {
        this.activeSelection.set("flipY", !this.activeSelection.flipY);
        this.canvas.fire("object:modified");
        this.canvas.renderAll();
      });
    */

    // Bring forward
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #bring-fwd`
      )
      .addEventListener("click", () => {
        this.canvas.bringForward(this.activeSelection);
        this.canvas.fire("object:modified");
        this.canvas.renderAll();
      });

    // Send backwards
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #bring-back`
      )
      .addEventListener("click", () => {
        this.canvas.sendBackwards(this.activeSelection);
        this.canvas.fire("object:modified");
        this.canvas.renderAll();
      });

    // fabric.Path.prototype.toObject = (function (originalToObject) {
    //   return function (propertiesToInclude) {
    //     const obj = originalToObject.call(this, propertiesToInclude);
    //     return fabric.util.object.extend(obj, {
    //       p0: this.p0
    //         ? { left: this.p0.left, top: this.p0.top, name: this.p0.name }
    //         : null,
    //       p1: this.p1
    //         ? { left: this.p1.left, top: this.p1.top, name: this.p1.name }
    //         : null,
    //       p2: this.p2
    //         ? { left: this.p2.left, top: this.p2.top, name: this.p2.name }
    //         : null,
    //       startHead: this.startHead,
    //       endHead: this.endHead,
    //       pathType: this.pathType,
    //       frontType: this.frontType,
    //       pathD: this.pathD,
    //       controlPoints: this.controlPoints
    //         ? this.controlPoints.map((point) => ({
    //             left: point.left,
    //             top: point.top,
    //             segmentIndex: point.segmentIndex,
    //             isStart: point.isStart || false,
    //             isMidPoint: point.isMidPoint || false,
    //             offsetX: point.offsetX,
    //             offsetY: point.offsetY,
    //           }))
    //         : [],
    //       shapeObjects: [],
    //       frontShape: this.frontShape,
    //     });
    //   };
    // })(fabric.Path.prototype.toObject);

    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #duplicate`
      )
      .addEventListener("click", () => {
        let clonedObjects = [];
        let activeObjects = this.canvas.getActiveObjects();

        if (!activeObjects || activeObjects.length === 0) {
          console.error("No active objects found");
          return;
        }

        const vpt = this.canvas.viewportTransform;
        const dx = 33.5 - vpt[4];
        const dy = 33.5 - vpt[5];

        const generateUniqueId = () => {
          return `obj-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        };

        const deepCloneObject = (obj, callback) => {
          if (!obj) {
            console.error("Invalid object:", obj);
            return callback();
          }

          const serializedObj = obj.toObject([
            "name",
            "p0",
            "p1",
            "p2",
            "controlPoints",
            "pathType",
            "params",
            "id",
            "label",
            "visible",
            "apiType",
            "overlayImage",
            "startHead",
            "endHead",
            "frontType",
            "pathD",
            "shapeObjects",
            "frontShape",
            "isReflect",
            "isDelete",
            "viewportTransform",
            "width",
            "height",
            "padding",
            "hasControls",
            "borderColor",
            "strokeUniform",
          ]);

          if (obj.type === "group" && obj._objects) {
            const originalCoords = obj._objects.map((nestedObj) => ({
              left: nestedObj.left,
              top: nestedObj.top,
            }));

            const objectPromises = obj._objects.map(
              (nestedObj, index) =>
                new Promise((resolve) => {
                  if (!nestedObj) {
                    console.error("Invalid nested object:", nestedObj);
                    return resolve(null);
                  }
                  const serializedNestedObj = nestedObj.toObject([
                    "name",
                    "p0",
                    "p1",
                    "p2",
                    "controlPoints",
                    "pathType",
                    "params",
                    "id",
                    "label",
                    "visible",
                    "apiType",
                    "overlayImage",
                    "startHead",
                    "endHead",
                    "frontType",
                    "pathD",
                    "shapeObjects",
                    "frontShape",
                    "isReflect",
                    "isDelete",
                    "viewportTransform",
                    "width",
                    "height",
                    "padding",
                    "hasControls",
                    "borderColor",
                    "strokeUniform",
                  ]);
                  fabric.util.enlivenObjects(
                    [serializedNestedObj],
                    (clonedNested) => {
                      const clone = clonedNested[0];
                      if (!clone) {
                        console.error(
                          "Failed to clone nested object:",
                          nestedObj
                        );
                        return resolve(null);
                      }
                      clone.set({
                        id: generateUniqueId(),
                        label: nestedObj.label?.includes("(복사본)")
                          ? nestedObj.label
                          : (nestedObj.label || "") + "(복사본)",
                        strokeUniform: nestedObj.strokeUniform,
                        hasControls: nestedObj.hasControls,
                        borderColor: nestedObj.borderColor,
                        padding: nestedObj.padding,
                        left: originalCoords[index].left,
                        top: originalCoords[index].top,
                      });
                      resolve(clone);
                    }
                  );
                })
            );

            Promise.all(objectPromises).then((clonedNestedObjects) => {
              const validClonedNestedObjects = clonedNestedObjects.filter(
                (c) => c
              );

              const clonedGroup = new fabric.Group(validClonedNestedObjects, {
                id: generateUniqueId(),
                label: obj.label?.includes("(복사본)")
                  ? obj.label
                  : (obj.label || "") + "(복사본)",
                hasControls: obj.hasControls,
                borderColor: obj.borderColor,
                padding: obj.padding,
                strokeUniform: obj.strokeUniform,
              });

              // 이 시점에서 left/top 조정은 별도로 처리
              clonedGroup.left = obj.oCoords.tl.x + dx - 6;
              clonedGroup.top = obj.oCoords.tl.y + dy - 6;
              clonedGroup.setCoords();

              processObjects([clonedGroup], this.canvas, 27.5, 27.5);
              this.canvas.add(clonedGroup);
              clonedObjects.push(clonedGroup);
              callback(clonedGroup);
            });
          } else if (obj.type === "image") {
            fabric.Image.fromObject(serializedObj, (clone) => {
              if (!clone) {
                console.error("Failed to clone image:", obj);
                return callback();
              }

              clone.set({
                id: generateUniqueId(),
                label: obj.label?.includes("(복사본)")
                  ? obj.label
                  : (obj.label || "") + "(복사본)",
                strokeUniform: obj.strokeUniform,
                hasControls: obj.hasControls,
                borderColor: obj.borderColor,
                padding: obj.padding,
              });

              if (clone.getElement() && clone.getElement().complete) {
                finalizeClone(clone, obj, dx - 6, dy - 6);
                callback(clone);
              } else {
                clone.getElement().onload = () => {
                  finalizeClone(clone, obj, dx - 6, dy - 6);
                  callback(clone);
                };
              }
            });
          } else {
            fabric.util.enlivenObjects([serializedObj], (objects) => {
              const clone = objects[0];
              if (!clone) {
                console.error("Failed to clone object:", obj);
                return callback();
              }
              clone.set({
                id: generateUniqueId(),
                label: obj.label?.includes("(복사본)")
                  ? obj.label
                  : (obj.label || "") + "(복사본)",
                strokeUniform: obj.strokeUniform,
                hasControls: obj.hasControls,
                borderColor: obj.borderColor,
                padding: obj.padding,
              });
              finalizeClone(clone, obj, dx, dy);
              callback(clone);
            });
          }
        };

        const finalizeClone = (clone, obj, dx, dy) => {
          if (!obj.oCoords || !obj.oCoords.tl) {
            console.warn("Missing oCoords, using left/top instead:", obj);
            clone.set({
              strokeUniform: true,
              left: (obj.left || 0) + dx,
              top: (obj.top || 0) + dy,
              label: obj.label?.includes("(복사본)")
                ? obj.label
                : (obj.label || "") + "(복사본)",
              hasControls: obj.hasControls,
              borderColor: obj.borderColor,
              padding: obj.padding,
            });
          } else {
            clone.set({
              strokeUniform: true,
              left: obj.oCoords.tl.x + dx,
              top: obj.oCoords.tl.y + dy,
              label: obj.label?.includes("(복사본)")
                ? obj.label
                : (obj.label || "") + "(복사본)",
              hasControls: obj.hasControls,
              borderColor: obj.borderColor,
              padding: obj.padding,
            });
          }

          clone.setCoords();
          processObjects([clone], this.canvas, 27.5, 27.5);
          this.canvas.add(clone);
          clonedObjects.push(clone);
        };

        if (
          activeObjects.length > 1 ||
          activeObjects[0] instanceof fabric.ActiveSelection
        ) {
          let objectsToProcess = activeObjects;
          if (activeObjects[0] instanceof fabric.ActiveSelection) {
            objectsToProcess = activeObjects[0]._objects || [];
            if (objectsToProcess.length === 0) {
              console.error("No objects in ActiveSelection");
              return;
            }
          }

          const promises = objectsToProcess.map(
            (obj) => new Promise((resolve) => deepCloneObject(obj, resolve))
          );

          Promise.all(promises).then((clones) => {
            this.canvas.renderAll();

            requestAnimationFrame(() => {
              if (clonedObjects.length > 1) {
                let sel = new fabric.ActiveSelection(clonedObjects, {
                  canvas: this.canvas,
                });
                this.canvas.setActiveObject(sel);
              } else if (clonedObjects.length === 1) {
                this.canvas.setActiveObject(clonedObjects[0]);
              }

              this.canvas.fire("object:modified");
              this.canvas.renderAll();
            });
          });
        } else if (activeObjects.length === 1) {
          deepCloneObject(activeObjects[0], (clone) => {
            if (!clone) return;
            clonedObjects.push(clone);

            this.canvas.renderAll();
            requestAnimationFrame(() => {
              this.canvas.setActiveObject(clone);
              this.canvas.fire("object:modified");
              this.canvas.renderAll();
            });
          });
        }
      });

    // Delete
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #delete`
      )
      .addEventListener("click", () => {
        this.canvas
          .getActiveObjects()
          .forEach((obj) => this.canvas.remove(obj));
        this.canvas.fire("object:modified");
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
      });

    // Group
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #group`
      )
      .addEventListener("click", () => {
        toggleGroup(this.canvas);
        this.canvas.fire("object:modified");
        this.canvas.renderAll();
      });

    // Ungroup
    document
      .querySelector(
        `${this.containerSelector} .toolpanel#select-panel .object-options #ungroup`
      )
      .addEventListener("click", () => {
        toggleGroup(this.canvas);
        this.canvas.fire("object:modified");
      });

    // button 여러개이기 떄문에 querySelectorAll을 통해 모든 요소를 얻고 이벤트 부여
    const buttons = document.querySelectorAll(
      `${this.containerSelector} .toolpanel#select-panel .object-options button`
    );
    buttons.forEach(function (button) {
      button.addEventListener("mouseenter", function () {
        showTooltip(this);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
    });
  })();
  // end object options section

  // control point section
  (() => {
    const selectPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .content`
    );
    selectPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="controlPoint-section">
          <h4>원하는 모양으로 수정하세요</h4>
        </div>
      `
    );
  })();
  // end control point section

  // 패널 표시/숨김 업데이트 함수
  function updatePanelVisibility() {
    const panel = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel`
    );
    const arrowSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .arrow-section`
    );
    const weatherFrontSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .weatherFront-section`
    );
    const neonSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .border-section .neon-section`
    );
    const textSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .text-section`
    );
    const textBoxSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .textBox-section`
    );
    const borderSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .border-section`
    );
    const fillSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .fill-section`
    );
    const effectSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .effect-section`
    );
    const alignmentSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .alignment-section`
    );
    const objectOptionsSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .object-options`
    );
    const controlPointSection = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel .controlPoint-section`
    );

    [
      arrowSection,
      weatherFrontSection,
      textSection,
      textBoxSection,
      borderSection,
      fillSection,
      effectSection,
      neonSection,
      alignmentSection,
      objectOptionsSection,
      controlPointSection,
    ].forEach((section) => {
      if (section) section.style.display = "none";
    });

    if (!panel) return;

    let objType = "";

    if (this.activeSelection) {
      objType = this.activeSelection.type;
      const isControlPoint = this.activeSelection.isControlPoint;

      if (objType === "activeselection" || objType === "group") {
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
      }

      if (objType === "textbox") {
        if (textSection) textSection.style.display = "block";
        if (textBoxSection) textBoxSection.style.display = "block";
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
        if (effectSection) effectSection.style.display = "block";
      }

      if (objType === "circle" || objType === "rect") {
        if (isControlPoint) {
          if (controlPointSection) controlPointSection.style.display = "block";
          return;
        }
        if (borderSection) borderSection.style.display = "block";
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
        if (effectSection) effectSection.style.display = "block";
        if (fillSection) fillSection.style.display = "block";
      }

      if (objType === "path") {
        if (borderSection) borderSection.style.display = "block";
        if (neonSection) neonSection.style.display = "block";
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
        if (effectSection) effectSection.style.display = "block";

        // const objectFlip = document.getElementById("object-flip");
        // const flipH = document.getElementById("flip-h");
        // const flipV = document.getElementById("flip-v");

        // objectFlip.style.display = "none";
        // flipH.style.display = "none";
        // flipV.style.display = "none";

        if (this.activeSelection.pathType === "line") {
        } else if (this.activeSelection.pathType === "arrow") {
          if (arrowSection) arrowSection.style.display = "block";
        } else if (this.activeSelection.pathType === "polygon") {
          if (fillSection) fillSection.style.display = "block";
          if (neonSection) neonSection.style.display = "none";
        } else if (this.activeSelection.pathType === "weatherFront") {
          if (weatherFrontSection) weatherFrontSection.style.display = "block";
          if (borderSection) borderSection.style.display = "none";
          if (effectSection) effectSection.style.display = "none";
        } else {
          if (fillSection) fillSection.style.display = "block";
          // objectFlip.style.display = "flex";
          // flipH.style.display = "inline-block";
          // flipV.style.display = "inline-block";
        }
      }

      if (objType === "image") {
        if (borderSection) borderSection.style.display = "block";
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
        if (effectSection) effectSection.style.display = "block";
      }

      if (objType === "polygon") {
        if (borderSection) borderSection.style.display = "block";
        if (neonSection) neonSection.style.display = "block";
        if (fillSection) fillSection.style.display = "block";
        if (objectOptionsSection) objectOptionsSection.style.display = "block";
        if (alignmentSection) alignmentSection.style.display = "block";
        if (effectSection) effectSection.style.display = "block";
      }

      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  }

  // 선택 타입 업데이트
  function updateSelectionType() {
    const panel = document.querySelector(
      `${this.containerSelector} .toolpanel#select-panel`
    );
    if (!panel) return;

    panel.classList.remove(
      "type-textbox",
      "type-image",
      "type-polygon",
      "type-activeSelection",
      "type-group",
      "type-arrow"
    );

    if (this.activeSelection) {
      if (
        this.activeSelection.type === "arrow" ||
        this.activeSelection.objectType === "arrow"
      ) {
        panel.classList.add("type-arrow");
      } else {
        panel.classList.add(`type-${this.activeSelection.type.toLowerCase()}`);
      }
    }
  }

  // 이벤트 연결
  this.canvas.on("selection:created", () => {
    this.activeSelection = this.canvas.getActiveObject();
    updateSelectionType.call(this);
    updatePanelVisibility.call(this);
  });

  this.canvas.on("selection:updated", () => {
    this.activeSelection = this.canvas.getActiveObject();
    updateSelectionType.call(this);
    updatePanelVisibility.call(this);
  });

  this.canvas.on("selection:cleared", () => {
    this.activeSelection = null;
    updateSelectionType.call(this);
    updatePanelVisibility.call(this);
  });

  updatePanelVisibility.call(this);
}

function showTooltip(button) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerText = button.dataset.title;

  document.body.appendChild(tooltip);

  const buttonRect = button.getBoundingClientRect();

  let tooltipLeft =
    buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipRight =
    buttonRect.right + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipTop = buttonRect.top + buttonRect.height + 5;

  const screenWidth = window.innerWidth;
  if (tooltipLeft < 0) {
    tooltipLeft = 0;
  } else if (tooltipRight + tooltip.offsetWidth > screenWidth) {
    tooltipLeft = screenWidth - tooltip.offsetWidth;
  }

  tooltip.style.left = `${tooltipLeft}px`;
  tooltip.style.top = `${tooltipTop}px`;

  setTimeout(() => {
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translateY(0)";
  }, 10);
}

function removeTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

// 객체 - 패널 데이터 동기화
function syncPanelWithSelection(editor) {
  if (!editor.activeSelection) return;

  const objType = editor.activeSelection.type;

  // 테두리 섹션 동기화 (textbox, path, image, polygon, circle)
  if (
    objType === "textbox" ||
    objType === "path" ||
    objType === "image" ||
    objType === "polygon" ||
    objType === "circle" ||
    objType === "rect"
  ) {
    const borderWidthInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-section #input-border-width`
    );
    const borderStyleInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-section #input-border-style`
    );
    const cornerTypeInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-section #input-corner-type`
    );
    const borderColorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .border-section #color-picker`
    );
    const strokeWidth = editor.activeSelection.strokeWidth || 1;
    borderWidthInput.value = strokeWidth;
    const currentDashArray = editor.activeSelection.strokeDashArray || [];
    const currentLineCap = editor.activeSelection.strokeLineCap || "butt";

    if (!editor._borderStyleCache) {
      editor._borderStyleCache = {};
      BorderStyleList.forEach((style) => {
        const key = JSON.stringify(style.value);
        editor._borderStyleCache[key] = style;
      });
    }

    let styleValue;
    if (currentDashArray.length) {
      const normalizedDashArray = currentDashArray.map(
        (val) => val / (strokeWidth * 0.2)
      );
      const matchingBorderStyle = BorderStyleList.find((style) => {
        const styleDashArray = style.value.strokeDashArray || [];
        return (
          styleDashArray.length === normalizedDashArray.length &&
          styleDashArray.every(
            (val, i) => Math.abs(val - normalizedDashArray[i]) < 0.01
          ) &&
          style.value.strokeLineCap === currentLineCap
        );
      });
      styleValue = matchingBorderStyle
        ? JSON.stringify(matchingBorderStyle.value)
        : JSON.stringify(BorderStyleList[0].value);
    } else {
      const key = JSON.stringify({
        strokeDashArray: currentDashArray,
        strokeLineCap: currentLineCap,
      });
      styleValue = editor._borderStyleCache[key]
        ? key
        : JSON.stringify(BorderStyleList[0].value);
    }

    if (borderStyleInput.value !== styleValue) {
      borderStyleInput.value = styleValue;
      borderStyleInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    cornerTypeInput.value = editor.activeSelection.strokeLineJoin || "miter";
    borderColorPicker.spectrum("set", editor.activeSelection.stroke || "black");
  }

  // 텍스트 섹션 동기화
  if (objType === "textbox") {
    const fontFamilySelect = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .family #font-family`
    );
    const fontSizeInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .sizes #fontSize`
    );
    const lineHeightInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .sizes #lineHeight`
    );
    const charSpacingInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .sizes #charSpacing`
    );
    const textAlignSelect = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .align #text-align`
    );
    const colorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .color #color-picker`
    );
    const borderWidthInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-settings #input-border-width`
    );
    const borderStyleInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-settings #input-border-style`
    );
    const cornerTypeInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .border-settings #input-corner-type`
    );
    const borderColorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .border-settings #border-color-picker`
    );

    if (
      editor.activeSelection.isEditing &&
      editor.activeSelection.selectionStart !==
        editor.activeSelection.selectionEnd
    ) {
      const styles = editor.activeSelection.getSelectionStyles(
        editor.activeSelection.selectionStart,
        editor.activeSelection.selectionEnd
      );
      const fontSize =
        styles[0]?.fontSize || editor.activeSelection.fontSize || 20;
      fontSizeInput.value = fontSize;
      fontFamilySelect.value =
        styles[0]?.fontFamily ||
        editor.activeSelection.fontFamily ||
        "맑은 고딕";
      colorPicker.spectrum(
        "set",
        styles[0]?.fill || editor.activeSelection.fill || "black"
      );
    } else {
      fontSizeInput.value = editor.activeSelection.fontSize || 20;
      fontFamilySelect.value = editor.activeSelection.fontFamily || "맑은 고딕";
      colorPicker.spectrum("set", editor.activeSelection.fill || "black");
    }

    lineHeightInput.value = editor.activeSelection.lineHeight || 1;
    charSpacingInput.value = editor.activeSelection.charSpacing || 0;
    textAlignSelect.value = editor.activeSelection.textAlign || "left";

    // 테두리 설정 동기화
    borderWidthInput.value = editor.activeSelection.strokeWidth || 1;
    const currentDashArray = editor.activeSelection.strokeDashArray || [];
    const currentLineCap = editor.activeSelection.strokeLineCap || "butt";
    const matchingBorderStyle = BorderStyleList.find(
      (style) =>
        JSON.stringify(style.value.strokeDashArray) ===
          JSON.stringify(currentDashArray) &&
        style.value.strokeLineCap === currentLineCap
    );
    borderStyleInput.value = matchingBorderStyle
      ? JSON.stringify(matchingBorderStyle.value)
      : JSON.stringify(BorderStyleList[0].value);
    cornerTypeInput.value = editor.activeSelection.strokeLineJoin || "miter";
    borderColorPicker.spectrum("set", editor.activeSelection.stroke || "black");

    const styleButtons = document.querySelectorAll(
      `${editor.containerSelector} .toolpanel#select-panel .style button`
    );
    styleButtons.forEach((button) => {
      const type = button.id;
      let isActive = false;

      if (
        editor.activeSelection.isEditing &&
        editor.activeSelection.selectionStart !==
          editor.activeSelection.selectionEnd
      ) {
        const styles = editor.activeSelection.getSelectionStyles(
          editor.activeSelection.selectionStart,
          editor.activeSelection.selectionEnd
        );
        isActive =
          (type === "bold" && styles[0]?.fontWeight === "bold") ||
          (type === "italic" && styles[0]?.fontStyle === "italic") ||
          (type === "underline" && styles[0]?.underline) ||
          (type === "linethrough" && styles[0]?.linethrough) ||
          (type === "subscript" && styles[0]?.deltaY > 0) ||
          (type === "superscript" && styles[0]?.deltaY < 0);
      } else {
        isActive =
          (type === "bold" && editor.activeSelection.fontWeight === "bold") ||
          (type === "italic" &&
            editor.activeSelection.fontStyle === "italic") ||
          (type === "underline" && editor.activeSelection.underline) ||
          (type === "linethrough" && editor.activeSelection.linethrough) ||
          (type === "subscript" && editor.activeSelection.deltaY > 0) ||
          (type === "superscript" && editor.activeSelection.deltaY < 0);
      }

      button.classList.toggle("active", isActive);
    });
  }

  // 텍스트 박스 섹션 동기화
  if (objType === "textbox") {
    const backgroundColorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .textBox-section #color-picker`
    );
    backgroundColorPicker.spectrum(
      "set",
      editor.activeSelection.backgroundColor || "transparent"
    );
  }

  // 화살표 섹션 동기화 (path, pathType이 arrow인 경우만)
  if (objType === "path" && editor.activeSelection.pathType === "arrow") {
    const showStartArrowCheckbox = document.querySelector("#show-start-arrow");
    const showEndArrowCheckbox = document.querySelector("#show-end-arrow");

    if (showStartArrowCheckbox && showEndArrowCheckbox) {
      showStartArrowCheckbox.checked = editor.activeSelection.startHead;
      showEndArrowCheckbox.checked = editor.activeSelection.endHead;

      showStartArrowCheckbox.addEventListener("change", () => {
        if (editor.activeSelection) {
          editor.activeSelection.set({
            startHead: showStartArrowCheckbox.checked,
          });
          updateArrowPathFromControlPoints(editor.activeSelection);
          editor.canvas.renderAll();
        }
      });

      showEndArrowCheckbox.addEventListener("change", () => {
        if (editor.activeSelection) {
          editor.activeSelection.set({ endHead: showEndArrowCheckbox.checked });
          updateArrowPathFromControlPoints(editor.activeSelection);
          editor.canvas.renderAll();
        }
      });
    }
  }

  // 전선 섹션 동기화 (path, pathType이 weatherFront인 경우)
  if (
    objType === "path" &&
    editor.activeSelection.pathType === "weatherFront"
  ) {
    const frontTypeSelect = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .weatherFront-section #front-type`
    );
    const frontShapeReflectBtn = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .weatherFront-section #front-shape-reflect-btn`
    );
    if (frontTypeSelect) {
      frontTypeSelect.value = editor.activeSelection.frontType || "warm";
    }
    if (frontShapeReflectBtn) {
      frontShapeReflectBtn.textContent = `도형 반전 ${
        editor.activeSelection.isReflect ? "해제" : "적용"
      }`;
    }
  }

  // 네온 효과 섹션 동기화 (textbox, path, polygon)
  if (objType === "textbox" || objType === "path" || objType === "polygon") {
    const neonColorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .border-section #neon-color-picker`
    );
    const shadow = editor.activeSelection.shadow;
    neonColorPicker.spectrum(
      "set",
      shadow && shadow.color ? shadow.color : "rgba(255, 255, 255, 0)"
    );
  }

  // 배경 섹션 동기화 (path, polygon, circle)
  if (
    objType === "path" ||
    objType === "polygon" ||
    objType === "circle" ||
    objType === "rect"
  ) {
    const fillColorPicker = $(
      `${editor.containerSelector} .toolpanel#select-panel .fill-section #color-picker`
    );
    fillColorPicker.spectrum(
      "set",
      editor.activeSelection.fill || "transparent"
    );
  }

  // 효과 섹션 동기화 (path, image, polygon, textbox, circle)
  if (
    objType === "path" ||
    objType === "image" ||
    objType === "polygon" ||
    objType === "textbox" ||
    objType === "circle" ||
    objType === "rect"
  ) {
    const opacityInput = document.querySelector(
      `${editor.containerSelector} .toolpanel#select-panel .effect-section #opacity`
    );
    opacityInput.value = editor.activeSelection.opacity ?? 1;
  }
}

export { selectionSettings, syncPanelWithSelection };
