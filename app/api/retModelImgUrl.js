// @ts-nocheck

/**
 * 통합 기상 분석
 * 모델 이미지 API
 */
async function retModelImgUrl(params) {
  // 기본 파라미터
  const defaultParams = {
    modl: "GDAPS_KIM",
    varGrp: "PRSS_HGT",
    var: "HGT",
    lev: "1000",
    analTime: "201905180000",
    foreTime: "201905180000",
    PROJ: "LCC",
    mapRange: "EASIA",
    ZOOMLVL: "7",
    stLon: "48.19729473179383",
    stLat: "36.05394599513232",
    edLon: "162.3512886531648",
    edLat: "3.3720585707135684",
    basicSmtLvl: "3", // 스무딩 레벨
    basicTotSmtLvl: "5",
    repDispCd: "L",
    symblDispType: "",
    isRasterFillCheck: "N",
    meta: "0",
    symbl: "1",
    contourLineColor: "0x0000ff", // 선 색상
    contourLineDiv: "A", // 선 종류
    contourLineThck: "1", // 선 두께
  };

  const mergedParams = new URLSearchParams({
    ...Object.assign({}, defaultParams, params),
  });

  try {
    showLoader();
    const image = await fetch(
      `http://afs2.kma-dev.go.kr/uwa/iwa/api/iwaImgUrlApi/retModelImgUrl.kaf?${mergedParams.toString()}`
    );

    const response = {
      image: image,
      params: mergedParams,
      apiType: "modelImg",
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

export { retModelImgUrl };
