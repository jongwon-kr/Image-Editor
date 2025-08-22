import { CurvedLine } from "./customTools/CurvedLine.js";
import { generateUniqueId } from "../utils/drawingUtils.ts";
import { defaultShapeSettings } from "../utils/constants.ts";

/**
 * @param {fabric.Canvas} canvas
 */
export function curvedLineDrawing(canvas) {
  let isDrawing = false;
  let curvedLine = null;
  let startPoint = null;

  /**
   * @param {object} opt
   */
  const startDrawing = (opt) => {
    if (!canvas.isDrawingCurvedLineMode) return;
    isDrawing = true;
    const pointer = canvas.getPointer(opt.e);
    startPoint = { x: pointer.x, y: pointer.y };

    curvedLine = new CurvedLine(
      `M ${startPoint.x} ${startPoint.y} L ${startPoint.x} ${startPoint.y}`,
      {
        id: generateUniqueId(),
        stroke: defaultShapeSettings.stroke,
        strokeWidth: defaultShapeSettings.strokeWidth,
        fill: "transparent",
        selectable: false,
        evented: false,
        strokeUniform: true,
        originX: "left",
        originY: "top",
        left: startPoint.x,
        top: startPoint.y,
        isDrawing: true,
      }
    );
    canvas.add(curvedLine);
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const continueDrawing = (opt) => {
    if (!isDrawing || !curvedLine) return;
    const pointer = canvas.getPointer(opt.e);
    const shiftPressed = opt.e.shiftKey;

    let endX = pointer.x;
    let endY = pointer.y;

    if (shiftPressed) {
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const angle = Math.atan2(dy, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      endX = startPoint.x + length * Math.cos(snappedAngle);
      endY = startPoint.y + length * Math.sin(snappedAngle);
    }

    curvedLine.path[1][1] = endX;
    curvedLine.path[1][2] = endY;
    curvedLine.set({ isDrawing: true });
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const stopDrawing = (opt) => {
    if (!isDrawing || !curvedLine) return;
    isDrawing = false;

    const pointer = canvas.getPointer(opt.e);
    const shiftPressed = opt.e.shiftKey;
    let endX = pointer.x;
    let endY = pointer.y;

    if (shiftPressed) {
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const angle = Math.atan2(dy, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      endX = startPoint.x + length * Math.cos(snappedAngle);
      endY = startPoint.y + length * Math.sin(snappedAngle);
    }

    curvedLine.path[1][1] = endX;
    curvedLine.path[1][2] = endY;

    curvedLine.convertToCurved();
    const dims = curvedLine._calcDimensions();
    curvedLine.set({
      left: dims.left,
      top: dims.top,
      width: dims.width,
      height: dims.height,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top,
      },
      isDrawing: false,
      selectable: true,
      evented: true,
      originX: "left",
      originY: "top",
    });

    canvas.setActiveObject(curvedLine);
    canvas.fire("object:modified", { target: curvedLine });
    canvas.renderAll();
    curvedLine = null;
    startPoint = null;
  };

  canvas.on("mouse:down", startDrawing);
  canvas.on("mouse:move", continueDrawing);
  canvas.on("mouse:up", stopDrawing);
}
