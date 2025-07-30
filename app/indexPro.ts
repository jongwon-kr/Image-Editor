import { ImageEditor } from "./core.js";
import "./styles/style.css";

// import types
import { UserImage } from "models/UserImage.js";
import { Template } from "models/Template.js";
import { EditData } from "models/EditData.js";

// fabric.js가 전역에 로드되었는지 확인
if (typeof fabric === "undefined") {
  console.error(
    "fabric.js가 로드되지 않았습니다. CDN 스크립트가 올바르게 포함되었는지 확인하세요."
  );
}

declare global {
  interface Window {
    imgEditor: ImageEditor;
  }
}

const canvasEditorData = window.localStorage.getItem("canvasEditor");
const loadCanvasData = canvasEditorData ? JSON.parse(canvasEditorData) : null;
let dimensions = {
  width: 1280,
  height: 720,
};
// 초기 canvas 치수
if (loadCanvasData) {
  if (loadCanvasData.width != null && loadCanvasData.height != null) {
    dimensions = {
      width: loadCanvasData.width || 1280,
      height: loadCanvasData.height || 720,
    };
  }
}

// tool bar에 보여지는 버튼
const buttons = [
  "select",
  "hand",
  "cut",
  "colorFilter",
  "shapes",
  "draw",
  "line",
  "arrow",
  "path",
  "weatherFront",
  "textbox",
  "weatherData",
  "images",
  "templates",
  "background",
  "fullscreen",
  "help",
  "undo",
  "redo",
  "save",
  "import",
  "export",
  "download",
  "clear",
  // "test",
];

// 초기 도형(그리기)
const shapes: never[] = [];

// 초기 업로드 이미지
const images: UserImage[] = [];

// 초기 템플릿
const templates: Template[] = [];

const options = {
  dimensions: dimensions,
  buttons: buttons,
  shapes: shapes,
  images: images,
  templates: templates,
};

const imgEditor = new ImageEditor("#image-editor-container", options);

imgEditor.init();
window.imgEditor = imgEditor;

export { imgEditor };
