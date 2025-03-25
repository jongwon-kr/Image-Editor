function lineDrawing(fabricCanvas) {
  let isDrawingLine = false;
  let lineToDraw = null;
  let pointerPoints;

  fabricCanvas.on("mouse:down", (o) => {
    if (!fabricCanvas.isDrawingLineMode) return;

    isDrawingLine = true;
    const pointer = fabricCanvas.getPointer(o.e);
    pointerPoints = [pointer.x, pointer.y, pointer.x, pointer.y];

    lineToDraw = new fabric.Path(
      [
        ["M", pointerPoints[0], pointerPoints[1]],
        ["L", pointerPoints[2], pointerPoints[3]],
      ],
      {
        strokeWidth: 2,
        stroke: "#000000",
        strokeUniform: true,
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
        isControlPoint: false,
      }
    );
    fabricCanvas.add(lineToDraw);
    fabricCanvas.renderAll();
  });

  fabricCanvas.on("mouse:move", (o) => {
    if (!isDrawingLine || !lineToDraw) return;

    const pointer = fabricCanvas.getPointer(o.e);
    const [startX, startY] = pointerPoints;

    lineToDraw.path = o.e.shiftKey
      ? calculateStraightLine(startX, startY, pointer.x, pointer.y)
      : calculateCurvedLine(startX, startY, pointer.x, pointer.y);

    updateLine(lineToDraw, fabricCanvas);
  });

  fabricCanvas.on("mouse:up", () => {
    if (!isDrawingLine || !lineToDraw) return;

    isDrawingLine = false;
    setLineDimensions(lineToDraw);

    const startPoint = { x: lineToDraw.path[0][1], y: lineToDraw.path[0][2] };
    const endPoint = getEndPoint(lineToDraw.path);
    const midPoint =
      lineToDraw.path[1][0] === "Q"
        ? { x: lineToDraw.path[1][1], y: lineToDraw.path[1][2] }
        : null;

    attachControlPoints(fabricCanvas, lineToDraw, startPoint, endPoint, midPoint);
    fabricCanvas.fire("object:modified");
    fabricCanvas.renderAll();
  });

  function calculateStraightLine(startX, startY, endX, endY) {
    const x2 = endX - startX;
    const y2 = endY - startY;
    const r = Math.sqrt(x2 * x2 + y2 * y2);
    const angle =
      Math.round((((Math.atan2(y2, x2) / Math.PI) * 180 + 7.5) % 360) / 15) * 15;
    const cosx = r * Math.cos((angle * Math.PI) / 180);
    const sinx = r * Math.sin((angle * Math.PI) / 180);
    return [
      ["M", startX, startY],
      ["L", cosx + startX, sinx + startY],
    ];
  }

  function calculateCurvedLine(startX, startY, endX, endY) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    return [
      ["M", startX, startY],
      ["Q", midX, midY, endX, endY],
    ];
  }

  function getEndPoint(path) {
    return path[1][0] === "Q"
      ? { x: path[1][3], y: path[1][4] }
      : { x: path[1][1], y: path[1][2] };
  }

  function updateLine(line, canvas) {
    line.setCoords();
    line.dirty = true;
    canvas.renderAll();
  }

  function setLineDimensions(line) {
    const dims = line._calcDimensions();
    line
      .set({
        width: dims.width,
        height: dims.height,
        left: dims.left,
        top: dims.top,
        pathOffset: {
          x: dims.width / 2 + dims.left,
          y: dims.height / 2 + dims.top,
        },
        dirty: true,
      })
      .setCoords();
  }

  function syncControlPoints(line) {
    if (line.p0)
      line.p0
        .set({ left: line.path[0][1] - 7.5, top: line.path[0][2] - 7.5 })
        .setCoords();
    if (line.p2) {
      const endPoint = getEndPoint(line.path);
      line.p2
        .set({ left: endPoint.x - 7.5, top: endPoint.y - 7.5 })
        .setCoords();
    }
    if (line.p1 && line.path[1][0] === "Q") {
      line.p1
        .set({ left: line.path[1][1] - 7.5, top: line.path[1][2] - 7.5 })
        .setCoords();
    }
    [line.p0, line.p2, line.p1].forEach((point) => point?.bringToFront());
  }

  function createControlPoint(left, top, line1, line2, line3, isMidPoint = false) {
    return new fabric.Circle({
      left,
      top,
      radius: 6,
      fill: "#fff",
      stroke: isMidPoint ? "rgb(255, 100, 100)" : "rgb(0, 120, 215)",
      strokeWidth: 3,
      selectable: true,
      evented: true,
      isControlPoint: true,
      hoverCursor: "crosshair",
      hasBorders: false,
      hasControls: false,
      visible: false,
      line1,
      line2,
      line3,
    });
  }

  function attachControlPoints(fabricCanvas, line, startPoint, endPoint, midPoint) {
    if (line.p0) fabricCanvas.remove(line.p0);
    if (line.p2) fabricCanvas.remove(line.p2);
    if (line.p1) fabricCanvas.remove(line.p1);

    const p0 = createControlPoint(startPoint.x - 7.5, startPoint.y - 7.5, line, null, null);
    p0.name = "p0";
    const p2 = createControlPoint(endPoint.x - 7.5, endPoint.y - 7.5, null, null, line);
    p2.name = "p2";
    const p1 = midPoint
      ? createControlPoint(midPoint.x - 7.5, midPoint.y - 7.5, null, line, null, true)
      : null;
    if (p1) p1.name = "p1";

    line.p0 = p0;
    line.p2 = p2;
    line.p1 = p1;

    fabricCanvas.add(p0, p2);
    if (p1) fabricCanvas.add(p1);

    attachControlPointEvents(fabricCanvas, line, p0, p2, p1);
  }

  function attachControlPointEvents(fabricCanvas, line, p0, p2, p1) {
    const controlPoints = { p0, p2, p1 };

    const moveHandlers = {
      p0: (point) => {
        line.path[0][1] = point.left + 7.5;
        line.path[0][2] = point.top + 7.5;
      },
      p2: (point) => {
        if (line.path[1][0] === "Q") {
          line.path[1][3] = point.left + 7.5;
          line.path[1][4] = point.top + 7.5;
        } else {
          line.path[1][1] = point.left + 7.5;
          line.path[1][2] = point.top + 7.5;
        }
      },
      p1: (point) => {
        if (line.path[1][0] !== "Q") {
          const midX = (line.path[0][1] + line.path[1][1]) / 2;
          const midY = (line.path[0][2] + line.path[1][2]) / 2;
          line.path[1] = ["Q", midX, midY, line.path[1][1], line.path[1][2]];
        }
        line.path[1][1] = point.left + 7.5;
        line.path[1][2] = point.top + 7.5;
      },
    };

    Object.entries(controlPoints).forEach(([key, point]) => {
      if (!point) return;

      point.on("moving", function () {
        moveHandlers[key](this);
        setLineDimensions(line);
        syncControlPoints(line);
        fabricCanvas.setActiveObject(line);
        updateLine(line, fabricCanvas);
      });

      point.on("selected", () => {
        Object.values(controlPoints).forEach((p) =>
          p?.set({ visible: true }).bringToFront()
        );
        fabricCanvas.renderAll();
      });

      point.on("deselected", () => {
        Object.values(controlPoints).forEach(
          (p) => !p?.selected && p?.set({ visible: false })
        );
        fabricCanvas.renderAll();
      });
    });

    line.on("selected", () => {
      line.set({ hasControls: false, borderColor: "#aaaaaa", padding: 6 });
      Object.values(controlPoints).forEach((p) =>
        p?.set({ visible: true }).bringToFront()
      );
      fabricCanvas.renderAll();
    });

    line.on("deselected", () => {
      Object.values(controlPoints).forEach(
        (p) => !p?.selected && p?.set({ visible: false })
      );
      fabricCanvas.renderAll();
    });

    line._lastLeft = line.left;
    line._lastTop = line.top;

    line.on("moving", (e) => {
      if (!e.transform || !e.transform.target) {
        console.warn("e.transform data is incomplete in line moving event", e);
        return;
      }

      const delta = {
        x: e.transform.target.left - (line._lastLeft || e.transform.target.left),
        y: e.transform.target.top - (line._lastTop || e.transform.target.top),
      };

      if (delta.x !== 0 || delta.y !== 0) {
        moveLine(line, delta);
        setLineDimensions(line);
        syncControlPoints(line);
        console.log("Line moved with delta:", delta);

        line._lastLeft = e.transform.target.left;
        line._lastTop = e.transform.target.top;

        fabricCanvas.renderAll();
      } else {
        console.log("No movement detected", delta);
      }
    });
  }

  function moveLine(line, delta) {
    line.path[0][1] += delta.x;
    line.path[0][2] += delta.y;
    if (line.path[1][0] === "Q") {
      line.path[1][1] += delta.x;
      line.path[1][2] += delta.y;
      line.path[1][3] += delta.x;
      line.path[1][4] += delta.y;
    } else {
      line.path[1][1] += delta.x;
      line.path[1][2] += delta.y;
    }
  }

  fabricCanvas.on("object:removed", (e) => {
    const obj = e.target;
    [obj.p0, obj.p2, obj.p1].forEach(
      (point) => point && fabricCanvas.remove(point)
    );
  });

  fabricCanvas.on("mouse:down", (o) => {
    if (isDrawingLine) return;
    const target = fabricCanvas.findTarget(o.e, false);
    if (target && !target.isControlPoint) fabricCanvas.renderAll();
  });
}

export { lineDrawing };