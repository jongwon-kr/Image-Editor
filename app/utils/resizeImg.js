/**
 * 이미지 사이즈 조절
 * @param {String} imageUrl
 * @param {Number} maxWidth
 * @param {Number} maxHeight
 * @param {Function} callback
 */
function resizeImg(imageUrl, maxWidth, callback) {
  // 이미지 요소 생성
  const img = new Image();
  img.src = imageUrl;

  // 이미지 로드 완료 시 이벤트 핸들러
  img.onload = function () {
    // 캔버스 요소 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 원본 이미지 사이즈
    let originalWidth = img.width;
    let originalHeight = img.height;

    // 비율을 유지하며 크기 조절 사이즈
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      const widthRatio = maxWidth / originalWidth;
      const scale = Math.min(widthRatio);

      newWidth = originalWidth * scale;
      newHeight = originalHeight * scale;
    }

    // 캔버스 크기 설정
    canvas.width = newWidth;
    canvas.height = newHeight;

    // 이미지 그리기
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Url(Base 64) 생성
    const resizedImageUrl = canvas.toDataURL("image/png");

    // callback이 함수인지 확인
    if (typeof callback === "function") {
      callback(resizedImageUrl);
    } else {
      console.error("Callback is not a function");
    }
  };

  // 이미지 로드 실패 시 이벤트 핸들러
  img.onerror = function (error) {
    console.error("Image load failed:", error);
    if (typeof callback === "function") {
      callback(null, error);
    }
  };
}

export { resizeImg };
