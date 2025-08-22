const baseUrl = webRoot
  ? webRoot + "/ias/rest/wgc"
  : "http://localhost:8080/ias/rest/wgc";

const baseUrlNoRest = webRoot
  ? webRoot + "/ias/wgc"
  : "http://localhost:8080/ias/wgc";
const csrfToken = document
  .querySelector("[name='_csrf']")
  ?.getAttribute("content");

const loader = document.querySelector(".loading");

function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

// 이미지 조회
async function retWgcImg() {
  const url = `${baseUrl}/retWgcImgCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("이미지 조회 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 이미지 저장
async function saveWgcImg(data) {
  const url = `${baseUrl}/saveWgcImgCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 이미지 삭제
async function deleteWgcImg(data) {
  const url = `${baseUrl}/deleteWgcImgCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("이미지 삭제 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 파일 데이터 조회
async function getFileData(data) {
  const url = `${baseUrlNoRest}/data`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("파일 데이터 조회 실패:", error);
    throw error;
  }
}

// 템플릿 조회
async function retWgcTmplt() {
  const url = `${baseUrl}/retWgcTmpltCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("템플릿 조회 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 템플릿 저장
async function saveWgcTmplt(data) {
  const url = `${baseUrl}/saveWgcTmpltCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("템플릿 저장 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 템플릿 삭제
async function deleteWgcTmplt(data) {
  const url = `${baseUrl}/deleteWgcTmpltCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("템플릿 삭제 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 편집 조회
async function retWgcEdit() {
  const url = `${baseUrl}/retWgcEditCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("편집 조회 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 편집 저장
async function saveWgcEdit(data) {
  const url = `${baseUrl}/saveWgcEditCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("편집 저장 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

// 편집 삭제
async function deleteWgcEdit(data) {
  const url = `${baseUrl}/deleteWgcEditCmd.json`;
  try {
    showLoader();
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("편집 삭제 실패:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

export {
  retWgcImg,
  saveWgcImg,
  deleteWgcImg,
  retWgcTmplt,
  saveWgcTmplt,
  deleteWgcTmplt,
  retWgcEdit,
  saveWgcEdit,
  deleteWgcEdit,
  getFileData,
};
