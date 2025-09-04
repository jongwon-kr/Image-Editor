import { generateUniqueId } from "./drawingUtils.ts";

("use strict");

let _clipboard = undefined;

function copyPaste(canvas) {
  document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;

    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      Copy(canvas);
    }

    if (e.key === "x" || e.key === "X") {
      e.preventDefault();
      Cutting(canvas);
    }

    if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      Duplicate(canvas);
    }

    if (e.key === "v" || e.key === "V") {
      e.preventDefault();
      if (_clipboard) {
        Paste(canvas, _clipboard);
      }
    }
  });
}

async function Copy(canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  const cloned = await activeObject.clone();
  _clipboard = cloned;
}

async function Cutting(canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  const cloned = await activeObject.clone();
  _clipboard = cloned;

  console.log(activeObject);

  if (activeObject.type === "group") {
    canvas.remove(activeObject);
  } else if (activeObject._objects) {
    activeObject._objects.forEach((obj) => {
      canvas.remove(obj);
    });
    canvas.discardActiveObject();
  } else {
    canvas.remove(activeObject);
  }
  canvas.renderAll();
  canvas.fire("object:modified");
}

async function Paste(canvas, originalObj, x = null, y = null) {
  if (!originalObj) {
    if (_clipboard) {
      originalObj = _clipboard;
    } else {
      alert("복사된 객체가 없습니다.");
      return;
    }
  }

  const clonedObj = await originalObj.clone();
  canvas.discardActiveObject();
  clonedObj.set({
    id: generateUniqueId(),
    left: clonedObj.left + 10,
    top: clonedObj.top + 10,
    evented: true,
  });
  if (x != null || y != null) {
    clonedObj.set({
      left: x,
      top: y,
    });
  }

  if (clonedObj._objects && clonedObj.type !== "group") {
    clonedObj._objects.forEach((obj) => {
      const objLabel = obj.label;
      obj.set({
        id: generateUniqueId(),
        label: "",
        desc: objLabel.replace(/\s+\d+$/, ""),
        left: obj.left + 10,
        top: obj.top + 10,
        evented: true,
      });
      canvas.add(obj);
    });

    const newSelection = new fabric.ActiveSelection(clonedObj.getObjects(), {
      canvas: canvas,
    });

    canvas.setActiveObject(newSelection);
  } else {
    clonedObj.set({
      id: generateUniqueId(),
      label: "",
      desc: originalObj.label.replace(/\s+\d+$/, ""),
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });
    canvas.add(clonedObj);
    canvas.setActiveObject(clonedObj);
  }

  originalObj.top += 10;
  originalObj.left += 10;

  canvas.renderAll();
  canvas.fire("object:modified");
}

async function Duplicate(canvas) {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    const cloned = await activeObject.clone();
    await Paste(canvas, cloned);
  }
}

export { copyPaste, Copy, Cutting, Paste, Duplicate };
