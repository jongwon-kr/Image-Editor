// @ts-nocheck
import { mapArea } from "../api/data/mapArea.js";
import { retForeImgUrl } from "../api/retForeImgUrl.js";
import { retModelImgUrl } from "../api/retModelImgUrl.js";
import { retOceanImgUrl } from "../api/retOceanImgUrl.js";

("use strict");
// 기본 값 동아시아
let selectedMapArea = {};

function weatherData() {
  const _self = this;

  const toolPanel = document.createElement("div");
  toolPanel.classList.add("toolpanel");
  toolPanel.id = "weatherData-panel";

  const content = document.createElement("div");
  content.classList.add("content");

  const title = document.createElement("p");
  title.classList.add("title");
  title.textContent = "기상 자료";
  content.appendChild(title);

  // 필요한 요소 생성
  const inputContainer = document.createElement("div");
  inputContainer.className = "input-container";

  const label = document.createElement("label");
  label.textContent = "영역 선택";

  const options = [
    {
      label: "동아시아",
      value: "EASIA",
    },
    {
      label: "한반도 전체",
      value: "KOR",
    },
    {
      label: "한반도",
      value: "SKOR",
    },
    {
      label: "태풍 영역",
      value: "TYPHOON",
    },
  ];

  const selectBackgroundMapArea = document.createElement("select");
  selectBackgroundMapArea.id = "select-background-map-area";
  options.forEach((data) => {
    const option = document.createElement("option");
    option.value = data.value;
    option.textContent = data.label;
    selectBackgroundMapArea.appendChild(option);
  });

  selectBackgroundMapArea.addEventListener("change", (e) => {
    const selectedArea = mapArea.filter(
      (o) => o.mapRange === e.target.value
    )[0];
    selectedMapArea.mapRange = selectedArea.mapRange;
    // 좌상 경, 위도
    selectedMapArea.stLon = selectedArea.stLon;
    selectedMapArea.stLat = selectedArea.stLat;
    // 우하 경, 위도
    selectedMapArea.edLon = selectedArea.edLon;
    selectedMapArea.edLat = selectedArea.edLat;
    // zoom 레벨
    selectedMapArea.ZOOMLVL = selectedArea.ZOOMLVL;
  });

  inputContainer.appendChild(label);
  inputContainer.appendChild(selectBackgroundMapArea);
  content.appendChild(inputContainer);

  // 탭 컨테이너
  const tabContainer = document.createElement("div");
  tabContainer.classList.add("tab-container");

  // 탭 데이터 정의
  const tabs = [
    { label: "모델 이미지 API", api: retModelImgUrl, id: "모델 이미지" },
    {
      label: "해양 모델 이미지 API",
      api: retOceanImgUrl,
      id: "해양 모델 이미지",
    },
    {
      label: "예측 변수 이미지 API",
      api: retForeImgUrl,
      id: "예측 변수 이미지",
    },
  ];

  let activeTabCnt = 0;

  tabs.forEach((tab) => {
    const tabWrapper = document.createElement("div");
    tabWrapper.classList.add("tab-wrapper");

    const tabButton = document.createElement("button");
    tabButton.textContent = tab.label;
    tabButton.classList.add("tab-button");
    tabButton.classList.add("btn_w");
    tabButton.id = `${tab.id}-button`;

    const tabContent = document.createElement("div");
    tabContent.classList.add("tab-content");
    tabContent.id = `${tab.id}-content`;

    const form = createForm(tab.id, tab.api, _self);
    tabContent.appendChild(form);

    tabButton.addEventListener("click", () => {
      const isActive = tabContent.classList.contains("active");
      if (isActive) {
        activeTabCnt--;
        tabContent.classList.remove("active");
        tabButton.classList.remove("active");
      } else {
        activeTabCnt++;
        if (activeTabCnt > 1) {
          document.querySelectorAll(".tab-content").forEach((element) => {
            element.classList.remove("active");
          });
          document.querySelectorAll(".tab-button").forEach((element) => {
            element.classList.remove("active");
          });
          activeTabCnt--;
        }
        tabContent.classList.add("active");
        tabButton.classList.add("active");
      }
    });

    tabWrapper.appendChild(tabButton);
    tabWrapper.appendChild(tabContent);
    tabContainer.appendChild(tabWrapper);
  });

  content.appendChild(tabContainer);
  toolPanel.appendChild(content);
  document
    .querySelector(`${this.containerSelector} .main-panel`)
    .appendChild(toolPanel);
}

function createForm(tabId, apiService, _self) {
  const form = document.createElement("form");
  form.classList.add("api-form");

  let fields = [];
  if (tabId === "모델 이미지") {
    fields = [
      {
        label: "모델",
        name: "modl",
        type: "select",
        options: ["GDAPS_KIM", "RDAPS", "LDAPS"],
      },
      {
        label: "자료 구분",
        name: "varGrp",
        type: "select",
        options: ["PRSS_HGT", "UNIS_SFC"],
      },
      { label: "변수", name: "var", type: "select", options: ["HGT", "TMP"] },
      {
        label: "연직층",
        name: "lev",
        type: "select",
        options: ["1000", "850", "500"],
      },
      {
        label: "분석 시간",
        name: "analTime",
        type: "text",
        value: "201905180000",
      },
      {
        label: "예측 시간",
        name: "foreTime",
        type: "text",
        value: "201905180000",
      },
      {
        label: "스무딩 레벨",
        name: "basicSmtLvl",
        type: "select",
        options: ["1", "2", "3", "4"],
      },
    ];
  } else if (tabId === "해양 모델 이미지") {
    fields = [
      {
        label: "모델 그룹",
        name: "modlGrp",
        type: "select",
        options: ["GWW", "RWW"],
      },
      {
        label: "상세 모델",
        name: "modl",
        type: "select",
        options: ["GWW3", "ECMWF_HWAM"],
      },
      {
        label: "변수",
        name: "var",
        type: "select",
        options: ["WSPD_SNW", "WVHGT"],
      },
      {
        label: "분석 시간",
        name: "analTime",
        type: "text",
        value: "201705110000",
      },
      {
        label: "예측 시간",
        name: "foreTime",
        type: "text",
        value: "201705110000",
      },
    ];
  } else if (tabId === "예측 변수 이미지") {
    fields = [
      {
        label: "자료 그룹",
        name: "varGrp",
        type: "select",
        options: ["UNIS_SFC_WBT", "INSTB_IDX"],
      },
      { label: "변수", name: "var", type: "select", options: ["WBT", "CAPE"] },
      {
        label: "모델",
        name: "modl",
        type: "select",
        options: ["GDAPS_KIM", "RDAPS"],
      },
      { label: "연직층", name: "lev", type: "select", options: ["2", "850"] },
      {
        label: "분석 시간",
        name: "analTime",
        type: "text",
        value: "201905180000",
      },
      {
        label: "예측 시간",
        name: "foreTime",
        type: "text",
        value: "201905180000",
      },
    ];
  }

  // 여기서 form 요소들의 요청 파라미터변수를 저장해두고 아래 click부분에서 사용해야할듯
  fields.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    const input =
      field.type === "select"
        ? createSelect(field.name, field.options)
        : createInput(field.name, field.value);
    form.appendChild(label);
    form.appendChild(input);
  });

  const addButton = document.createElement("button");
  addButton.classList.add("btn_g");
  addButton.textContent = "추가";
  addButton.type = "button";
  addButton.addEventListener("click", async () => {
    const params = new FormData(form);
    const keys = Array.from(params.keys());

    keys.forEach((key) => {
      selectedMapArea[key] = params.get(key);
    });

    // 여기서 params값이랑 selectedMapArea의 값을 병합이 되면 아래 fetchData가 정상적으로 수행할듯
    const selectedMapAreaParams = new URLSearchParams({
      ...Object.assign({}, selectedMapArea),
    });

    const data = await fetchData(
      apiService,
      Object.fromEntries(selectedMapAreaParams)
    );
    if (data) {
      addImageToCanvas(data, tabId, _self);
    }
    selectedMapArea = {};
  });
  form.appendChild(addButton);
  return form;
}

// 나머지 함수들 (변경 없음)
function createSelect(name, options) {
  const select = document.createElement("select");
  select.name = name;
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
  return select;
}

function createInput(name, value) {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value || "";
  return input;
}

async function fetchData(apiService, params) {
  const response = await apiService(params);
  const result = {
    image: await response.image.blob(),
    params: response.params,
    apiType: response.apiType,
  };
  return result;
}
function addImageToCanvas(data, label, _self) {
  const reader = new FileReader();
  reader.onload = async function (e) {
    const addDataURL = e.target.result;
    const tempZoom = _self.canvas.getZoom();
    _self.fitZoom();
    await fabric.Image.fromURL(addDataURL, function (img) {
      img.set({
        label: label,
        left: 0,
        top: 0,
        scaleX: _self.canvas.width / img.width,
        scaleY: _self.canvas.height / img.height,
        selectable: false,
        evented: false,
        noFocusing: true,
        overlayImage: true,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        hasControls: false,
        params: data.params,
        apiType: data.apiType,
      });
      _self.canvas.add(img);
      _self.applyZoom(tempZoom);
      _self.canvas.renderAll();
    });
  };
  reader.readAsDataURL(data.image);
}

export { weatherData };
