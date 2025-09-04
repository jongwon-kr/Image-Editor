import { defaultShapeSettings } from "../utils/constants.ts";
import { generateUniqueId } from "../utils/drawingUtils.ts";

function triangleDrawing(canvas) {
  let isDrawing = false;
  let triangle = null;
  let startPoint = null;

  /**
   * @param {object} opt
   */
  const handleMouseDown = (opt) => {
    if (!canvas.isDrawingTriangleMode) return;
    isDrawing = true;
    const pointer = canvas.getPointer(opt.e);
    startPoint = { x: pointer.x, y: pointer.y };

    triangle = new fabric.Triangle({
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

    canvas.add(triangle);
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseMove = (opt) => {
    if (!isDrawing || !triangle) return;
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
      height = (width * Math.sqrt(3)) / 2;

      if (pointerY < origY) {
        top = origY - height;
      }
    }

    triangle.set({
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

    if (triangle) {
      if (triangle.width < 5 && triangle.height < 5) {
        canvas.remove(triangle);
      } else {
        triangle.set({ selectable: true });
        triangle.setCoords();
        canvas.setActiveObject(triangle);
        canvas.fire("object:modified");
      }
    }

    canvas.renderAll();

    triangle = null;
    startPoint = null;
  };

  canvas.on("mouse:down", handleMouseDown);
  canvas.on("mouse:move", handleMouseMove);
  canvas.on("mouse:up", handleMouseUp);
}

export { triangleDrawing };
