import { saveWgcEdit } from "../api/wgcApiService.js";
import { imgEditor } from "../index.ts";

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} name
 * @param {any} value
 */
function save(name, value) {
  let dataToSave = value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    value.width = parseInt(imgEditor.canvas.originalW);
    value.height = parseInt(imgEditor.canvas.originalH);
    dataToSave = JSON.stringify(value);
  } else if (typeof value !== "string") {
    console.error("Invalid value type for save:", value);
    return;
  }
  localStorage.setItem(name, dataToSave);
}

/**
 * 서버에 데이터 저장
 * @param {any} value
 */
async function upload(value) {
  const wkNm = prompt("저장할 작업의 이름을 입력해주세요:");
  if (!wkNm) {
    alert("작업의 이름이 입력되지 않았습니다!");
    return;
  }

  if (value instanceof Object) {
    value.width = parseInt(imgEditor.canvas.getWidth());
    value.height = parseInt(imgEditor.canvas.getHeight());
    value = JSON.stringify(value);
  }

  const newEdit = {
    wkNm: wkNm,
    editData: value,
    registDate: new Date().getTime(),
    shareYn: "N",
  };

  await saveWgcEdit(newEdit);
  alert("작업 내용이 업로드되었습니다.");
}

/**
 * 로컬스토리지 데이터 불러오기
 * @param {string} name
 * @returns {string|null}
 */
function load(name) {
  return localStorage.getItem(name);
}

/**
 * 로컬스토리지 저장 값 제거
 * @param {string} name
 */
function remove(name) {
  localStorage.removeItem(name);
}

export { save, load, remove, upload };
