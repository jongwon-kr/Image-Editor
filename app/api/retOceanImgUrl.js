// @ts-nocheck

/**
 * 
 * 통합 기상 분석
 * 해양 모델 이미지 API
 */
async function retOceanImgUrl(params) {
  // 기본 파라미터
  const defaultParams = {
    modlGrp: "GWW",
    modl: "GWW3",
    var: "WSPD_SNW",
    mem: "0000",
    lev: "-999999",
    analTime: "201705110000",
    foreTime: "201705110000",
    PROJ: "LCC",
    ZOOMLVL: "7",
    stLon: "48.19729473179383",
    stLat: "36.05394599513232",
    edLon: "162.3512886531648",
    edLat: "3.3720585707135684",
    basicTotSmtLvl: "5",
    repDispCd: "S",
    symblDispType: "W",
    isRasterFillCheck: "N",
    meta: "0",
    symbl: "1",
  };

  const mergedParams = new URLSearchParams({
    ...Object.assign({}, defaultParams, params),
  });

  try {
    showLoader();
    const image = await fetch(
      `http://afs2.kma-dev.go.kr/uwa/iwa/api/iwaImgUrlApi/retOceanImgUrl.kaf?${mergedParams.toString()}`
    );

    const response = {
      image: image,
      params: mergedParams,
      apiType: "oceanImg",
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

export { retOceanImgUrl };
