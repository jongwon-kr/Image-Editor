import { WeatherFrontLine } from "./customTools/weatherFrontLine.js";
import { generateUniqueId } from "../utils/drawingUtils.ts";
import {
  defaultShapeSettings,
  WeatherFrontLineType,
} from "../utils/constants.ts";

function inRange(radius, cursorX, cursorY, targetX, targetY) {
  return (
    Math.abs(cursorX - targetX) <= radius &&
    Math.abs(cursorY - targetY) <= radius
  );
}

/**
 * @param {fabric.Canvas} canvas
 * @param {WeatherFrontLineType} weatherFrontLineType
 */
export function weatherFrontLineDrawing(
  canvas,
  weatherFrontLineType = WeatherFrontLineType.WARM
) {
  let isDrawing = false;
  let currentWeatherFrontLine = null;

  const stopDrawing = () => {
    if (!currentWeatherFrontLine) return;

    currentWeatherFrontLine.path.pop();

    if (currentWeatherFrontLine.path.length <= 1) {
      canvas.remove(currentWeatherFrontLine);
    } else {
      currentWeatherFrontLine.convertToCurve();

      const dims = currentWeatherFrontLine._calcDimensions();
      currentWeatherFrontLine.set({
        left: dims.left,
        top: dims.top,
        width: dims.width,
        height: dims.height,
        selectable: true,
        evented: true,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
      });

      currentWeatherFrontLine.setCoords();
      canvas.setActiveObject(currentWeatherFrontLine);
    }

    isDrawing = false;
    currentWeatherFrontLine = null;
    canvas.isDrawingWeatherFrontLineMode = false;
    canvas.renderAll();
  };

  const handleMouseDown = (opt) => {
    if (!canvas.isDrawingWeatherFrontLineMode) return;
    const pointer = canvas.getPointer(opt.e);

    if (!isDrawing) {
      isDrawing = true;
      currentWeatherFrontLine = new WeatherFrontLine(
        `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y}`,
        {
          id: generateUniqueId(),
          fill: "transparent",
          selectable: false,
          evented: false,
          strokeUniform: true,
          weatherFrontLineType: weatherFrontLineType,
        }
      );
      canvas.add(currentWeatherFrontLine);
    } else {
      const lastSegment =
        currentWeatherFrontLine.path[currentWeatherFrontLine.path.length - 1];
      lastSegment[1] = pointer.x;
      lastSegment[2] = pointer.y;
      currentWeatherFrontLine.path.push(["L", pointer.x, pointer.y]);
    }
    currentWeatherFrontLine.dirty = true;
    canvas.renderAll();
  };

  const handleMouseMove = (opt) => {
    if (!isDrawing || !currentWeatherFrontLine) return;
    const pointer = canvas.getPointer(opt.e);

    let updatedPathSegment = ["L", pointer.x, pointer.y];

    if (opt.e.shiftKey) {
      const lastPoint =
        currentWeatherFrontLine.path[currentWeatherFrontLine.path.length - 2];
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

    const snapPoints = [...currentWeatherFrontLine.path];
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
    }

    currentWeatherFrontLine.path[currentWeatherFrontLine.path.length - 1] =
      updatedPathSegment;

    currentWeatherFrontLine.dirty = true;
    canvas.renderAll();
  };

  const handleKeyDown = (e) => {
    if (!isDrawing) return;
    if (e.key === "Enter" || e.key === "Escape") {
      stopDrawing();
    }
  };

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
