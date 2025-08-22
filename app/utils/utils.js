import { imgEditor } from "../index.ts";

/**
 * 여러 유틸들 정의
 */

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

    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (data[y * w + x] & 0xff000000) {
          y1 = y;
          y = h;
          break;
        }
      }
    }

    for (y = h - 1; y > y1; y--) {
      for (x = 0; x < w; x++) {
        if (data[y * w + x] & 0xff000000) {
          y2 = y;
          y = 0;
          break;
        }
      }
    }

    for (y = y1; y < y2; y++) {
      for (x = 0; x < w; x++) {
        if (x < x1 && data[y * w + x] & 0xff000000) {
          x1 = x;
          break;
        }
      }
    }

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

  const data = await getImageData(await obj.toDataURL());
  return scanPixels(data);
}

/**
 * Align objects on canvas according to the position
 * @param {fabric.Canvas} canvas - Fabric.js canvas
 * @param {fabric.Object|fabric.Group} activeSelection - The array or group of Fabric.js objects
 * @param {String} pos - Position to align: 'left', 'center-h', 'right', 'top', 'center-v', 'bottom'
 */
async function alignObject(canvas, activeSelection, pos) {
  const tempZoom = canvas.getZoom();
  imgEditor.applyZoom(1);

  const bound = activeSelection.getBoundingRect();
  const realBound = await getRealBBox(activeSelection);
  let moveLeft = 0;
  let moveTop = 0;

  switch (pos) {
    case "left":
      moveLeft = -bound.left - realBound.x1;
      activeSelection.set("left", activeSelection.left + moveLeft);
      break;
    case "center-h":
      moveLeft =
        -bound.left - realBound.x1 + canvas.width / 2 - realBound.width / 2;
      activeSelection.set("left", activeSelection.left + moveLeft);
      break;
    case "right":
      moveLeft = -bound.left - realBound.x1 + canvas.width - realBound.width;
      activeSelection.set("left", activeSelection.left + moveLeft);
      break;
    case "top":
      moveTop = -bound.top - realBound.y1;
      activeSelection.set("top", activeSelection.top + moveTop);
      break;
    case "center-v":
      moveTop =
        -bound.top - realBound.y1 + canvas.height / 2 - realBound.height / 2;
      activeSelection.set("top", activeSelection.top + moveTop);
      break;
    case "bottom":
      moveTop = -bound.top - realBound.y1 + (canvas.height - realBound.height);
      activeSelection.set("top", activeSelection.top + moveTop);
      break;
    default:
      return;
  }

  activeSelection.setCoords();

  if (!activeSelection._objects) {
    canvas.discardActiveObject();
    canvas.renderAll();
    canvas.setActiveObject(activeSelection);
    canvas.renderAll();
  }
  canvas.fire("object:modified");
  canvas.renderAll();
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
    if (styleName === "fontSize") {
      activeSelection.setSelectionStyles(style);
    } else if (styleName === "lineHeight" || styleName === "charSpacing") {
      activeSelection.set(styleName, value);
    } else {
      activeSelection.setSelectionStyles(style);
    }
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

  const imgName = window.prompt("저장할 이름을 입력하세요", "image");
  if (imgName) {
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = `${imgName}.${extension}`;
    link.dispatchEvent(new MouseEvent("click"));
    setTimeout(() => window.URL.revokeObjectURL(fileURL), 60);
  }
}

/**
 * Download an SVG from markup
 * @param {String} SVGmarkup - SVG markup string
 */
function downloadSVG(SVGmarkup) {
  const url =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVGmarkup);

  const svgName = window.prompt("저장할 이름을 입력하세요", "svg");
  if (svgName) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "image.svg";
    link.dispatchEvent(new MouseEvent("click"));
    setTimeout(() => window.URL.revokeObjectURL(url), 60);
  }
}

// 선택 가능 객체 추출
function getFilteredFocusObjects() {
  let objects = imgEditor.canvas.getObjects().filter((obj) => !obj.noFocusing);
  return objects;
}

// 선택 불가능 객체 추출
function getFilteredNoFocusObjects() {
  let objects = imgEditor.canvas.getObjects().filter((obj) => obj.noFocusing);
  return objects;
}

// 중첩자료 객체 추출
function getOverlayImages() {
  let objects = imgEditor.canvas
    .getObjects()
    .filter((obj) => obj.overlayImage === true);
  return objects;
}

// 중첩자료 객체 추출
function getDeleteArea() {
  let objects = imgEditor.canvas.getObjects().filter((obj) => obj.isDelete);
  return objects;
}

fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    propertiesToInclude = propertiesToInclude || [];
    propertiesToInclude = propertiesToInclude.concat([
      "name",
      "params",
      "id",
      "label",
      "visible",
      "apiType",
      "overlayImage",
      "weatherFrontLineType",
      "isReflect",
      "isDelete",
      "viewportTransform",
      "width",
      "height",
      "padding",
      "hasControls",
      "borderColor",
      "strokeUniform",
    ]);
    return toObject.call(this, propertiesToInclude);
  };
})(fabric.Object.prototype.toObject);

function canvasToJsonData(data) {
  if (!data) {
    console.warn("캔버스 데이터가 유효하지 않습니다.");
    return { objects: [] };
  }
  const canvasJSON = data.toJSON([
    "name",
    "params",
    "id",
    "label",
    "visible",
    "apiType",
    "overlayImage",
    "weatherFrontLineType",
    "isReflect",
    "isDelete",
    "viewportTransform",
    "width",
    "height",
    "padding",
    "hasControls",
    "borderColor",
    "strokeUniform",
  ]);
  return canvasJSON;
}

function groupObjects(canvas) {
  if (!canvas) return;
  const objects = canvas.getActiveObjects();
  if (objects.length <= 1) return;
  objects.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  const group = new fabric.Group(objects);
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
}

function ungroupObjects(canvas) {
  if (!canvas) return;
  const object = canvas.getActiveObject();
  if (!object || !object.isType("group")) return;
  canvas.remove(object);
  const objects = [...object.removeAll()];
  const selection = new fabric.ActiveSelection(objects, { canvas });
  objects.forEach((obj) => canvas.add(obj));
  canvas.setActiveObject(selection);
  canvas.renderAll();
}

function selectAllObjects(canvas) {
  const objects = getFilteredFocusObjects();
  if (objects.length === 1) {
    canvas.setActiveObject(objects[0]);
  } else if (objects.length > 1) {
    canvas.discardActiveObject();
    const selection = new fabric.ActiveSelection(objects, {
      canvas: canvas,
    });
    canvas.setActiveObject(selection);
  }
  canvas.renderAll();
}

function removeObjects(canvas) {
  if (canvas.getActiveObjects().length > 0) {
    const activeObjects = canvas.getActiveObjects();
    canvas.discardActiveObject();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
    canvas.fire("object:modified");
  }
}

export {
  alignObject,
  getActiveFontStyle,
  setActiveFontStyle,
  downloadImage,
  downloadSVG,
  getFilteredFocusObjects,
  getFilteredNoFocusObjects,
  getOverlayImages,
  canvasToJsonData,
  getDeleteArea,
  groupObjects,
  ungroupObjects,
  selectAllObjects,
  removeObjects,
};
