// @ts-nocheck
/**
 * 이미지 사이즈 조절
 */

function resizeImg(imageUrl, maxWidth, callback) {
  if (!imageUrl || typeof imageUrl !== "string") {
    console.error("Invalid imageUrl:", imageUrl);
    callback(null, new Error("Invalid or empty imageUrl"));
    return;
  }

  const img = new Image();
  img.src = imageUrl;

  img.onload = function () {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get 2D context");
      }

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
    } catch (error) {
      console.error("Error resizing image:", error);
      callback(null, error);
    }
  };

  img.onerror = function (error) {
    console.error("Image load failed for URL:", imageUrl, error);
    if (typeof callback === "function") {
      callback(null, error);
    }
  };
}

export { resizeImg };
