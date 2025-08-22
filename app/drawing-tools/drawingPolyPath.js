import { PolyPath } from "./customTools/PolyPath.js";
import { generateUniqueId } from "../utils/drawingUtils.ts";
import { defaultShapeSettings } from "../utils/constants.ts";

/**
 * @param {number} radius
 * @param {number} cursorX
 * @param {number} cursorY
 * @param {number} targetX
 * @param {number} targetY
 * @returns {boolean}
 */
function inRange(radius, cursorX, cursorY, targetX, targetY) {
  return (
    Math.abs(cursorX - targetX) <= radius &&
    Math.abs(cursorY - targetY) <= radius
  );
}

/**
 * @param {fabric.Canvas} canvas
 */
export function polyPathDrawing(canvas) {
  let isDrawing = false;
  let currentPolyPath = null;

  const stopDrawing = () => {
    if (!currentPolyPath) return;

    currentPolyPath.path.pop();

    if (currentPolyPath.path.length <= 1) {
      canvas.remove(currentPolyPath);
    } else {
      currentPolyPath.convertToCurve();

      const dims = currentPolyPath._calcDimensions();
      currentPolyPath.set({
        left: dims.left,
        top: dims.top,
        width: dims.width,
        height: dims.height,
        selectable: true,
        evented: true,
        fill: "transparent",
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
      });
      currentPolyPath.setCoords();
      canvas.setActiveObject(currentPolyPath);
    }

    isDrawing = false;
    currentPolyPath = null;
    canvas.isDrawingPolyPathMode = false;
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseDown = (opt) => {
    if (!canvas.isDrawingPolyPathMode) return;
    const pointer = canvas.getPointer(opt.e);

    if (!isDrawing) {
      isDrawing = true;
      currentPolyPath = new PolyPath(
        `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y}`,
        {
          id: generateUniqueId(),
          stroke: defaultShapeSettings.stroke,
          strokeWidth: defaultShapeSettings.strokeWidth,
          fill: "transparent",
          selectable: false,
          evented: false,
          strokeUniform: true,
        }
      );
      canvas.add(currentPolyPath);
    } else {
      const lastSegment = currentPolyPath.path[currentPolyPath.path.length - 1];
      const newPointX = lastSegment[1];
      const newPointY = lastSegment[2];

      currentPolyPath.path.push(["L", newPointX, newPointY]);
    }
    canvas.renderAll();
  };

  /**
   * @param {object} opt
   */
  const handleMouseMove = (opt) => {
    if (!isDrawing || !currentPolyPath) return;
    const pointer = canvas.getPointer(opt.e);

    let updatedPathSegment = ["L", pointer.x, pointer.y];

    if (opt.e.shiftKey) {
      const lastPoint = currentPolyPath.path[currentPolyPath.path.length - 2];
      const startX = lastPoint[lastPoint.length - 2];
      const startY = lastPoint[lastPoint.length - 1];
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);

      angle = parseInt(((angle * 180) / Math.PI + 7.5) / 15) * 15;
      const cosx = length * Math.cos((angle * Math.PI) / 180);
      const sinx = length * Math.sin((angle * Math.PI) / 180);

      updatedPathSegment[1] = cosx + startX;
      updatedPathSegment[2] = sinx + startY;
    }

    const snapPoints = [...currentPolyPath.path];
    snapPoints.pop();
    for (const p of snapPoints) {
      if (
        inRange(
          10,
          updatedPathSegment[1],
          updatedPathSegment[2],
          p[p.length - 2],
          p[p.length - 1]
        )
      ) {
        updatedPathSegment[1] = p[p.length - 2];
        updatedPathSegment[2] = p[p.length - 1];
        break;
      }
      currentPolyPath.fill = "#ff636399";
    }

    currentPolyPath.path[currentPolyPath.path.length - 1] = updatedPathSegment;
    canvas.renderAll();
  };

  /**
   * @param {KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    if (!isDrawing) return;
    if (e.key === "Enter" || e.key === "Escape") {
      stopDrawing();
    }
  };

  /**
   * @param {MouseEvent} e
   */
  const handleOutsideClick = (e) => {
    if (!isDrawing) return;
    if (!canvas.getElement().parentNode.contains(e.target)) {
      stopDrawing();
    }
  };

  canvas.on("mouse:down", handleMouseDown);
  canvas.on("mouse:move", handleMouseMove);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    canvas.off("mouse:down", handleMouseDown);
    canvas.off("mouse:move", handleMouseMove);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}
