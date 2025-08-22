import { defaultShapeSettings } from "../utils/constants.ts";
import { generateUniqueId } from "../utils/drawingUtils.ts";

function ellipseDrawing(canvas) {
  let isDrawing = false;
  let ellipse = null;
  let startPoint = null;

  /**
   * @param {object} opt
   */
  const handleMouseDown = (opt) => {
    if (!canvas.isDrawingEllipseMode) return;

    isDrawing = true;
    const pointer = canvas.getPointer(opt.e);
    startPoint = { x: pointer.x, y: pointer.y };

    ellipse = new fabric.Ellipse({
      id: generateUniqueId(),
      stroke: defaultShapeSettings.stroke,
      strokeWidth: defaultShapeSettings.strokeWidth,
      left: startPoint.x,
      top: startPoint.y,
      rx: 0,
      ry: 0,
      fill: "transparent",
      originX: "left",
      originY: "top",
      selectable: false,
      strokeUniform: true,
    });

    canvas.add(ellipse);
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseMove = (opt) => {
    if (!isDrawing || !ellipse) return;
    const pointer = canvas.getPointer(opt.e);
    const shiftPressed = opt.e.shiftKey;

    const origX = startPoint.x;
    const origY = startPoint.y;
    const pointerX = pointer.x;
    const pointerY = pointer.y;

    let rx = Math.abs(origX - pointerX) / 2;
    let ry = Math.abs(origY - pointerY) / 2;
    let left = Math.min(origX, pointerX);
    let top = Math.min(origY, pointerY);

    if (shiftPressed) {
      ry = rx;

      if (pointerY < origY) {
        top = origY - ry * 2;
      }
    }

    ellipse.set({
      left: left,
      top: top,
      rx: rx,
      ry: ry,
    });
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseUp = (opt) => {
    if (!isDrawing) return;
    isDrawing = false;

    if (ellipse) {
      if (ellipse.rx < 5 && ellipse.ry < 5) {
        canvas.remove(ellipse);
      } else {
        ellipse.set({ selectable: true });
        ellipse.setCoords();
        canvas.setActiveObject(ellipse);
      }
    }

    canvas.renderAll();

    ellipse = null;
    startPoint = null;
  };

  canvas.on("mouse:down", handleMouseDown);
  canvas.on("mouse:move", handleMouseMove);
  canvas.on("mouse:up", handleMouseUp);
}

export { ellipseDrawing };
