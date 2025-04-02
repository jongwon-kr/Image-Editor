import { mapArea } from "../api/data/mapArea.js";
import { retBackMapUrl } from "../api/retBackMapUrl.js";
import { resizeImg } from "../utils/resizeImg.js";
import {
  generateFabricGradientFromColorStops,
  getFilteredNoFocusObjects,
} from "../utils/utils.js";

function canvasSettings() {
  const _self = this;
  let width = 1280;
  let height = 720;

  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel visible" id="background-panel"><div class="content"><p class="title">캔버스 설정</p></div></div>`
  );

  // Canvas Size Section
  const initCanvasSizeSection = () => {
    const bgPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="canvas-size-setting">
          <p>캔버스 크기</p>
          <div class="input-container">
            <label>너비</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="100" id="input-width" value="${width}"/>
              <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>높이</label>
            <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="100" id="input-height" value="${height}"/>
              <button class="increase">+</button>
            </div>
          </div>
        </div>
      `
    );

    const setDimension = () => {
      try {
        const width = parseInt(
          document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-width`
          ).value,
          10
        );
        const height = parseInt(
          document.querySelector(
            `${this.containerSelector} .toolpanel#background-panel .content #input-height`
          ).value,
          10
        );
        _self.canvas.setWidth(width);
        _self.canvas.originalW = width;
        _self.canvas.setHeight(height);
        _self.canvas.originalH = height;
        _self.canvas.renderAll();
        _self.canvas.fire("object:modified");
      } catch (_) {}
    };

    document
      .querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content #input-width`
      )
      .addEventListener("change", setDimension);

    document
      .querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content #input-height`
      )
      .addEventListener("change", setDimension);
  };

  // Background Color and Gradient Section
  const initBackgroundSection = () => {
    const bgPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="color-settings">
          <div class="tab-container">
            <div class="tabs">
              <div class="tab-label" data-value="color-fill">색채우기</div>
              <div class="tab-label" data-value="gradient-fill">그라데이션</div>
            </div>
            <div class="tab-content" data-value="color-fill">
              <input id="color-picker" value="black"/><br>
            </div>
            <div class="tab-content" data-value="gradient-fill">
              <div id="gradient-picker"></div>
              <div class="gradient-orientation-container">
                <div class="input-container">
                  <label>방향</label>
                  <select id="select-orientation">
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                <div id="angle-input-container" class="input-container">
                  <label>각도</label>
                  <div class="custom-number-input">
                    <button class="decrease">-</button>
                    <input type="number" min="0" max="360" value="0" id="input-angle">
                    <button class="increase">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <p class="title">배경화면 설정</p>
            <div id="set-canvas-background-image">
              <input type="file" id="fileInput" accept="image/*" style="display:none;">
              <span>미리보기</span>
              <img id="background-img" src="">
              <div id="set-background-tab">
                <div class="input-container">
                  <label>배경 이미지</label>
                  <div class="custom-option">
                    <button id="select-background-img-btn" class="btn_w">파일 첨부</button>
                  </div>
                </div>
                <div class="input-container">
                  <label style="width:20%;">주제도</label>
                  <div class="custom-option">
                    <select id="select-background-map-area">
                      <option value="EASIA" selected>동아시아</option>
                      <option value="KOR">한반도 전체</option>
                      <option value="SKOR">한반도</option>
                    </select>
                    <select id="select-background-map-type">
                      <option value="IMG" selected>위성사진</option>
                      <option value="WC">주제도</option>
                    </select>
                    <button id="get-background-img-btn" class="btn_w">조회</button>
                  </div>
                </div>
                <button id="set-background-img-btn" class="btn_g">배경화면 적용</button>
              </div>
            </div>
          </div>
        </div>
      `
    );

    // Tab switching logic
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .tab-label`
      )
      .forEach((tab) => {
        tab.addEventListener("click", function () {
          document
            .querySelectorAll(
              `${_self.containerSelector} .toolpanel#background-panel .content .tab-label`
            )
            .forEach((label) => label.classList.remove("active"));

          this.classList.add("active");

          const target = this.getAttribute("data-value");

          this.closest(".tab-container")
            .querySelectorAll(".tab-content")
            .forEach((content) => (content.style.display = "none"));

          const targetContent = this.closest(".tab-container").querySelector(
            `.tab-content[data-value="${target}"]`
          );
          if (targetContent) {
            targetContent.style.display = "block";
          }

          if (target === "color-fill") {
            const colorPicker = document.querySelector(
              `${_self.containerSelector} .toolpanel#background-panel .content #color-picker`
            );
            if (colorPicker) {
              const color = colorPicker.value;
              try {
                _self.canvas.backgroundColor = color;
                _self.canvas.renderAll();
              } catch (_) {
                console.log("Can't update background color");
              }
            }
          } else {
            updateGradientFill();
          }
        });
      });

    // Fire initial tab
    const colorFillTab = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content .tab-label[data-value="color-fill"]`
    );
    if (colorFillTab) {
      colorFillTab.click();
    }

    // Color picker initialization with Spectrum
    const colorPicker = $(
      `${this.containerSelector} .toolpanel#background-panel .content #color-picker`
    );
    colorPicker.spectrum({
      flat: true,
      showPalette: false,
      showButtons: false,
      type: "color",
      showInput: "true",
      allowEmpty: "false",
      move: function (color) {
        const hex = color ? color.toRgbString() : "transparent";
        _self.canvas.backgroundColor = hex;
        _self.canvas.renderAll();
      },
    });

    // Gradient picker initialization with Grapick
    const gp = new Grapick({
      el: `${this.containerSelector} .toolpanel#background-panel .content #gradient-picker`,
      colorEl: '<input id="colorpicker"/>',
    });

    gp.setColorPicker((handler) => {
      const el = handler.getEl().querySelector("#colorpicker");
      $(el).spectrum({
        showPalette: false,
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        color: handler.getColor(),
        showAlpha: true,
        change(color) {
          handler.setColor(color.toRgbString());
        },
        move(color) {
          handler.setColor(color.toRgbString(), 0);
        },
      });
    });

    gp.addHandler(0, "red");
    gp.addHandler(100, "blue");

    // Update gradient fill
    const updateGradientFill = () => {
      const stops = gp.getHandlers();
      const orientation = document.querySelector(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`
      ).value;
      const angle = parseInt(
        document.querySelector(
          `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`
        ).value,
        10
      );

      const gradient = generateFabricGradientFromColorStops(
        stops,
        _self.canvas.width,
        _self.canvas.height,
        orientation,
        angle
      );
      _self.canvas.setBackgroundColor(gradient);
      _self.canvas.renderAll();
    };

    // Gradient picker change event
    gp.on("change", () => {
      updateGradientFill();
    });

    // Orientation selection
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`
      )
      .forEach((ori) => {
        ori.addEventListener("change", function () {
          const type = this.value;
          const angleInputContainer = this.closest(
            ".gradient-orientation-container"
          ).querySelector("#angle-input-container");
          if (angleInputContainer) {
            angleInputContainer.style.display =
              type === "radial" ? "none" : "block";
          }
          updateGradientFill();
        });
      });

    // Angle input
    document
      .querySelectorAll(
        `${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`
      )
      .forEach((input) => {
        input.addEventListener("change", () => {
          updateGradientFill();
        });
      });

    const backgroundImage = document.querySelector("#background-img");
    const fileInput = document.querySelector("#fileInput");
    const selectBackgroundImageBtn = document.querySelector(
      "#select-background-img-btn"
    );

    let imageBase64 = "";

    selectBackgroundImageBtn.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        imageBase64 = e.target.result;
        resizeImg(imageBase64, 240, function (resizedImageUrl) {
          backgroundImage.src = resizedImageUrl;
        });
      };

      reader.readAsDataURL(file);
    });

    const selectedMapArea = {};

    const selectBackgroundMapArea = document.querySelector(
      "#select-background-map-area"
    );
    selectBackgroundMapArea.addEventListener("change", (e) => {
      const selectedArea = mapArea.filter(
        (o) => o.mapRange === e.target.value
      )[0];
      selectedMapArea.stLon = selectedArea.stLon;
      selectedMapArea.stLat = selectedArea.stLat;
      selectedMapArea.edLon = selectedArea.edLon;
      selectedMapArea.edLat = selectedArea.edLat;
      selectedMapArea.ZOOMLVL = selectedArea.ZOOMLVL;
    });

    const selectBackgroundMapType = document.querySelector(
      "#select-background-map-type"
    );

    selectBackgroundMapType.addEventListener("change", (e) => {
      const selectedType = e.target.value;
      selectedMapArea.type = selectedType;
    });

    const getBackgroundImageBtn = document.querySelector(
      "#get-background-img-btn"
    );

    getBackgroundImageBtn.addEventListener("click", async () => {
      console.log("주제도 불러오기 버튼 클릭");
      const response = await retBackMapUrl(selectedMapArea);
      const data = await response.blob();
      const reader = new FileReader();
      if (data)
        reader.onload = function (e) {
          imageBase64 = e.target.result;
          resizeImg(imageBase64, 240, function (resizedImageUrl) {
            backgroundImage.src = resizedImageUrl;
          });
        };
      reader.readAsDataURL(data);
    });

    const setBackgroundImageBtn = document.querySelector(
      "#set-background-img-btn"
    );

    setBackgroundImageBtn.addEventListener("click", function () {
      if (!imageBase64) {
        alert("이미지를 선택하세요");
        return;
      }
      URLToImage(imageBase64);
    });
  };

  function URLToImage(imageBase64) {
    if (!imageBase64) return;

    fabric.Image.fromURL(imageBase64, function (img) {
      // 이미지의 원본 크기를 캔버스 크기로 설정
      const imgWidth = img.width;
      const imgHeight = img.height;

      width = imgWidth;
      height = imgHeight;

      // 캔버스 크기 업데이트
      _self.canvas.setWidth(imgWidth);
      _self.canvas.setHeight(imgHeight);
      _self.canvas.originalW = imgWidth;
      _self.canvas.originalH = imgHeight;

      // 입력 필드 값도 업데이트
      document.querySelector(
        `${_self.containerSelector} .toolpanel#background-panel .content #input-width`
      ).value = imgWidth;
      document.querySelector(
        `${_self.containerSelector} .toolpanel#background-panel .content #input-height`
      ).value = imgHeight;

      // 기존 객체 위치 저장
      const objects = getFilteredNoFocusObjects();

      // 뷰포트 초기화
      _self.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // 기본 상태로 초기화 (줌 1, 이동 없음)

      // 배경 이미지 설정
      _self.canvas.setBackgroundImage(img, _self.canvas.renderAll.bind(_self.canvas), {
        scaleX: 1,
        scaleY: 1,
        left: 0,
        top: 0,
      });

      // 객체 위치 재조정
      const prevWidth = _self.canvas.getWidth();
      const prevHeight = _self.canvas.getHeight();
      const widthRatio = imgWidth / prevWidth;
      const heightRatio = imgHeight / prevHeight;

      objects.forEach((obj) => {
        // 이전 뷰포트 변환을 고려한 실제 좌표 계산
        const matrix = _self.canvas.viewportTransform;
        const prevLeft = obj.left * matrix[0] + matrix[4];
        const prevTop = obj.top * matrix[3] + matrix[5];

        // 새로운 크기에 맞춰 좌표 조정
        obj.set({
          left: prevLeft * widthRatio,
          top: prevTop * heightRatio,
          scaleX: (obj.scaleX || 1) * widthRatio,
          scaleY: (obj.scaleY || 1) * heightRatio,
        });
        obj.setCoords(); // 좌표 업데이트
      });

      _self.canvas.renderAll();

      // fitZoom 호출 (선택 사항)
      // if (typeof _self.fitZoom === "function") _self.fitZoom();
    });
  }

  // Initialize both sections
  initCanvasSizeSection();
  initBackgroundSection();
}

export { canvasSettings };