"use strict";

import {
  retWgcEdit,
  deleteWgcEdit,
  saveWgcEdit,
  getFileData,
} from "../api/wgcApiService.js";
import { imgEditor } from "../index.ts";
import { resizeImg } from "../utils/resizeImg.js";

const currentUsr = currentUserId;

let EditDataList = [];
let currentPage = 1;
const itemsPerPage = 12;
let isMyData = true;
let myDataButton;
let shareDataButton;
const editDataCache = new Map();
const previewCache = new Map();

async function fetchEditDataByFilePath(filePath) {
  if (editDataCache.has(filePath)) {
    return editDataCache.get(filePath);
  }
  try {
    const response = await getFileData({ filePath });
    if (response && response.wgcFileDataVo && response.wgcFileDataVo.data) {
      const editData = response.wgcFileDataVo.data;
      editDataCache.set(filePath, editData);
      return editData;
    } else {
      console.warn(`편집 데이터 조회 실패: filePath=${filePath}`);
      return null;
    }
  } catch (error) {
    console.error(`편집 데이터 로드 실패: filePath=${filePath}`, error);
    return null;
  }
}

async function openEditRepository() {
  await fetchEditData();

  const editRepositoryModal = document.createElement("div");
  editRepositoryModal.classList.add("custom-modal-container");

  const modalOverlay = document.createElement("div");
  modalOverlay.classList.add("modal-overlay");
  modalOverlay.addEventListener("click", closeEditRepository);

  const modalContent = document.createElement("div");
  modalContent.classList.add("custom-modal-content");

  const modalHeader = document.createElement("div");
  modalHeader.classList.add("modal-header");

  const modalLabel = document.createElement("h3");
  modalLabel.classList.add("modal-label");
  modalLabel.textContent = "편집 데이터 저장소";
  modalHeader.appendChild(modalLabel);

  const filterBar = document.createElement("div");
  filterBar.id = "filter-bar";

  const categories = [
    { name: "my-data", label: "내 편집 자료" },
    { name: "share-data", label: "공유 편집 자료" },
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
      await getFilteredDataByCategory(category.name, e.currentTarget);
    });
    selectCategoryTab.appendChild(selectCategoryButton);
  });

  filterBar.appendChild(selectCategoryTab);

  const searchBar = document.createElement("input");
  searchBar.type = "text";
  searchBar.placeholder = "검색어를 입력해주세요.";
  searchBar.classList.add("search-bar");
  searchBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      filterDataBySearch(e.target.value);
    }
  });
  filterBar.appendChild(searchBar);

  const editTable = document.createElement("table");
  editTable.classList.add("edit-table");

  const modalFooter = document.createElement("div");
  modalFooter.classList.add("modal-footer");

  const paginationContainer = document.createElement("div");
  paginationContainer.id = "pagination";
  paginationContainer.classList.add("pagination-container");
  modalFooter.appendChild(paginationContainer);

  const modalCloseBtn = document.createElement("div");
  modalCloseBtn.classList.add("close-modal-button");
  const closeButton = document.createElement("button");
  closeButton.textContent = "닫기";
  closeButton.classList.add("btn_g");
  closeButton.addEventListener("click", closeEditRepository);
  modalCloseBtn.appendChild(closeButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalCloseBtn);
  modalContent.appendChild(filterBar);
  modalContent.appendChild(editTable);
  modalContent.appendChild(modalFooter);
  editRepositoryModal.appendChild(modalOverlay);
  editRepositoryModal.appendChild(modalContent);
  document.body.appendChild(editRepositoryModal);

  myDataButton = document.querySelector("#my-data");
  shareDataButton = document.querySelector("#share-data");
  if (myDataButton) {
    myDataButton.classList.add("active");
    await getFilteredDataByCategory("my-data", myDataButton);
  }

  setTimeout(() => {
    editRepositoryModal.classList.add("active");
  }, 10);
}

async function fetchEditData() {
  try {
    const response = await retWgcEdit();
    if (!response || !response.body || !Array.isArray(response.body.editList)) {
      console.warn("retWgcEdit 응답이 유효하지 않습니다:", response);
      EditDataList = [];
    } else {
      const uniqueEdits = new Map();
      response.body.editList.forEach((item) => {
        if (item.editId && item.wkNm && item.filePath) {
          uniqueEdits.set(item.editId, {
            editId: item.editId,
            usrId: item.usrId,
            usrNm: item.usrNm || "Unknown",
            wkNm: item.wkNm,
            filePath: item.filePath,
            fileNm: item.fileNm,
            registDate: new Date(item.registDate),
            shareYn: item.shareYn || "N",
          });
        }
      });
      EditDataList = Array.from(uniqueEdits.values());
    }
  } catch (error) {
    console.error("편집 데이터 조회 실패:", error);
    alert("편집 데이터를 불러오는데 실패했습니다.");
  }
}

function renderEditData(dataList) {
  const editTable = document.querySelector(".edit-table");
  if (!editTable) {
    console.warn("edit-table 요소가 존재하지 않습니다.");
    return;
  }
  editTable.innerHTML = "";

  const headerRow = document.createElement("tr");
  const headers = ["날짜", "등록자", "이름", "미리보기", "관리"];
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  editTable.appendChild(headerRow);

  const sortedData = [...dataList].sort((a, b) => b.registDate - a.registDate);
  const paginationEl = $("#pagination");
  if (!paginationEl.length) {
    console.warn("#pagination 요소가 존재하지 않습니다.");
    return;
  }

  paginationEl.pagination({
    dataSource: sortedData,
    pageSize: itemsPerPage,
    pageRange: 1,
    showPrevious: true,
    showNext: true,
    prevText: "<",
    nextText: ">",
    showPageNumbers: true,
    callback: async function (paginatedData, pagination) {
      editTable
        .querySelectorAll("tr:not(:first-child)")
        .forEach((row) => row.remove());

      const dataPromises = paginatedData.map(async (data) => ({
        data,
        editData: await fetchEditDataByFilePath(data.filePath),
      }));
      const dataResults = await Promise.all(dataPromises);

      dataResults.forEach(({ data, editData }) => {
        const row = document.createElement("tr");
        if (data.usrId === currentUsr) {
          row.classList.add("is-owner");
        }

        const dateCell = document.createElement("td");
        dateCell.textContent = data.registDate.toLocaleDateString();
        row.appendChild(dateCell);

        const ownerCell = document.createElement("td");
        ownerCell.textContent = data.usrNm;
        row.appendChild(ownerCell);

        const titleCell = document.createElement("td");
        titleCell.textContent = data.wkNm;
        row.appendChild(titleCell);

        const previewCell = document.createElement("td");
        const previewWrapper = document.createElement("div");
        const previewButton = document.createElement("button");
        previewButton.textContent = "미리보기";
        previewButton.classList.add("preview-button", "btn_w");
        previewButton.addEventListener("click", () => previewData(data));
        previewWrapper.appendChild(previewButton);
        previewCell.appendChild(previewWrapper);
        row.appendChild(previewCell);

        const manageCell = document.createElement("td");
        const manageWrapper = document.createElement("div");

        if (data.shareYn === "N" || data.usrId === currentUsr) {
          const applyButton = document.createElement("button");
          applyButton.textContent = "선택";
          applyButton.classList.add("apply-button", "btn_w");
          applyButton.addEventListener("click", () => applyData(data));

          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
          deleteButton.classList.add("delete-button", "btn_r");
          deleteButton.addEventListener("click", () => deleteData(data));

          const shareButton = document.createElement("button");
          shareButton.textContent = data.shareYn === "Y" ? "공유해제" : "공유";
          shareButton.classList.add("share-button", "btn_w");
          if (data.shareYn === "Y") {
            shareButton.classList.add("shared");
          }
          shareButton.addEventListener("click", () => shareData(data));

          manageWrapper.appendChild(applyButton);
          manageWrapper.appendChild(deleteButton);
          manageWrapper.appendChild(shareButton);
        } else {
          const applyButton = document.createElement("button");
          applyButton.textContent = "선택";
          applyButton.classList.add("apply-button", "btn_w");
          applyButton.addEventListener("click", () => applyData(data));

          const saveButton = document.createElement("button");
          saveButton.textContent = "담기";
          saveButton.classList.add("save-button", "btn_b");
          saveButton.addEventListener("click", () => saveData(data));

          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = `<svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path fill="white" d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path fill="white" d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path fill="white" d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path fill="white" d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg>`;
          deleteButton.classList.add("delete-button", "btn_r");
          deleteButton.style.display = "none";

          const shareButton = document.createElement("button");
          shareButton.textContent = "공유";
          shareButton.classList.add("share-button", "btn_w");
          shareButton.style.display = "none";

          manageWrapper.appendChild(applyButton);
          manageWrapper.appendChild(saveButton);
          manageWrapper.appendChild(deleteButton);
          manageWrapper.appendChild(shareButton);
        }

        manageCell.appendChild(manageWrapper);
        row.appendChild(manageCell);

        editTable.appendChild(row);
      });

      currentPage = pagination.pageNumber;
    },
  });
}

async function renderFilteredData() {
  let categoryName;
  let categoryBtn;
  if (isMyData) {
    categoryName = "my-data";
    categoryBtn = myDataButton;
  } else {
    categoryName = "share-data";
    categoryBtn = shareDataButton;
  }
  await getFilteredDataByCategory(categoryName, categoryBtn);
}

async function getFilteredDataByCategory(categoryName, target) {
  try {
    if (categoryName === "my-data") {
      isMyData = true;
    } else {
      isMyData = false;
    }

    const filteredData = isMyData
      ? EditDataList.filter((data) => data.usrId === currentUsr)
      : EditDataList.filter((data) => data.shareYn === "Y");
    currentPage = 1;
    renderEditData(filteredData);
    toggleRepoCategory(target);
  } catch (error) {
    console.error("카테고리 필터링 오류:", error);
    alert("카테고리 필터링에 실패했습니다.");
  }
}

function filterDataBySearch(query) {
  let filteredData;
  if (isMyData) {
    filteredData = EditDataList.filter(
      (data) =>
        data.wkNm.toLowerCase().includes(query.toLowerCase()) &&
        data.usrId === currentUsr
    );
  } else {
    filteredData = EditDataList.filter(
      (data) =>
        data.wkNm.toLowerCase().includes(query.toLowerCase()) &&
        data.shareYn === "Y"
    );
  }
  currentPage = 1;
  renderEditData(filteredData);
}

async function previewData(data) {
  const editData = await fetchEditDataByFilePath(data.filePath);
  if (!editData) {
    alert("편집 데이터를 불러올 수 없습니다.");
    return;
  }

  const existingPreview = document.querySelector(".preview-modal");
  if (existingPreview) {
    existingPreview.remove();
    document.querySelector(".preview-modal-overlay").remove();
  }

  const previewModal = document.createElement("div");
  previewModal.classList.add("preview-modal");

  const previewOverlay = document.createElement("div");
  previewOverlay.classList.add("preview-modal-overlay");
  previewOverlay.addEventListener("click", () => {
    previewModal.remove();
    previewOverlay.remove();
  });

  const previewContent = document.createElement("div");
  previewContent.classList.add("preview-content");

  const previewTitle = document.createElement("h4");
  previewTitle.textContent = `미리보기: ${data.wkNm}`;
  previewContent.appendChild(previewTitle);

  const previewInfoSources = document.createElement("img");
  previewEditData(data.filePath, editData, (dataUrl) => {
    resizeImg(dataUrl, 400, function (resizedImageUrl) {
      previewInfoSources.src = resizedImageUrl;
    });
  });
  previewContent.appendChild(previewInfoSources);

  const closePreviewButton = document.createElement("button");
  closePreviewButton.textContent = "닫기";
  closePreviewButton.classList.add("btn_g");
  closePreviewButton.addEventListener("click", () => {
    previewModal.remove();
    previewOverlay.remove();
  });
  previewContent.appendChild(closePreviewButton);

  previewModal.appendChild(previewContent);
  document.body.appendChild(previewOverlay);
  document.body.appendChild(previewModal);
}

async function applyData(data) {
  if (confirm(`"${data.wkNm}"을(를) 적용하시겠습니까?`)) {
    try {
      const editData = await fetchEditDataByFilePath(data.filePath);
      if (!editData) {
        throw new Error("편집 데이터를 가져올 수 없습니다.");
      }
      const parsedData = JSON.parse(editData);
      imgEditor.canvas.clear();

      const viewportTransform = parsedData.viewportTransform || [
        1, 0, 0, 1, 0, 0,
      ];
      const zoomLevel = viewportTransform[0] || 1;

      const canvasWidth = parsedData.width;
      const canvasHeight = parsedData.height;

      imgEditor.canvas.originalW = canvasWidth / zoomLevel;
      imgEditor.canvas.originalH = canvasHeight / zoomLevel;
      imgEditor.canvas.setViewportTransform(viewportTransform);
      imgEditor.applyZoom(zoomLevel);

      const widthInput = document.querySelector(
        `${imgEditor.containerSelector} .toolpanel#background-panel .content #input-width`
      );
      const heightInput = document.querySelector(
        `${imgEditor.containerSelector} .toolpanel#background-panel .content #input-height`
      );
      if (widthInput && heightInput) {
        widthInput.value = Math.round(canvasWidth);
        heightInput.value = Math.round(canvasHeight);
      }

      await imgEditor.canvas.loadFromJSON(parsedData);
      imgEditor.canvas.getObjects().forEach((obj) => {
        if (obj.noFocusing) {
          obj.selectable = false;
          obj.evented = false;
        }
      });

      alert(`"${data.wkNm}" 데이터가 적용되었습니다.`);
      imgEditor.history.clear();

      imgEditor.canvas.fire("object:modified");
      imgEditor.canvas.renderAll();
    } catch (error) {
      console.error("데이터 적용 실패:", error);
      alert("데이터를 적용하는 데 실패했습니다.");
    }
  }
}

async function saveData(data) {
  if (confirm(`"${data.wkNm}"을(를) 저장하시겠습니까?`)) {
    try {
      const editData = await fetchEditDataByFilePath(data.filePath);
      if (!editData) {
        throw new Error("편집 데이터를 가져올 수 없습니다.");
      }
      const newData = {
        usrId: currentUsr,
        wkNm: data.wkNm,
        editData: editData,
        fileNm: data.fileNm,
        registDate: new Date().getTime(),
        shareYn: "N",
      };
      await saveWgcEdit(newData);
      editDataCache.delete(data.filePath);
      previewCache.delete(data.filePath);
      await fetchEditData();
      await renderFilteredData();
      alert(`"${data.wkNm}"을(를) 저장했습니다.`);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("데이터 저장에 실패했습니다.");
    }
  }
}

async function deleteData(data) {
  if (data.usrId !== currentUsr) {
    alert("본인의 데이터만 삭제할 수 있습니다.");
    return;
  }

  if (confirm(`정말로 "${data.wkNm}"을(를) 삭제하시겠습니까?`)) {
    try {
      await deleteWgcEdit({ editId: data.editId });
      EditDataList = EditDataList.filter((item) => item.editId !== data.editId);
      editDataCache.delete(data.filePath);
      previewCache.delete(data.filePath);
      const totalItems = EditDataList.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      } else if (totalPages === 0) {
        currentPage = 1;
      }
      await renderFilteredData();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  }
}

async function shareData(data) {
  if (data.usrId !== currentUsr) {
    alert("본인의 데이터만 공유할 수 있습니다.");
    return;
  }

  if (data.shareYn === "N") {
    if (confirm(`정말로 "${data.wkNm}"을(를) 공유하시겠습니까?`)) {
      try {
        const editData = await fetchEditDataByFilePath(data.filePath);
        if (!editData) {
          throw new Error("편집 데이터를 가져올 수 없습니다.");
        }
        await deleteWgcEdit({ editId: data.editId });
        await saveWgcEdit({ ...data, editData, shareYn: "Y" });
        editDataCache.delete(data.filePath);
        previewCache.delete(data.filePath);
        await fetchEditData();
        await renderFilteredData();
      } catch (error) {
        console.error("공유 실패:", error);
        alert("공유를 실패했습니다.");
      }
    }
  } else if (data.shareYn === "Y") {
    if (confirm(`정말로 "${data.wkNm}"을(를) 공유 해제하시겠습니까?`)) {
      try {
        const editData = await fetchEditDataByFilePath(data.filePath);
        if (!editData) {
          throw new Error("편집 데이터를 가져올 수 없습니다.");
        }
        await deleteWgcEdit({ editId: data.editId });
        await saveWgcEdit({ ...data, editData, shareYn: "N" });
        editDataCache.delete(data.filePath);
        previewCache.delete(data.filePath);
        await fetchEditData();
        await renderFilteredData();
      } catch (error) {
        console.error("공유 해제 실패:", error);
        alert("공유 해제를 실패했습니다.");
      }
    }
  }
}

function closeEditRepository() {
  const modal = document.querySelector(".custom-modal-container");
  if (modal) {
    modal.remove();
  }
}

async function previewEditData(filePath, editData, callback) {
  if (previewCache.has(filePath)) {
    callback(previewCache.get(filePath));
    return;
  }
  if (!editData) {
    callback("");
    return;
  }
  try {
    const parsedData = JSON.parse(editData);
    const canvasWidth =
      parsedData.canvasWidth ||
      parsedData.backgroundImage?.width * parsedData.backgroundImage?.scaleX ||
      1280;
    const canvasHeight =
      parsedData.canvasHeight ||
      parsedData.backgroundImage?.height * parsedData.backgroundImage?.scaleY ||
      720;
    const viewportTransform = parsedData.viewportTransform || [
      1, 0, 0, 1, 0, 0,
    ];

    const tempCanvas = new fabric.Canvas(null, {
      width: canvasWidth,
      height: canvasHeight,
    });

    await tempCanvas.loadFromJSON(parsedData);
    tempCanvas.setViewportTransform(viewportTransform);
    tempCanvas.backgroundColor = "transparent";
    const dataUrl = tempCanvas.toDataURL({
      format: "png",
      multiplier: 2,
    });
    tempCanvas.dispose();
    previewCache.set(filePath, dataUrl);
    callback(dataUrl);
    tempCanvas.renderAll();
  } catch (error) {
    console.error(`미리보기 생성 실패: filePath=${filePath}`, error);
    callback("");
  }
}

function toggleRepoCategory(target) {
  const selectMyDataButton = document.querySelector("#my-data");
  const selectShareDataButton = document.querySelector("#share-data");

  if (!selectMyDataButton || !selectShareDataButton) {
    console.warn("버튼 요소를 찾을 수 없습니다.");
    return;
  }

  const isMyDataButton = target.id === "my-data" || target.closest("#my-data");
  const isShareDataButton =
    target.id === "share-data" || target.closest("#share-data");

  if (isMyDataButton) {
    selectMyDataButton.classList.add("active");
    selectShareDataButton.classList.remove("active");
  } else if (isShareDataButton) {
    selectShareDataButton.classList.add("active");
    selectMyDataButton.classList.remove("active");
  }
}

export { openEditRepository, fetchEditData };
