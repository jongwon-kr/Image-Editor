/**
 * 통합 기상 분석
 * 예측 변수 이미지 API
 */
async function retGridImg(params) {
  // 기본 파라미터
  const defaultParams = {
    PROJ: "LCC",
    stLon: 48.19729473179383,
    stLat: 36.05394599513232,
    edLon: 162.3512886531648,
    edLat: 3.3720585707135684,
    contourLineColor: "0x000000", // 경위도선 색
    contourLineDiv: "D", // 경위도선 종류 A:실선, D:짧은 점선, H:긴 점선
    contourLineThck: 1, // 경위도선 두께 1 ~ 8
    ZOOMLVL: 7,
    meta: 0, // 0:이미지, 1:메타 정보
  };

  const mergedParams = new URLSearchParams({
    ...Object.assign({}, defaultParams, params),
  });

  try {
    showLoader();
    const image = await fetch(
      `http://afs2.kma-dev.go.kr/uwa/iwa/api/iwaImgUrlApi/retGridImg.kaf?${mergedParams.toString()}`
    );

    const response = {
      image: image,
      params: mergedParams,
      apiType: "gridImg",
    };

    return response;
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

export { retGridImg };
