// @ts-nocheck
/**
 * 이미지 사이즈 조절
 */

function resizeImg(imageUrl, maxWidth, callback) {
  const img = new Image();
  img.src = imageUrl;

  img.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let originalWidth = img.width;
    let originalHeight = img.height;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      const widthRatio = maxWidth / originalWidth;
      const scale = Math.min(widthRatio);

      newWidth = originalWidth * scale;
      newHeight = originalHeight * scale;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const resizedImageUrl = canvas.toDataURL("image/png");

    if (typeof callback === "function") {
      callback(resizedImageUrl);
    } else {
      console.error("Callback is not a function");
    }
  };

  img.onerror = function (error) {
    console.error("Image load failed:", error);
    if (typeof callback === "function") {
      callback(null, error);
    }
  };
}

export { resizeImg };
