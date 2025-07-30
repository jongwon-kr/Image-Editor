// @ts-nocheck
import { mapArea } from "../api/data/mapArea.js";
import { setBackMapImg, getBackMapImg } from "../api/retBackMapUrl.js";
import { resizeImg } from "../utils/resizeImg.js";
import { load } from "../utils/saveEdit.js";
import { getDeleteArea, getFilteredNoFocusObjects } from "../utils/utils.js";

let cachedKoreaGeoJSON = null;
let cachedAsiaGeoJSON = null;
let selectedOptions = [];
let selectedMapArea = {};
let selectedMapRange = "D1";

async function loadKoreaGeoJSON() {
  if (!cachedKoreaGeoJSON) {
    const response = await fetch("/ias/js/wgc/json/fine_kr.json");
    cachedKoreaGeoJSON = await response.json();
  }
  return cachedKoreaGeoJSON;
}

async function loadAsisGeoJSON() {
  if (!cachedAsiaGeoJSON) {
    const response = await fetch("/ias/js/wgc/json/east_asia.json");
    cachedAsiaGeoJSON = await response.json();
  }
  return cachedAsiaGeoJSON;
}

function canvasSettings() {
  const _self = this;
  const loadCanvasData = load("canvasEditor");
  let width = 1280;
  let height = 720;
  if (loadCanvasData) {
    width = loadCanvasData.width ? parseInt(loadCanvasData.width) : 1280;
    height = loadCanvasData.height ? parseInt(loadCanvasData.height) : 720;
  }

  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel visible" id="background-panel"><div class="content"><p class="title">캔버스 설정</p></div></div>`
  );

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

    const widthInput = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content #input-width`
    );
    const heightInput = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content #input-height`
    );

    _self.updateInputFields = function () {
      if (widthInput && heightInput) {
        widthInput.value = Math.round(_self.canvas.getWidth());
        heightInput.value = Math.round(_self.canvas.getHeight());
      }
    };

    const setDimension = () => {
      try {
        const newWidth = parseInt(widthInput.value, 10);
        const newHeight = parseInt(heightInput.value, 10);
        if (
          isNaN(newWidth) ||
          isNaN(newHeight) ||
          newWidth < 100 ||
          newHeight < 100
        ) {
          return;
        }
        _self.canvas.setWidth(newWidth);
        _self.canvas.originalW = newWidth;
        _self.canvas.setHeight(newHeight);
        _self.canvas.originalH = newHeight;
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
        updateInputFields();
      } catch (_) {}
    };

    widthInput.addEventListener("change", setDimension);
    heightInput.addEventListener("change", setDimension);

    const decreaseButtons = document.querySelectorAll(
      `${this.containerSelector} .toolpanel#background-panel .content .decrease`
    );
    const increaseButtons = document.querySelectorAll(
      `${this.containerSelector} .toolpanel#background-panel .content .increase`
    );

    decreaseButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const input = e.target.nextElementSibling;
        let value = parseInt(input.value, 10);
        if (value > 100) {
          input.value = value - 10;
        }
      });
    });

    increaseButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const input = e.target.previousElementSibling;
        let value = parseInt(input.value, 10);
        input.value = value + 10;
      });
    });
  };

  const initBackgroundSection = () => {
    const bgColorPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgColorPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="color-settings">
          <div class="input-container"><label>배경 색상</label>
            <input id="color-picker" value="transparent">
          </div>
        </div>
      `
    );

    const colorPicker = $(
      `${this.containerSelector} .toolpanel#background-panel .content #color-picker`
    );
    colorPicker.spectrum({
      showPalette: false,
      showButtons: false,
      type: "color",
      showInput: true,
      allowEmpty: true,
      move: function (color) {
        const hex = color ? color.toRgbString() : "transparent";
        _self.canvas.backgroundColor = hex;
        _self.canvas.renderAll();
      },
    });

    const bgPanelContent = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content`
    );
    bgPanelContent.insertAdjacentHTML(
      "beforeend",
      `
        <p class="title">배경 이미지 설정</p>
        <div class="bg-settings">
          <div id="set-canvas-background-image">
            <input type="file" id="fileInput" accept="image/*" style="display:none;">
            <div id="set-background-tab">
              <div class="input-container">
                <label>배경 이미지</label>
                <div class="custom-option">
                  <button id="select-background-img-btn" class="btn_w">파일 첨부</button>
                </div>
              </div>
              <div class="input-container">
                <label style="width:30%;">주제도</label>
                <div class="custom-option">
                  <div style="white-space: nowrap; margin-bottom: 2px;">
                    <label>범위</label>
                    <select id="select-background-map-area">
                      <option value="D1" selected>남한S</option>
                      <option value="EASIA">동아시아</option>
                      <option value="KOR">한반도 전체</option>
                      <option value="SKOR">한반도</option>
                    </select>
                  </div>
                  <div style="white-space: nowrap;">
                    <label>종류</label>
                    <select id="select-background-map-type">
                      <option value="GRP_SL" selected>백지도</option>
                      <option value="IMG">위성사진</option>
                      <option value="SRI">음영기복도</option>
                      <option value="LAC">토지피복도</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="input-container">
                <label>주제도 옵션</label>
                <button id="set-background-option-btn" class="btn_w">주제도 옵션 선택</button>
              </div>
              <div class="input-container">
                <label for="korea-line">한반도 라인</label>
                <label class="toggle-wrapper">
                  <input type="checkbox" id="korea-line" name="korea-line">
                  <span class="slider"></span>
                </label>
              </div>
              <div class="input-container">
                <label for="east-asia-line">해안선 라인</label>
                <label class="toggle-wrapper">
                  <input type="checkbox" id="east-asia-line" name="east-asia-line">
                  <span class="slider"></span>
                </label>
              </div>
              <div class="input-container">
                <label for="grid-img">경위도 라인</label>
                <label class="toggle-wrapper">
                  <input type="checkbox" id="grid-img" name="grid-img">
                  <span class="slider"></span>
                </label>
              </div>
              <div class="input-container">
                <label>경위도선</label>
                <div class="custom-option">
                  <div style="white-space: nowrap; margin-bottom: 2px;">
                      <label>색상</label>
                      <select id="contour-line-color">
                        <option value="0x000000" selected>검정</option>
                        <option value="0xFF0000">빨강</option>
                        <option value="0x0000FF">파랑</option>
                      </select>
                  </div>
                  <div style="white-space: nowrap; margin-bottom: 2px;">
                      <label>종류</label>
                      <select id="contour-line-div">
                        <option value="A" selected>실선</option>
                        <option value="D">짧은 점선</option>
                        <option value="H">긴 점선</option>
                      </select>
                  </div>
                  <div style="white-space: nowrap;">
                    <label>두께</label>
                    <select id="contour-line-thck">
                      <option value="1" selected>1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                </div>
              </div>
              <button id="get-background-img-btn" class="btn_b">조회</button>
              <p>미리보기</p>
              <img id="background-img" src="">
              <button id="set-background-img-btn" class="btn_g">배경화면 적용</button>
            </div>
          </div>
        </div>
        <div id="background-option-modal" class="absolute bg-white p-6 rounded-lg w-96 shadow-lg hidden z-10">
          <div id="option-checkboxes" class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" value="GRP_WC" class="mr-2"> 국가경계
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="SD" class="mr-2"> 도경계
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="SGG_KOR" class="mr-2"> 시군구경계
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="EMD_KOR" class="mr-2"> 행정동경계
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="ROD" class="mr-2"> 도로
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="RAL" class="mr-2"> 철도
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="RIV" class="mr-2"> 강/하천
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="PK" class="mr-2"> 국립공원경계
            </label>
            <label class="flex items-center">
              <input type="checkbox" value="WRN_LINE" class="mr-2" checked> 특보구역
            </label>
          </div>
        </div>
      `
    );

    const backgroundImage = document.querySelector("#background-img");
    const fileInput = document.querySelector("#fileInput");
    const selectBackgroundImageBtn = document.querySelector(
      "#select-background-img-btn"
    );

    const widthInput = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content #input-width`
    );
    const heightInput = document.querySelector(
      `${this.containerSelector} .toolpanel#background-panel .content #input-height`
    );

    const updateInputFields = () => {
      widthInput.value = Math.round(_self.canvas.getWidth());
      heightInput.value = Math.round(_self.canvas.getHeight());
    };

    let imageBase64 = "";
    let gridImageBase64 = "";
    let gridResponse;

    const initSelectedMapArea = () => {
      const defaultArea =
        mapArea.find((o) => o.mapRange === "D1") || mapArea[0];
      selectedMapRange = defaultArea.mapRange;
      selectedMapArea.stLon = defaultArea.stLon;
      selectedMapArea.stLat = defaultArea.stLat;
      selectedMapArea.edLon = defaultArea.edLon;
      selectedMapArea.edLat = defaultArea.edLat;
      selectedMapArea.ZOOMLVL = defaultArea.ZOOMLVL;
      selectedMapArea.type =
        document.querySelector("#select-background-map-type").value || "IMG";
    };
    initSelectedMapArea();

    if (selectedMapArea.type === "GRP_SL") {
      if (!selectedOptions.includes("GRP_WC")) {
        selectedOptions.push("GRP_WC");
      }
    }

    if (selectedMapArea.type === "GRP_SL" && selectedMapRange === "D1") {
      if (!selectedOptions.includes("WRN_LINE")) {
        selectedOptions.push("WRN_LINE");
      }
    }

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

    const selectBackgroundMapArea = document.querySelector(
      "#select-background-map-area"
    );
    selectBackgroundMapArea.addEventListener("change", (e) => {
      const selectedArea = mapArea.find((o) => o.mapRange === e.target.value);
      if (selectedArea) {
        selectedMapRange = selectedArea.mapRange;
        selectedMapArea.mapCode = selectedArea.mapCode;
        selectedMapArea.stLon = selectedArea.stLon;
        selectedMapArea.stLat = selectedArea.stLat;
        selectedMapArea.edLon = selectedArea.edLon;
        selectedMapArea.edLat = selectedArea.edLat;
        selectedMapArea.mdLon = selectedArea.mdLon;
        selectedMapArea.mdLat = selectedArea.mdLat;
        selectedMapArea.ZOOMLVL = selectedArea.ZOOMLVL;
        setBackMapImg(selectedMapArea, selectedOptions);
      }
    });

    const selectBackgroundMapType = document.querySelector(
      "#select-background-map-type"
    );

    selectBackgroundMapType.addEventListener("change", (e) => {
      selectedMapArea.base = e.target.value;
      setBackMapImg(selectedMapArea, selectedOptions);
    });

    const setBackgroundOptionBtn = document.querySelector(
      "#set-background-option-btn"
    );

    setBackgroundOptionBtn.addEventListener("click", () => {
      openBackgroundOptionModal();
    });

    const setKoreaLineBtn = document.querySelector("#korea-line");

    setKoreaLineBtn.addEventListener("click", (e) => {
      if (e.target.checked) {
        selectedOptions.push("KOREA_LINE");
      } else {
        selectedOptions = selectedOptions.filter(
          (item) => item !== "KOREA_LINE"
        );
      }
      setBackMapImg(selectedMapArea, selectedOptions);
    });

    const setAsiaLineBtn = document.querySelector("#east-asia-line");

    setAsiaLineBtn.addEventListener("click", (e) => {
      if (e.target.checked) {
        selectedOptions.push("ASIA_LINE");
      } else {
        selectedOptions = selectedOptions.filter(
          (item) => item !== "ASIA_LINE"
        );
      }
      setBackMapImg(selectedMapArea, selectedOptions);
    });

    const setGridLineBtn = document.querySelector("#grid-img");

    const contourLineColor = document.querySelector("#contour-line-color");
    const contourLineDiv = document.querySelector("#contour-line-div");
    const contourLineThck = document.querySelector("#contour-line-thck");

    setGridLineBtn.addEventListener("click", (e) => {
      if (e.target.checked) {
        selectedOptions.push("GRID_LINE");
        selectedMapArea = {
          ...selectedMapArea,
          contourLineColor: contourLineColor.value,
          contourLineDiv: contourLineDiv.value,
          contourLineThck: contourLineThck.value,
        };
      } else {
        selectedOptions = selectedOptions.filter(
          (item) => item !== "GRID_LINE"
        );
      }

      setBackMapImg(selectedMapArea, selectedOptions);
    });

    contourLineColor.addEventListener("change", changeGridLineOption);
    contourLineDiv.addEventListener("change", changeGridLineOption);
    contourLineThck.addEventListener("change", changeGridLineOption);

    function changeGridLineOption() {
      if (setGridLineBtn.checked) {
        selectedMapArea = {
          ...selectedMapArea,
          contourLineColor: contourLineColor.value,
          contourLineDiv: contourLineDiv.value,
          contourLineThck: contourLineThck.value,
        };
      }
      setBackMapImg(selectedMapArea, selectedOptions);
    }

    const getBackgroundImageBtn = document.querySelector(
      "#get-background-img-btn"
    );

    getBackgroundImageBtn.addEventListener("click", async () => {
      if (!selectedMapArea.stLon) {
        initSelectedMapArea();
      }
      _self.applyZoom(1);

      //_self.canvas.setWidth(1280);
      //_self.canvas.setHeight(705);
      updateInputFields();

      const response = await getBackMapImg();
      selectedMapArea.type = selectedMapArea.type.split(",")[0];
      if (response) {
        imageBase64 = response;

        let combinedImage = imageBase64;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const bgImg = new Image();
        bgImg.src = imageBase64;

        bgImg.onload = async () => {
          canvas.width = bgImg.width;
          canvas.height = bgImg.height;
          ctx.drawImage(bgImg, 0, 0);

          combinedImage = canvas.toDataURL("image/png");
          resizeImg(combinedImage, 240, function (resizedImageUrl) {
            backgroundImage.src = resizedImageUrl;
          });
          imageBase64 = combinedImage;
        };
        //reader.readAsDataURL(data);
      }
    });

    const setBackgroundImageBtn = document.querySelector(
      "#set-background-img-btn"
    );

    setBackgroundImageBtn.addEventListener("click", function () {
      if (!imageBase64) {
        alert("이미지를 선택하세요");
        return;
      }
      getDeleteArea().forEach((o) => {
        _self.canvas.remove(o);
      });
      URLToImage(imageBase64);
      _self.applyZoom(1);
    });

    initSelectedMapArea();
  };

  async function URLToImage(imageBase64) {
    if (!imageBase64) return;

    await fabric.Image.fromURL(imageBase64, function (img) {
      const imgWidth = img.width;
      const imgHeight = img.height;

      let canvasWidth, canvasHeight, scaleX, scaleY;

      const isThematicMapImage = imageBase64.includes("data:image/png");
      if (isThematicMapImage) {
        // if (imgWidth >= 1280) {
        //   canvasWidth = 1280;
        //   scaleX = canvasWidth / imgWidth;
        //   scaleY = scaleX;
        //   canvasHeight = Math.round(imgHeight * scaleY);
        // } else {
        canvasWidth = imgWidth;
        canvasHeight = imgHeight;
        scaleX = 1;
        scaleY = 1;
        // }
      } else {
        canvasWidth =
          parseInt(
            document.querySelector(
              `${_self.containerSelector} .toolpanel#background-panel .content #input-width`
            ).value,
            10
          ) || imgWidth;
        canvasHeight =
          parseInt(
            document.querySelector(
              `${_self.containerSelector} .toolpanel#background-panel .content #input-height`
            ).value,
            10
          ) || imgHeight;

        // if (imgWidth > 1280 || imgHeight > 720) {
        //   scaleX = canvasWidth / imgWidth;
        //   scaleY = canvasHeight / imgHeight;
        //   const scale = Math.min(scaleX, scaleY);
        //   canvasWidth = imgWidth * scale;
        //   canvasHeight = imgHeight * scale;
        //   scaleX = scale;
        //   scaleY = scale;
        // } else {
        canvasWidth = imgWidth;
        canvasHeight = imgHeight;
        scaleX = 1;
        scaleY = 1;
        // }
      }

      _self.canvas.setWidth(canvasWidth);
      _self.canvas.setHeight(canvasHeight);
      _self.canvas.originalW = canvasWidth;
      _self.canvas.originalH = canvasHeight;

      const widthInput = document.querySelector(
        `${_self.containerSelector} .toolpanel#background-panel .content #input-width`
      );
      const heightInput = document.querySelector(
        `${_self.containerSelector} .toolpanel#background-panel .content #input-height`
      );
      widthInput.value = Math.round(canvasWidth);
      heightInput.value = Math.round(canvasHeight);

      const objects = getFilteredNoFocusObjects();

      _self.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      _self.canvas.setBackgroundImage(
        img,
        _self.canvas.renderAll.bind(_self.canvas),
        {
          scaleX: scaleX,
          scaleY: scaleY,
          left: 0,
          top: 0,
        }
      );

      const prevWidth = _self.canvas.getWidth();
      const prevHeight = _self.canvas.getHeight();
      const widthRatio = canvasWidth / prevWidth;
      const heightRatio = canvasHeight / prevHeight;

      objects.forEach((obj) => {
        const matrix = _self.canvas.viewportTransform;
        const prevLeft = obj.left * matrix[0] + matrix[4];
        const prevTop = obj.top * matrix[3] + matrix[5];

        obj.set({
          left: prevLeft * widthRatio,
          top: prevTop * heightRatio,
          scaleX: (obj.scaleX || 1) * widthRatio,
          scaleY: (obj.scaleY || 1) * heightRatio,
        });
        obj.setCoords();
      });

      _self.canvas.renderAll();
    });
  }

  async function addKoreaLine(ctx, canvasWidth, canvasHeight, selectedMapArea) {
    const projection = getProjection(
      canvasWidth,
      canvasHeight,
      selectedMapArea
    );
    const path = d3.geoPath().projection(projection).context(ctx);

    const data = await loadKoreaGeoJSON();
    ctx.beginPath();
    path(data);
    ctx.strokeStyle = "#FFF200";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  async function addAsiaLine(ctx, canvasWidth, canvasHeight, selectedMapArea) {
    const projection = getProjection(
      canvasWidth,
      canvasHeight,
      selectedMapArea
    );
    const path = d3.geoPath().projection(projection).context(ctx);

    const data = await loadAsisGeoJSON();
    ctx.beginPath();
    path(data);
    ctx.strokeStyle = "#FFF200";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function getProjection(canvasWidth, canvasHeight, selectedMapArea) {
    const bounds = [
      [
        selectedMapArea.stLon ||
          mapArea.find((o) => o.mapRange === "D1")?.stLon,
        selectedMapArea.stLat ||
          mapArea.find((o) => o.mapRange === "D1")?.stLat,
      ],
      [
        selectedMapArea.edLon ||
          mapArea.find((o) => o.mapRange === "D1")?.edLon,
        selectedMapArea.edLat ||
          mapArea.find((o) => o.mapRange === "D1")?.edLat,
      ],
    ];

    const zoomLvl = selectedMapArea.ZOOMLVL;
    let translateOffset = [1258.7522928427825, 1033.3339590292267];
    let scale = 905.6070538750633;
    if (zoomLvl === 7) {
      translateOffset = [1258.7522928427825 - 226, 1033.3339590292267 + 198];
      scale = 1050.6070538750633;
    } else if (zoomLvl === 11) {
      translateOffset = [1160.032049983314 - 135, 2287.3885152660046 + 241];
      scale = 2870.2714151194205;
    } else if (zoomLvl === 12) {
      translateOffset = [899.81541826793 - 100, 3242.699947011538 + 197];
      scale = 4400.40702632594;
    } else if (zoomLvl === 13) {
      translateOffset = [639.81541826793 - 418, 5700.699947011538 + 462];
      scale = 8755.824151297676;
    }

    const projection = d3
      .geoConicConformal()
      .rotate([-126, 0])
      .fitSize([canvasWidth, canvasHeight], {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [bounds[0][0], bounds[0][1]],
                  [bounds[1][0], bounds[0][1]],
                  [bounds[1][0], bounds[1][1]],
                  [bounds[0][0], bounds[1][1]],
                  [bounds[0][0], bounds[0][1]],
                ],
              ],
            },
          },
        ],
      })
      .scale(scale)
      .translate(translateOffset);

    return projection;
  }

  function openBackgroundOptionModal() {
    const modal = document.querySelector("#background-option-modal");
    const button = document.querySelector("#set-background-option-btn");
    const backgroundPanel = document.querySelector(
      "#background-panel .content"
    );

    if (!modal || !button || !backgroundPanel) {
      console.warn("Required elements not found:", {
        modal,
        button,
        backgroundPanel,
      });
      return;
    }

    modal.classList.toggle("active");
    button.classList.toggle("active");

    const updateModalPosition = () => {
      if (!modal.classList.contains("active")) return;

      const buttonRect = button.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let topOffset = buttonRect.bottom + 2;
      let leftOffset = buttonRect.left;

      modal.style.position = "fixed";
      modal.style.top = `${topOffset}px`;
      modal.style.left = `${leftOffset}px`;

      if (leftOffset + modalRect.width > viewportWidth) {
        leftOffset = viewportWidth - modalRect.width - 5;
        modal.style.left = `${Math.max(5, leftOffset)}px`;
      }
      if (leftOffset < 0) {
        modal.style.left = "5px";
      }
      if (topOffset + modalRect.height > viewportHeight) {
        topOffset = buttonRect.top - modalRect.height - 2;
        modal.style.top = `${Math.max(5, topOffset)}px`;
      }
    };

    const handleAnimationEnd = () => {
      updateModalPosition();
      modal.removeEventListener("animationend", handleAnimationEnd);
    };

    if (modal.classList.contains("active")) {
      modal.addEventListener("animationend", handleAnimationEnd);
      updateModalPosition();
    }

    let rafId;
    const scrollHandler = () => {
      if (modal.classList.contains("active")) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateModalPosition);
      } else {
        backgroundPanel.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("resize", scrollHandler);
      }
    };

    backgroundPanel.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("resize", scrollHandler);
    backgroundPanel.addEventListener("scroll", scrollHandler);
    window.addEventListener("resize", scrollHandler);

    const closeModalHandler = () => {
      if (!modal.classList.contains("active")) {
        backgroundPanel.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("resize", scrollHandler);
        window.removeEventListener("click", clickOutsideHandler);
        modal.removeEventListener("transitionend", closeModalHandler);
      }
    };
    modal.addEventListener("transitionend", closeModalHandler);

    const clickOutsideHandler = (event) => {
      if (
        !modal.contains(event.target) &&
        !button.contains(event.target) &&
        modal.classList.contains("active")
      ) {
        modal.classList.remove("active");
        button.classList.remove("active");
      }
    };

    document.removeEventListener("click", clickOutsideHandler);
    document.addEventListener("click", clickOutsideHandler);

    const checkboxes = document.querySelectorAll(
      "#option-checkboxes input[type='checkbox']"
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectedOptions.includes(checkbox.value);

      if (selectedMapArea.type === "GRP_SL") {
        if (!selectedOptions.includes("GRP_WC")) {
          selectedOptions.push("GRP_WC");
        }
      }

      if (
        selectedMapArea.type === "GRP_SL" &&
        selectedMapRange === "D1" &&
        checkbox.value === "WRN_LINE"
      ) {
        checkbox.checked = true;
        if (!selectedOptions.includes("WRN_LINE")) {
          selectedOptions.push("WRN_LINE");
        }
      }
    });

    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", handleCheckboxChange);
      checkbox.addEventListener("change", handleCheckboxChange);
    });
  }

  function handleCheckboxChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
      if (!selectedOptions.includes(value)) {
        selectedOptions.push(value);
      }
    } else {
      selectedOptions = selectedOptions.filter((option) => option !== value);
    }
    setBackMapImg(selectedMapArea, selectedOptions);
  }

  initCanvasSizeSection();
  initBackgroundSection();
}

export { canvasSettings };
