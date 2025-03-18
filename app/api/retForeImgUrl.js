/**
 * 통합 기상 분석
 * 예측 변수 이미지 API
 */
async function retForeImgUrl(params) {
  console.log("예측 변수 이미지 API");

  // 기본 파라미터
  const defaultParams = {
    varGrp: "UNIS_SFC_WBT",
    var: "WBT",
    modl: "GDAPS_KIM",
    lev: "2",
    analTime: "201905180000",
    foreTime: "201905180000",
    PROJ: "LCC",
    ZOOMLVL: "7",
    stLon: "48.19729473179383",
    stLat: "36.05394599513232",
    edLon: "162.3512886531648",
    edLat: "3.3720585707135684",
    basicSmtLvl: "3",
    basicTotSmtLvl: "5",
    repDispCd: "F",
    symblDispType: "",
    meta: "0",
  };

  const mergedParams = new URLSearchParams({
    ...Object.assign({}, defaultParams, params),
  });

  const image = await fetch(
    `http://afs2.kma-dev.go.kr/uwa/iwa/api/iwaImgUrlApi/retForeImgUrl.kaf?${mergedParams.toString()}`
  );

  const response = {
    image: image,
    params: mergedParams,
    apiType: "foreImg",
  };  

  return response;
}

export { retForeImgUrl };
