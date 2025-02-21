"use strict";

/**
 * Copy and paste functionality for Fabric.js canvas
 * @param {fabric.Canvas} canvas - The Fabric.js canvas instance
 */
function copyPaste(canvas) {
  // Copy event listener
  document.addEventListener("copy", (e) => {
    if (!canvas.getActiveObject()) return;

    e.preventDefault();
    setTimeout(() => {
      const activeObject = canvas.getActiveObject();
      if (activeObject.type === "image") {
        e.clipboardData.setData("text/plain", activeObject.toDataURL());
      } else {
        activeObject.clone((cloned) => {
          e.clipboardData.setData("text/plain", JSON.stringify(cloned.toJSON()));
        });
      }
    }, 0);
  });

  // Paste event listener
  document.addEventListener("paste", (e) => {
    const pasteTextData = e.clipboardData.getData("text");

    // Paste Base64 image
    if (pasteTextData && isBase64String(pasteTextData)) {
      fabric.Image.fromURL(pasteTextData, (img) => {
        img.set({ left: 100, top: 100 });
        img.scaleToHeight(100);
        img.scaleToWidth(100);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.trigger("object:modified");
      });
      return;
    }

    // Paste image from clipboard
    if (e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target.result, (img) => {
          img.set({ left: 100, top: 100 });
          img.scaleToHeight(100);
          img.scaleToWidth(100);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.trigger("object:modified");
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Paste JSON object
    const validTypes = ["rect", "circle", "line", "path", "polygon", "polyline", "textbox", "group"];
    if (isJSONObjectString(pasteTextData)) {
      const obj = JSON.parse(pasteTextData);
      console.log("Parsed object:", obj); // 디버깅용
      if (!validTypes.includes(obj.type)) return;

      fabric.util.enlivenObjects([obj], (objects) => {
        objects.forEach((o) => {
          o.set({ left: 100, top: 100 });
          canvas.add(o);
          o.setCoords();
          canvas.setActiveObject(o);
        });
        canvas.renderAll();
        canvas.trigger("object:modified");
      });
    }
  });
}

/**
 * Validate if a string is a Base64 encoded image
 */
function isBase64String(str) {
  try {
    str = str.split("base64,").pop();
    window.atob(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid JSON object
 */
function isJSONObjectString(s) {
  try {
    const o = JSON.parse(s);
    return !!o && typeof o === "object" && !Array.isArray(o);
  } catch {
    return false;
  }
}

export { copyPaste };
