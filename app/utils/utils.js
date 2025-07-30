// @ts-nocheck
import { imgEditor } from "../index.ts";
import {
  attachControlPoints as attachLineControlPoints,
  bindControlPoints as bindLineControlPoints,
  updateControlPoints as updateLineControlPoints,
} from "../drawing-tools/drawingLine.js";
import {
  attachControlPoints as attachArrowControlPoints,
  bindControlPoints as bindArrowControlPoints,
  updateControlPoints as updateArrowControlPoints,
} from "../drawing-tools/drawingArrow.js";
import {
  attachControlPoints as attachPathControlPoints,
  bindControlPoints as bindPathControlPoints,
  updateControlPoints as updatePathControlPoints,
} from "../drawing-tools/drawingPath.js";
import {
  attachControlPoints as attachWeatherFrontControlPoints,
  bindControlPoints as bindFrontControlPoints,
  updateControlPoints as updateWeatherFrontControlPoints,
  generateWeatherFrontPath,
} from "../drawing-tools/drawingWeatherFront.js";

/**
 * 여러 유틸들 정의
 */

/**
 * @param {Array} handlers
 * @param {Number} width
 * @param {Number} height
 * @param {String} orientation
 * @param {Number} angle
 * @returns {fabric.Gradient}
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
  const canvasElement = document.querySelector(".canvas-container");
  canvasElement.style.display = "none";

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
      alignControlPoints(canvas, activeSelection, moveLeft, 0);
      break;
    case "center-h":
      moveLeft =
        -bound.left - realBound.x1 + canvas.width / 2 - realBound.width / 2;
      activeSelection.set("left", activeSelection.left + moveLeft);
      alignControlPoints(canvas, activeSelection, moveLeft, 0);
      break;
    case "right":
      moveLeft = -bound.left - realBound.x1 + canvas.width - realBound.width;
      activeSelection.set("left", activeSelection.left + moveLeft);
      alignControlPoints(canvas, activeSelection, moveLeft, 0);
      break;
    case "top":
      moveTop = -bound.top - realBound.y1;
      activeSelection.set("top", activeSelection.top + moveTop);
      alignControlPoints(canvas, activeSelection, 0, moveTop);
      break;
    case "center-v":
      moveTop =
        -bound.top - realBound.y1 + canvas.height / 2 - realBound.height / 2;
      activeSelection.set("top", activeSelection.top + moveTop);
      alignControlPoints(canvas, activeSelection, 0, moveTop);
      break;
    case "bottom":
      moveTop = -bound.top - realBound.y1 + (canvas.height - realBound.height);
      activeSelection.set("top", activeSelection.top + moveTop);
      alignControlPoints(canvas, activeSelection, 0, moveTop);
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
  imgEditor.applyZoom(tempZoom);
  canvasElement.style.display = "block";
  canvas.fire("object:modified");
  canvas.renderAll();
}

async function alignControlPoints(canvas, activeSelection, moveLeft, moveTop) {
  if (!moveLeft) moveLeft = 0;
  if (!moveTop) moveTop = 0;

  if (!activeSelection._objects) {
    // 단일 객체
    if (activeSelection.type === "path") {
      setControlPointsPositionByPathType(
        canvas,
        activeSelection,
        moveLeft,
        moveTop
      );
    }
  } else {
    // 그룹 객체
    activeSelection._objects.forEach((object) => {
      if (object.type === "path") {
        setControlPointsPositionByPathType(canvas, object, moveLeft, moveTop);
      }
    });
  }
}

function setControlPointsPositionByPathType(canvas, object, moveLeft, moveTop) {
  if (object.pathType === "line" || object.pathType === "arrow") {
    // 제어점 생성 및 추가
    const startPoint = {
      x: object.p0.left + moveLeft + 7.5,
      y: object.p0.top + moveTop + 7.5,
    };
    const endPoint = {
      x: object.p2.left + moveLeft + 7.5,
      y: object.p2.top + moveTop + 7.5,
    };
    const midPoint = object.p1
      ? { x: object.p1.left + moveLeft + 7.5, y: object.p1.top + moveTop + 7.5 }
      : null;

    // 기존 제어점 제거
    if (object.p0) canvas.remove(object.p0);
    if (object.p1) canvas.remove(object.p1);
    if (object.p2) canvas.remove(object.p2);

    // 새 제어점 생성 및 바인딩
    const attachControlPointsFunc =
      object.pathType === "line"
        ? attachLineControlPoints
        : attachArrowControlPoints;
    attachControlPointsFunc(
      canvas,
      object,
      startPoint,
      endPoint,
      midPoint,
      0,
      0
    );
  } else if (object.pathType === "polygon") {
    attachPathControlPoints(canvas, object, moveLeft, moveTop);
  } else if (object.pathType === "weatherFront") {
    if (object.shapeObjects) {
      object.shapeObjects.forEach((shape) => canvas.remove(shape));
      object.shapeObjects = [];
    }
    attachWeatherFrontControlPoints(canvas, object, moveLeft, moveTop);
  }
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
function getFrontShapes() {
  let objects = imgEditor.canvas.getObjects().filter((obj) => obj.frontShape);
  return objects;
}

// 중첩자료 객체 추출
function getDeleteArea() {
  let objects = imgEditor.canvas.getObjects().filter((obj) => obj.isDelete);
  return objects;
}

// 제어점 객체 추출
function getControlPoint() {
  let objects = imgEditor.canvas
    .getObjects()
    .filter((obj) => obj.isControlPoint);
  return objects;
}

function restoreControlPoints(canvas, obj) {
  if (obj.type !== "path") return;
  const startPoint = obj.p0
    ? { x: obj.p0.left + 7.5, y: obj.p0.top + 7.5 }
    : null;
  const endPoint = obj.p2
    ? { x: obj.p2.left + 7.5, y: obj.p2.top + 7.5 }
    : null;
  const midPoint = obj.p1
    ? { x: obj.p1.left + 7.5, y: obj.p1.top + 7.5 }
    : null;

  if (obj.pathType === "line") {
    attachLineControlPoints(canvas, obj, startPoint, endPoint, midPoint);
  } else if (obj.pathType === "arrow") {
    attachArrowControlPoints(canvas, obj, startPoint, endPoint, midPoint);
  } else if (obj.pathType === "polygon") {
    attachPathControlPoints(canvas, obj);
  } else if (obj.pathType === "weatherFront") {
    attachWeatherFrontControlPoints(canvas, obj);
    generateWeatherFrontPath(obj, canvas);
  }
}

fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    propertiesToInclude = propertiesToInclude || [];
    // 기본 속성과 사용자 정의 속성 병합
    propertiesToInclude = propertiesToInclude.concat([
      "name",
      "p0",
      "p1",
      "p2",
      "noFocusing",
      "apiType",
      "isControlPoint",
      "frontShape",
      "controlPoints",
      "pathType",
      "params",
      "id",
      "label",
      "visible",
      "apiType",
      "overlayImage",
      "startHead",
      "endHead",
      "frontType",
      "pathD",
      "shapeObjects",
      "frontShape",
      "isReflect",
      "isDelete",
      "isScaledInGroup",
      "lastTransformMatrix",
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
    "p0",
    "p1",
    "p2",
    "noFocusing",
    "apiType",
    "isControlPoint",
    "frontShape",
    "controlPoints",
    "pathType",
    "params",
    "id",
    "label",
    "visible",
    "apiType",
    "overlayImage",
    "startHead",
    "endHead",
    "frontType",
    "pathD",
    "shapeObjects",
    "frontShape",
    "isReflect",
    "isDelete",
    "viewportTransform",
    "width",
    "height",
    "isScaledInGroup",
    "lastTransformMatrix",
  ]);
  return canvasJSON;
}

function updateScaleControlPoints(fabricCanvas) {
  if (!fabricCanvas) {
    console.error("Canvas is not initialized");
    return;
  }
  const zoom = fabricCanvas.getZoom();
  const controlPoints = fabricCanvas
    .getObjects()
    .filter((o) => o.isControlPoint);
  controlPoints.forEach((point) => {
    point.set({
      scaleX: 1 / zoom,
      scaleY: 1 / zoom,
    });
    point.setCoords();
  });
}

function toggleGroup(canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  if (activeObject.type === "group") {
    canvas.remove(activeObject);
    const items = activeObject._objects;
    items.forEach((obj) => canvas.add(obj));
    const selection = new fabric.ActiveSelection(items, { canvas });
    canvas.setActiveObject(selection);
  } else {
    const objects = canvas.getActiveObjects();
    if (objects.length > 1) {
      canvas.discardActiveObject();
      const group = new fabric.Group(objects, {
        originX: activeObject.left,
        originY: activeObject.top,
      });
      objects.forEach((obj) => canvas.remove(obj));
      canvas.add(group);
      canvas.setActiveObject(group);
    }
  }
  canvas.renderAll();
}

function bringToFront(obj, canvas) {
  const objects = canvas.getObjects();
  const index = objects.indexOf(obj);
  if (index === -1) return;

  objects.splice(index, 1);
  objects.push(obj);
  canvas.requestRenderAll();
}

function bringForward(obj, canvas) {
  const objects = canvas.getObjects();
  const index = objects.indexOf(obj);
  if (index <= 0) return;

  let temp = objects[index];
  objects[index - 1] = objects[index];
  objects[index] = temp;
}

function sendBackwards(obj, canvas) {
  const objects = canvas.getObjects();
  const index = objects.indexOf(obj);
  if (index >= objects.length) return;

  let temp = objects[index];
  objects[index + 1] = objects[index];
  objects[index] = temp;
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
  getFilteredFocusObjects,
  getFilteredNoFocusObjects,
  getOverlayImages,
  getFrontShapes,
  getControlPoint,
  restoreControlPoints,
  canvasToJsonData,
  getDeleteArea,
  updateScaleControlPoints,
  bringToFront,
  toggleGroup,
  bringForward,
  sendBackwards,
};
