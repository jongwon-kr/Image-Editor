import { imgEditor } from "../index.js";

/**
 * Define util functions
 */

/**
 * Get Fabric.js gradient from color stops, orientation, and angle
 * @param {Array} handlers - Array of color stops
 * @param {Number} width - Gradient width
 * @param {Number} height - Gradient height
 * @param {String} orientation - Orientation type: 'linear' or 'radial'
 * @param {Number} angle - The angle of linear gradient in degrees
 * @returns {fabric.Gradient} - Fabric.js gradient object
 */
function generateFabricGradientFromColorStops(
  handlers,
  width,
  height,
  orientation,
  angle
) {
  const gradAngleToCoords = (angle) => {
    const anglePI = -parseInt(angle, 10) * (Math.PI / 180);
    return {
      x1: Math.round(50 + Math.sin(anglePI) * 50) / 100,
      y1: Math.round(50 + Math.cos(anglePI) * 50) / 100,
      x2: Math.round(50 + Math.sin(anglePI + Math.PI) * 50) / 100,
      y2: Math.round(50 + Math.cos(anglePI + Math.PI) * 50) / 100,
    };
  };

  const colorStops = handlers.map((handler, i) => ({
    id: i,
    color: handler.color,
    offset: handler.position / 100,
  }));

  let bgGradient;
  if (orientation === "linear") {
    const angleCoords = gradAngleToCoords(angle);
    bgGradient = new fabric.Gradient({
      type: "linear",
      coords: {
        x1: angleCoords.x1 * width,
        y1: angleCoords.y1 * height,
        x2: angleCoords.x2 * width,
        y2: angleCoords.y2 * height,
      },
      colorStops,
    });
  } else if (orientation === "radial") {
    bgGradient = new fabric.Gradient({
      type: "radial",
      coords: {
        x1: width / 2,
        y1: height / 2,
        r1: 0,
        x2: width / 2,
        y2: height / 2,
        r2: width / 2,
      },
      colorStops,
    });
  }

  return bgGradient;
}

/**
 * Get the real bounding box of a Fabric.js object by analyzing its pixels
 * @param {fabric.Object} obj - Fabric.js object
 * @returns {Promise<Object>} - Bounding box with x1, x2, y1, y2, width, and height
 */
async function getRealBBox(obj) {
  let tempCanv, ctx, w, h;

  const getImageData = (dataUrl) => {
    if (!tempCanv) {
      tempCanv = document.createElement("canvas");
      tempCanv.style.border = "1px solid blue";
      tempCanv.style.position = "absolute";
      tempCanv.style.top = "-100%";
      tempCanv.style.visibility = "hidden";
      ctx = tempCanv.getContext("2d");
      document.body.appendChild(tempCanv);
    }

    return new Promise((resolve, reject) => {
      if (!dataUrl) return reject();

      const image = new Image();
      image.addEventListener("load", () => {
        w = image.width;
        h = image.height;
        tempCanv.width = w;
        tempCanv.height = h;
        ctx.drawImage(image, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h).data.buffer;
        resolve(imageData);
      });
      image.src = dataUrl;
    });
  };

  const scanPixels = (imageData) => {
    const data = new Uint32Array(imageData);
    let x,
      y,
      y1,
      y2,
      x1 = w,
      x2 = 0;

    // Find y1 (top edge)
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (data[y * w + x] & 0xff000000) {
          y1 = y;
          y = h; // Exit outer loop
          break;
        }
      }
    }

    // Find y2 (bottom edge)
    for (y = h - 1; y > y1; y--) {
      for (x = 0; x < w; x++) {
        if (data[y * w + x] & 0xff000000) {
          y2 = y;
          y = 0; // Exit outer loop
          break;
        }
      }
    }

    // Find x1 (left edge)
    for (y = y1; y < y2; y++) {
      for (x = 0; x < w; x++) {
        if (x < x1 && data[y * w + x] & 0xff000000) {
          x1 = x;
          break;
        }
      }
    }

    // Find x2 (right edge)
    for (y = y1; y < y2; y++) {
      for (x = w - 1; x > x1; x--) {
        if (x > x2 && data[y * w + x] & 0xff000000) {
          x2 = x;
          break;
        }
      }
    }

    return {
      x1,
      x2,
      y1,
      y2,
      width: x2 - x1,
      height: y2 - y1,
    };
  };

  const data = await getImageData(obj.toDataURL());
  return scanPixels(data);
}

/**
 * Align objects on canvas according to the position
 * @param {fabric.Canvas} canvas - Fabric.js canvas
 * @param {fabric.Object|fabric.Group} activeSelection - The array or group of Fabric.js objects
 * @param {String} pos - Position to align: 'left', 'center-h', 'right', 'top', 'center-v', 'bottom'
 */
async function alignObject(canvas, activeSelection, pos) {
  const bound = activeSelection.getBoundingRect();
  const realBound = await getRealBBox(activeSelection);

  switch (pos) {
    case "left":
      activeSelection.set(
        "left",
        activeSelection.left - bound.left - realBound.x1
      );
      break;
    case "center-h":
      activeSelection.set(
        "left",
        activeSelection.left -
          bound.left -
          realBound.x1 +
          canvas.width / 2 -
          realBound.width / 2
      );
      break;
    case "right":
      activeSelection.set(
        "left",
        activeSelection.left -
          bound.left -
          realBound.x1 +
          canvas.width -
          realBound.width
      );
      break;
    case "top":
      activeSelection.set(
        "top",
        activeSelection.top - bound.top - realBound.y1
      );
      break;
    case "center-v":
      activeSelection.set(
        "top",
        activeSelection.top -
          bound.top -
          realBound.y1 +
          canvas.height / 2 -
          realBound.height / 2
      );
      break;
    case "bottom":
      activeSelection.set(
        "top",
        activeSelection.top -
          bound.top -
          realBound.y1 +
          (canvas.height - realBound.height)
      );
      break;
    default:
      return;
  }

  activeSelection.setCoords();
  canvas.renderAll();
  canvas.trigger("object:modified");
}

/**
 * Get the filters of the current image selection
 * @param {fabric.Object} activeSelection - Fabric.js object
 * @returns {Object} - Effects object with opacity, blur, brightness, saturation, and gamma
 */
function getCurrentEffect(activeSelection) {
  const updatedEffects = {
    opacity: 100,
    blur: 0,
    brightness: 50,
    saturation: 50,
    gamma: { r: 45, g: 45, b: 45 },
  };

  updatedEffects.opacity = activeSelection.opacity * 100;

  const hasBlur = activeSelection.filters.find((x) => x.blur);
  if (hasBlur) updatedEffects.blur = hasBlur.blur * 100;

  const hasBrightness = activeSelection.filters.find((x) => x.brightness);
  if (hasBrightness)
    updatedEffects.brightness = ((hasBrightness.brightness + 1) / 2) * 100;

  const hasSaturation = activeSelection.filters.find((x) => x.saturation);
  if (hasSaturation)
    updatedEffects.saturation = ((hasSaturation.saturation + 1) / 2) * 100;

  const hasGamma = activeSelection.filters.find((x) => x.gamma);
  if (hasGamma) {
    updatedEffects.gamma.r = Math.round(hasGamma.gamma[0] / 0.022);
    updatedEffects.gamma.g = Math.round(hasGamma.gamma[1] / 0.022);
    updatedEffects.gamma.b = Math.round(hasGamma.gamma[2] / 0.022);
  }

  return updatedEffects;
}

/**
 * Get updated Fabric.js filters based on effect settings
 * @param {Object} effects - Current effects object
 * @param {String} effect - Effect to update (e.g., 'blur', 'gamma.r')
 * @param {Number} value - New value for the effect
 * @returns {Array} - Array of Fabric.js filter objects
 */
function getUpdatedFilter(effects, effect, value) {
  const updatedEffects = { ...effects };

  switch (effect) {
    case "gamma.r":
      updatedEffects.gamma.r = value;
      break;
    case "gamma.g":
      updatedEffects.gamma.g = value;
      break;
    case "gamma.b":
      updatedEffects.gamma.b = value;
      break;
    default:
      updatedEffects[effect] = value;
      break;
  }

  const updatedFilters = [];

  if (updatedEffects.blur > 0) {
    updatedFilters.push(
      new fabric.Image.filters.Blur({ blur: updatedEffects.blur / 100 })
    );
  }

  if (updatedEffects.brightness !== 50) {
    updatedFilters.push(
      new fabric.Image.filters.Brightness({
        brightness: (updatedEffects.brightness / 100) * 2 - 1,
      })
    );
  }

  if (updatedEffects.saturation !== 50) {
    updatedFilters.push(
      new fabric.Image.filters.Saturation({
        saturation: (updatedEffects.saturation / 100) * 2 - 1,
      })
    );
  }

  if (
    updatedEffects.gamma.r !== 45 ||
    updatedEffects.gamma.g !== 45 ||
    updatedEffects.gamma.b !== 45
  ) {
    updatedFilters.push(
      new fabric.Image.filters.Gamma({
        gamma: [
          Math.round(updatedEffects.gamma.r * 0.022 * 10) / 10,
          Math.round(updatedEffects.gamma.g * 0.022 * 10) / 10,
          Math.round(updatedEffects.gamma.b * 0.022 * 10) / 10,
        ],
      })
    );
  }

  return updatedFilters;
}

/**
 * Get the active font style for a text object
 * @param {fabric.Text} activeSelection - Fabric.js text object
 * @param {String} styleName - Style property to check (e.g., 'fontWeight')
 * @returns {String} - The style value or empty string if not set
 */
function getActiveFontStyle(activeSelection, styleName) {
  if (activeSelection.getSelectionStyles && activeSelection.isEditing) {
    const styles = activeSelection.getSelectionStyles();
    if (styles.some((o) => o[styleName] === "")) return "";
    return styles[0][styleName];
  }
  return activeSelection[styleName] || "";
}

/**
 * Set the active font style for a text object
 * @param {fabric.Text} activeSelection - Fabric.js text object
 * @param {String} styleName - Style property to set (e.g., 'fontWeight')
 * @param {any} value - Value to set
 */
function setActiveFontStyle(activeSelection, styleName, value) {
  if (activeSelection.setSelectionStyles && activeSelection.isEditing) {
    const style = { [styleName]: value };
    activeSelection.setSelectionStyles(style);
    activeSelection.setCoords();
  } else {
    activeSelection.set(styleName, value);
  }
}

/**
 * Download an image from a data URL
 * @param {String} data - Data URL of the image
 * @param {String} [extension='png'] - File extension
 * @param {String} [mimeType='image/png'] - MIME type
 */
function downloadImage(data, extension = "png", mimeType = "image/png") {
  const imageData = data
    .toString()
    .replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  const byteCharacters = atob(imageData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const file = new Blob([byteArray], { type: mimeType + ";base64" });
  const fileURL = window.URL.createObjectURL(file);

  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file);
    return;
  }

  const link = document.createElement("a");
  link.href = fileURL;
  link.download = `image.${extension}`;
  link.dispatchEvent(new MouseEvent("click"));
  setTimeout(() => window.URL.revokeObjectURL(fileURL), 60);
}

/**
 * Download an SVG from markup
 * @param {String} SVGmarkup - SVG markup string
 */
function downloadSVG(SVGmarkup) {
  const url =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVGmarkup);
  const link = document.createElement("a");
  link.href = url;
  link.download = "image.svg";
  link.dispatchEvent(new MouseEvent("click"));
  setTimeout(() => window.URL.revokeObjectURL(url), 60);
}

export {
  generateFabricGradientFromColorStops,
  getRealBBox,
  alignObject,
  getCurrentEffect,
  getUpdatedFilter,
  getActiveFontStyle,
  setActiveFontStyle,
  downloadImage,
  downloadSVG,
};
