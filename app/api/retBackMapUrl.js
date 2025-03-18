/**
 * 통합 기상 분석
 * 예측 변수 이미지 API
 */
async function retBackMapUrl(params) {
  // 기본 파라미터
  const defaultParams = {
    type: "IMG",
    projection: "LCC",
    stLon: 48.19729473179383,
    stLat: 36.05394599513232,
    edLon: 162.3512886531648,
    edLat: 3.3720585707135684,
    ZOOMLVL: 7,
    meta: 0,
  };

  const mergedParams = new URLSearchParams({
    ...Object.assign({}, defaultParams, params),
  });

  const response = await fetch(
    `http://afs2.kma-dev.go.kr/uwa/iwa/api/iwaImgUrlApi/retBackMapUrl.kaf?${mergedParams.toString()}`
  );

  return response;
}

export { retBackMapUrl };
