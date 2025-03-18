/**
 * 브라우저에 임시 저장
 */

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} name
 * @param {any} value
 */
function save(name, value) {
  if (value instanceof Object) {
    value = JSON.stringify(value);
  }
  localStorage.setItem(name, value);
}

/**
 * 로컬스토리지 데이터 불러오기
 * @param {string} name
 * @returns {any}
 */
function load(name) {
  let value = localStorage.getItem(name);
  try {
    value = JSON.parse(value);
  } catch (e) {
  }
  return value;
}

/**
 * 로컬스토리지 저장 값 제거
 * @param {string} name
 */
function remove(name) {
  localStorage.removeItem(name);
}

export { save, load, remove };
