import { ImageEditor } from "./core.js"; // Update with the correct file structure
import "./styles/style.css";

// 초기 canvas 치수
const dimensions = {
  width: 1280,
  height: 720,
};

// tool bar에 보여지는 버튼
const buttons = [
  "select",
  "shapes",
  "draw",
  "line",
  "path",
  "textbox",
  "images",
  "background",
  "undo",
  "redo",
  "save",
  "download",
  "clear",
  "templates",
  "fullscreen",
];

// 초기 도형(그리기)
const shapes = [];

// 초기 업로드 이미지
const images = [];

// 초기 템플릿
const templates = [
  {
    name: "Template 1",
    preview:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAYAAAB1ovlvAAAAAXNSR0IArs4c6QAAAmVJREFUeF7t2LGtAjEUBVFvG5866L8afhsgERA7AI31dIgt3fX4RFzLT4GwwBVum1ZgAQhBWgDANL9xABlICwCY5jcOIANpAQDT/MYBZCAtAGCa3ziADKQFAEzzGweQgbQAgGl+4wAykBYAMM1vHEAG0gIApvmNA8hAWgDANL/xrwN8rvXYzHq/1vrfPOvY0AK/Avi30esG4Eal4UcAHP7Ap18PwNNfaPj3ATj8gU+/HoCnv9Dw7wNw+AOffj0AT3+h4d8H4PAHPv16AJ7+QsO/7xcAd/6Efmf1R/RwXRvX+zrAjU1HFPgUABCGtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v3EAGUgLAJjmNw4gA2kBANP8xgFkIC0AYJrfOIAMpAUATPMbB5CBtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v3EAGUgLAJjmNw4gA2kBANP8xgFkIC0AYJrfOIAMpAUATPMbB5CBtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v3EAGUgLAJjmNw4gA2kBANP8xgFkIC0AYJrfOIAMpAUATPMbB5CBtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v3EAGUgLAJjmNw4gA2kBANP8xgFkIC0AYJrfOIAMpAUATPMbB5CBtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v3EAGUgLAJjmNw4gA2kBANP8xgFkIC0AYJrfOIAMpAUATPMbB5CBtACAaX7jADKQFgAwzW8cQAbSAgCm+Y0DyEBaAMA0v/EXEIogeZx2YmkAAAAASUVORK5CYII=",
    data: '{"objects":[{"type":"rect","left":100,"top":100,"width":50,"height":50,"fill":"red"}]}',
  },
  {
    name: "Template 2",
    preview:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAYAAAB1ovlvAAAAAXNSR0IArs4c6QAAAzVJREFUeF7t2b1tE3EAxuH3BBsAEhUSLIAQDROwAEWEYABYAgoaNiAjUKBQMwG0dDSAKJFCwQDI+PIhXAC+VK/v/FyRJn/p9f3ukS0nQ1wKFAsMxW3TCgRACKoFAKzmNw4gA9UCAFbzGweQgWoBAKv5jQPIQLUAgNX8xgFkoFoAwGp+4wAyUC0AYDW/cQAZqBYAsJrfOIAMVAsAWM1vHEAGqgUArOY3DiAD1QIAVvMbB5CBagEAq/mNA8hAtQCA1fzGAWSgWgDAan7jADJQLQBgNb/xHQG4epDkYZI7SS4n+ZTkbTIcekTLLrADAFevkxz8I/OHJI+S4cuyH8P+3l0Z4H/xnT+Vj0nuJsOv/X1My73zIsCTj903E9O+SIZnE886NqMCTYAjvhHhlOtrMtyactCZeRVoAvyc5CKoribDj3nl9Wq3FWgC/JbkxrYXuPH768nw/QLnHZ1BgSbAd0nuT2x0nAzXJp51bEYFmgCfJHk1sdXh+t3v6cSzjs2oQBHgWGn1Psm9Lb1+rv8ofTsZxo9s18IKtAGOX0KOToH99RrxHSTD+HHtWmCBMsCTd8FL6x/PkzxOcvOs8fHZ3whfeudboLqNW9oBgJuBV1dO/xfs2+6y2f25ux0DuC/Z3ed5AQBZqBYAsJrfOIAMVAsAWM1vHEAGqgUArOY3DiAD1QIAVvMbB5CBagEAq/mNA8hAtQCA1fzGAWSgWgDAan7jADJQLQBgNb9xABmoFgCwmt84gAxUCwBYzW8cQAaqBQCs5jcOIAPVAgBW8xsHkIFqAQCr+Y0DyEC1AIDV/MYBZKBaAMBqfuMAMlAtAGA1v3EAGagWALCa3ziADFQLAFjNbxxABqoFAKzmNw4gA9UCAFbzGweQgWoBAKv5jQPIQLUAgNX8xgFkoFoAwGp+4wAyUC0AYDW/cQAZqBYAsJrfOIAMVAsAWM1vHEAGqgUArOY3DiAD1QIAVvMbB5CBagEAq/mNA8hAtQCA1fzGAWSgWgDAan7jADJQLQBgNb9xABmoFgCwmt84gAxUCwBYzW8cQAaqBQCs5jcOIAPVAgBW8xsHkIFqAQCr+Y0DyEC1AIDV/MZ/A7ZZLXkS+bYLAAAAAElFTkSuQmCC",
    data: '{"objects":[{"type":"circle","left":150,"top":150,"radius":30,"fill":"blue"}]}',
  },
];

const options = {
  dimensions: dimensions,
  buttons: buttons,
  shapes: shapes,
  images: images,
  templates: templates,
};

const imgEditor = new ImageEditor("#image-editor-container", options);
console.log("initialize image editor");

imgEditor.init();

export { imgEditor };
