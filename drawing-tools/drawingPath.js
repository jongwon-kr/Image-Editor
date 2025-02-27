/**
 * Define action to draw path by mouse action
 */

/**
 * Check if cursor is within a radius of a target point
 * @param {number} radius - The radius to check within
 * @param {number} cursorX - X coordinate of the cursor
 * @param {number} cursorY - Y coordinate of the cursor
 * @param {number} targetX - X coordinate of the target point
 * @param {number} targetY - Y coordinate of the target point
 * @returns {boolean} - True if within range, false otherwise
 */
function inRange(radius, cursorX, cursorY, targetX, targetY) {
  return (
    Math.abs(cursorX - targetX) <= radius &&
    Math.abs(cursorY - targetY) <= radius
  );
}

/**
 * Initialize path drawing on a Fabric.js canvas
 * @param {fabric.Canvas} fabricCanvas - The Fabric.js canvas instance
 */
function pathDrawing(fabricCanvas) {
  let isDrawingPath = false,
    pathToDraw,
    pointer,
    updatedPath,
    isMouseDown = false,
    isDrawingCurve = false,
    rememberX,
    rememberY;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingPathMode) return;

    isMouseDown = true;
    isDrawingPath = true;
    pointer = fabricCanvas.getPointer(o.e);

    // If first point, create a new path
    if (!pathToDraw) {
      pathToDraw = new fabric.Path(
        `M${pointer.x} ${pointer.y} L${pointer.x} ${pointer.y}`,
        {
          strokeWidth: 2,
          stroke: "#000000",
          fill: false,
        }
      );
      pathToDraw.selectable = false;
      pathToDraw.evented = false;
      pathToDraw.strokeUniform = true;
      fabricCanvas.add(pathToDraw);
      return;
    }

    // Add a new line segment to the existing path
    if (pathToDraw) {
      pathToDraw.path.push(["L", pointer.x, pointer.y]);

      // Recalculate path dimensions
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
        width: dims.width,
        height: dims.height,
        left: dims.left,
        top: dims.top,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
        dirty: true,
      });
      pathToDraw.setCoords();
      fabricCanvas.renderAll();
    }
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!fabricCanvas.isDrawingPathMode || !isDrawingPath) return;

    pointer = fabricCanvas.getPointer(o.e);

    if (!isDrawingCurve) {
      updatedPath = ["L", pointer.x, pointer.y];
    }

    pathToDraw.path.pop();

    // Shift key for angle snapping
    if (o.e.shiftKey && !isDrawingCurve) {
      let lastPoint = [...pathToDraw.path].pop();
      let startX = lastPoint[1];
      let startY = lastPoint[2];
      let x2 = pointer.x - startX;
      let y2 = pointer.y - startY;
      let r = Math.sqrt(x2 * x2 + y2 * y2);
      let angle = (Math.atan2(y2, x2) / Math.PI) * 180;

      angle = parseInt(((angle + 7.5) % 360) / 15) * 15;

      let cosx = r * Math.cos((angle * Math.PI) / 180);
      let sinx = r * Math.sin((angle * Math.PI) / 180);

      updatedPath[1] = cosx + startX;
      updatedPath[2] = sinx + startY;
    }

    // Snap to existing points if within range
    if (pathToDraw.path.length > 1 && !isDrawingCurve) {
      let snapPoints = [...pathToDraw.path];
      snapPoints.pop();
      for (let p of snapPoints) {
        if (
          (p[0] === "L" || p[0] === "M") &&
          inRange(10, pointer.x, pointer.y, p[1], p[2])
        ) {
          updatedPath[1] = p[1];
          updatedPath[2] = p[2];
          break;
        }
        if (p[0] === "Q" && inRange(10, pointer.x, pointer.y, p[3], p[4])) {
          updatedPath[1] = p[3];
          updatedPath[2] = p[4];
          break;
        }
      }
    }

    // Handle curve drawing
    if (isMouseDown && pathToDraw.path.length > 1) {
      if (!isDrawingCurve) {
        isDrawingCurve = true;
        let lastPath = pathToDraw.path.pop();

        if (lastPath[0] === "Q") {
          updatedPath = [
            "Q",
            lastPath[3],
            lastPath[4],
            lastPath[3],
            lastPath[4],
          ];
          rememberX = lastPath[3];
          rememberY = lastPath[4];
        } else {
          updatedPath = [
            "Q",
            lastPath[1],
            lastPath[2],
            lastPath[1],
            lastPath[2],
          ];
          rememberX = lastPath[1];
          rememberY = lastPath[2];
        }
      } else if (isDrawingCurve) {
        let mouseMoveX = pointer.x - updatedPath[3];
        let mouseMoveY = pointer.y - updatedPath[4];
        updatedPath = [
          "Q",
          rememberX - mouseMoveX,
          rememberY - mouseMoveY,
          rememberX,
          rememberY,
        ];
      }
    }

    pathToDraw.path.push(updatedPath);
    let dims = pathToDraw._calcDimensions();
    pathToDraw.set({
      width: dims.width,
      height: dims.height,
      left: dims.left,
      top: dims.top,
      pathOffset: {
        x: dims.width / 2 + dims.left,
        y: dims.height / 2 + dims.top,
      },
      dirty: true,
    });
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:up", (o) => {
    if (!fabricCanvas.isDrawingPathMode) {
      isMouseDown = false;
      isDrawingCurve = false;
      return;
    }

    isMouseDown = false;

    if (isDrawingCurve) {
      pointer = fabricCanvas.getPointer(o.e);
      pathToDraw.path.push(["L", pointer.x, pointer.y]);
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
        width: dims.width,
        height: dims.height,
        left: dims.left,
        top: dims.top,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
        dirty: true,
      });
      pathToDraw.setCoords();
      fabricCanvas.renderAll();
    }

    isDrawingCurve = false;
  });

  // Cancel drawing function
  const cancelDrawing = () => {
    pathToDraw.path.pop();

    if (pathToDraw.path.length > 1) {
      let dims = pathToDraw._calcDimensions();
      pathToDraw.set({
        width: dims.width,
        height: dims.height,
        left: dims.left,
        top: dims.top,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
        dirty: true,
      });
    } else {
      fabricCanvas.remove(pathToDraw);
    }

    fabricCanvas.renderAll();
    fabricCanvas.trigger("object:modified");

    pathToDraw = null;
    isDrawingPath = false;
  };

  // Event listeners for cancellation
  document.addEventListener("keydown", (e) => {
    if (!isDrawingPath) return;
    const key = e.which || e.keyCode;
    if (key === 27) cancelDrawing();
  });

  document.addEventListener("mousedown", (e) => {
    if (!isDrawingPath) return;
    if (!document.querySelector(".canvas-container").contains(e.target)) {
      cancelDrawing();
    }
  });
}

export { pathDrawing };
