import { ICONS } from "../models/Icons";

function getLineAngle(displacementX: number, displacementY: number) {
  return Math.atan2(
    displacementY / 2 + displacementY / 2,
    displacementX / 2 + displacementX / 2
  );
}

function generateUniqueId() {
  return "shape_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function initializeColorPicker(
  pickerElement: HTMLElement,
  onColorChange: Function
) {
  const spectrumOptions = {
    showButtons: false,
    type: "color",
    showInput: true,
    allowEmpty: true,
    move: onColorChange,
    palette: [
      [
        "#000000",
        "#444444",
        "#5b5b5b",
        "#999999",
        "#bcbcbc",
        "#eeeeee",
        "#f3f6f4",
        "#ffffff",
      ],
      [
        "#f44336",
        "#744700",
        "#ce7e00",
        "#8fce00",
        "#2986cc",
        "#16537e",
        "#6a329f",
        "#c90076",
      ],
      [
        "#f4cccc",
        "#fce5cd",
        "#fff2cc",
        "#d9ead3",
        "#d0e0e3",
        "#cfe2f3",
        "#d9d2e9",
        "#ead1dc",
      ],
      [
        "#ea9999",
        "#f9cb9c",
        "#ffe599",
        "#b6d7a8",
        "#a2c4c9",
        "#9fc5e8",
        "#b4a7d6",
        "#d5a6bd",
      ],
      [
        "#e06666",
        "#f6b26b",
        "#ffd966",
        "#93c47d",
        "#76a5af",
        "#6fa8dc",
        "#8e7cc3",
        "#c27ba0",
      ],
      [
        "#cc0000",
        "#e69138",
        "#f1c232",
        "#6aa84f",
        "#45818e",
        "#3d85c6",
        "#674ea7",
        "#a64d79",
      ],
      [
        "#990000",
        "#b45f06",
        "#bf9000",
        "#38761d",
        "#134f5c",
        "#0b5394",
        "#351c75",
        "#741b47",
      ],
      [
        "#660000",
        "#783f04",
        "#7f6000",
        "#274e13",
        "#0c343d",
        "#073763",
        "#20124d",
        "#4c1130",
      ],
      ["#ffdb23", "#ff9500", "#ff0100"],
    ],
  };
  pickerElement.spectrum(spectrumOptions);
}

function initializeEyedropper(
  pickerElement: HTMLElement,
  onColorChange: Function
) {
  const eyedropperBtn = document.createElement("button");
  eyedropperBtn.className = "eyedropper-btn";
  eyedropperBtn.innerHTML = ICONS.eyeDrop;
  pickerElement.parent().append(eyedropperBtn);

  eyedropperBtn.addEventListener(
    "click",
    onColorChange as EventListenerOrEventListenerObject
  );
}

export {
  getLineAngle,
  generateUniqueId,
  initializeColorPicker,
  initializeEyedropper,
};
