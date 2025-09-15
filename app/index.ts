import { ImageEditor } from "./core.js";
import "./styles/style.css";

import { UserImage } from "models/UserImage.ts";
import { Template } from "models/Template.ts";
import { EditData } from "models/EditData.ts";
import { defaultButtons, simpleButtons, proButtons } from "./initConfig.ts";

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
if (loadCanvasData) {
  if (loadCanvasData.width != null && loadCanvasData.height != null) {
    dimensions = {
      width: loadCanvasData.width || 1280,
      height: loadCanvasData.height || 720,
    };
  }
}

let buttons: string[];
if (process.env.APP_MODE === "simple") {
  buttons = simpleButtons;
} else if (process.env.APP_MODE === "pro") {
  buttons = proButtons;
} else {
  buttons = defaultButtons;
}

const shapes: string[] = [];
const images: UserImage[] = [];
const templates: Template[] = [];
const edits: EditData[] = [];

const options = {
  dimensions: dimensions,
  buttons: buttons,
  shapes: shapes,
  images: images,
  templates: templates,
  edits: edits,
};

const imgEditor = new ImageEditor("#image-editor-container", options);

imgEditor.init();
window.imgEditor = imgEditor;

export { imgEditor };
