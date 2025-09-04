import { defaultShapeSettings } from "../utils/constants.ts";
import { generateUniqueId } from "../utils/drawingUtils.ts";

function rectDrawing(canvas) {
  let isDrawing = false;
  let rect = null;
  let startPoint = null;

  /**
   * @param {object} opt
   */
  const handleMouseDown = (opt) => {
    if (!canvas.isDrawingRectMode) return;
    isDrawing = true;
    const pointer = canvas.getPointer(opt.e);
    startPoint = { x: pointer.x, y: pointer.y };

    rect = new fabric.Rect({
      id: generateUniqueId(),
      stroke: defaultShapeSettings.stroke,
      strokeWidth: defaultShapeSettings.strokeWidth,
      left: startPoint.x,
      top: startPoint.y,
      width: 0,
      height: 0,
      fill: "transparent",
      originX: "left",
      originY: "top",
      selectable: false,
      strokeUniform: true,
    });

    canvas.add(rect);
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseMove = (opt) => {
    if (!isDrawing || !rect) return;
    const pointer = canvas.getPointer(opt.e);
    const shiftPressed = opt.e.shiftKey;

    const origX = startPoint.x;
    const origY = startPoint.y;
    const pointerX = pointer.x;
    const pointerY = pointer.y;

    let width = Math.abs(origX - pointerX);
    let height = Math.abs(origY - pointerY);
    let left = Math.min(origX, pointerX);
    let top = Math.min(origY, pointerY);

    if (shiftPressed) {
      const side = Math.max(width, height);
      width = side;
      height = side;

      if (origX > pointerX) {
        left = origX - side;
      }
      if (origY > pointerY) {
        top = origY - side;
      }
    }

    rect.set({
      left: left,
      top: top,
      width: width,
      height: height,
    });

    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseUp = (opt) => {
    if (!isDrawing) return;
    isDrawing = false;

    if (rect) {
      if (rect.width < 5 && rect.height < 5) {
        canvas.remove(rect);
      } else {
        rect.set({ selectable: true });
        rect.setCoords();
        canvas.setActiveObject(rect);
        canvas.fire("object:modified");
      }
    }

    canvas.renderAll();

    rect = null;
    startPoint = null;
  };

  canvas.on("mouse:down", handleMouseDown);
  canvas.on("mouse:move", handleMouseMove);
  canvas.on("mouse:up", handleMouseUp);
}

export { rectDrawing };
