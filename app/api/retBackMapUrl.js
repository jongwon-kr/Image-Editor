/**
 * 배경 지도 설정
 */
function setBackMapImg(mapArea, options) {
  // 기본 파라미터
  const defaultParams = {
    base: "GRP_SL",
    type: "IMG",
    projection: "LCC",
    mapCode: "D1",
    stLon: 124.46125788672794,
    stLat: 38.63520187576005,
    edLon: 131.50677366893,
    edLat: 32.61462864983293,
    mdLon: 128.14708960972132,
    mdLat: 35.67482751320959,
    ZOOMLVL: 13,
    meta: 0,
  };

  if (!afsMap) return;

  let bgOptions = "";
  options.forEach((option) => {
    if (bgOptions.indexOf(option) === -1) {
      bgOptions += `,${option}`;
    }
  });
  mapArea.type = bgOptions;

  try {
    showLoader();

    const param = { ...Object.assign({}, defaultParams, mapArea) };
    return afsMap.setMapArea(param);
  } catch (error) {
    console.log("조회에 실패하였습니다. 에러 내용:", error);
  } finally {
    hideLoader();
  }
}

/**
 * 배경 지도 불러오기 API
 */
async function getBackMapImg() {
  if (!afsMap) return;

  try {
    showLoader();
    return await afsMap.getMapImg();
  } catch (error) {
    console.log("조회에 실패하였습니다. 에러 내용:", error);
  } finally {
    hideLoader();
  }
}

const loader = document.querySelector(".loading");

function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

export { setBackMapImg, getBackMapImg };
