export function autoAlignment(canvas) {
  const snapThreshold = 3;
  const canvasSnapLineColor = "rgb(255, 0, 0)";
  const objectSnapLineColor = "rgb(255, 165, 0)";
  const snapLineWidth = 1.5;
  const snapLineDash = [5, 5];

  let verticalLines = [];
  let horizontalLines = [];

  function clearLines() {
    verticalLines.forEach((line) => canvas.remove(line));
    horizontalLines.forEach((line) => canvas.remove(line));
    verticalLines = [];
    horizontalLines = [];
  }

  canvas.on("object:moving", (e) => {
    const activeObject = e.target;
    if (!activeObject) return;

    clearLines();

    activeObject.setCoords();
    const objBBox = activeObject.getBoundingRect();
    const objVCenter = objBBox.left + objBBox.width / 2;
    const objHCenter = objBBox.top + objBBox.height / 2;

    const canvasVerticalSnapPoints = [];
    const canvasHorizontalSnapPoints = [];
    const objectVerticalSnapPoints = [];
    const objectHorizontalSnapPoints = [];

    const vpt = canvas.vptCoords;
    const zoom = canvas.getZoom();
    const viewportWidth = canvas.width / zoom;
    const viewportHeight = canvas.height / zoom;
    canvasVerticalSnapPoints.push(
      vpt.tl.x,
      vpt.tl.x + viewportWidth / 2,
      vpt.br.x
    );
    canvasHorizontalSnapPoints.push(
      vpt.tl.y,
      vpt.tl.y + viewportHeight / 2,
      vpt.br.y
    );

    canvas.getObjects().forEach((obj) => {
      if (!obj.visible || obj === activeObject) {
        return;
      }

      if (
        activeObject.type === "activeselection" &&
        activeObject.contains(obj)
      ) {
        return;
      }

      const br = obj.getBoundingRect();
      const center = obj.getCenterPoint();
      objectVerticalSnapPoints.push(br.left, center.x, br.left + br.width);
      objectHorizontalSnapPoints.push(br.top, center.y, br.top + br.height);
    });

    let closestV = {
      dist: snapThreshold,
      correction: 0,
      snapPoint: 0,
      source: "none",
    };
    let closestH = {
      dist: snapThreshold,
      correction: 0,
      snapPoint: 0,
      source: "none",
    };

    const checkSnapping = (points, source, isVertical) => {
      const target = isVertical ? closestV : closestH;
      const { left, top, width, height } = objBBox;
      const center = isVertical ? objVCenter : objHCenter;
      const start = isVertical ? left : top;
      const end = isVertical ? left + width : top + height;

      points.forEach((snapPoint) => {
        let dist = Math.abs(start - snapPoint);
        if (dist < target.dist) {
          target.dist = dist;
          target.correction = snapPoint - start;
          target.snapPoint = snapPoint;
          target.source = source;
        }
        dist = Math.abs(center - snapPoint);
        if (dist < target.dist) {
          target.dist = dist;
          target.correction = snapPoint - center;
          target.snapPoint = snapPoint;
          target.source = source;
        }
        dist = Math.abs(end - snapPoint);
        if (dist < target.dist) {
          target.dist = dist;
          target.correction = snapPoint - end;
          target.snapPoint = snapPoint;
          target.source = source;
        }
      });
    };

    checkSnapping(canvasVerticalSnapPoints, "canvas", true);
    checkSnapping(objectVerticalSnapPoints, "object", true);
    checkSnapping(canvasHorizontalSnapPoints, "canvas", false);
    checkSnapping(objectHorizontalSnapPoints, "object", false);

    let snapped = false;
    if (closestV.dist < snapThreshold) {
      activeObject.left += closestV.correction;
      const color =
        closestV.source === "canvas"
          ? canvasSnapLineColor
          : objectSnapLineColor;
      drawVerticalLine(closestV.snapPoint, color);
      snapped = true;
    }
    if (closestH.dist < snapThreshold) {
      activeObject.top += closestH.correction;
      const color =
        closestH.source === "canvas"
          ? canvasSnapLineColor
          : objectSnapLineColor;
      drawHorizontalLine(closestH.snapPoint, color);
      snapped = true;
    }

    if (snapped) {
      activeObject.setCoords();
    }
  });

  canvas.on("mouse:up", clearLines);
  canvas.on("selection:cleared", clearLines);

  function drawVerticalLine(left, color) {
    const vpt = canvas.vptCoords;
    let lineLeft = left;

    if (lineLeft >= vpt.br.x) {
      lineLeft = vpt.br.x - 1;
    }

    const line = new fabric.Line([lineLeft, -9999, lineLeft, 9999], {
      stroke: color,
      strokeWidth: snapLineWidth,
      strokeDashArray: snapLineDash,
      selectable: false,
      evented: false,
      noFocusing: true,
    });
    verticalLines.push(line);
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  function drawHorizontalLine(top, color) {
    const vpt = canvas.vptCoords;
    let lineTop = top;

    if (lineTop >= vpt.br.y) {
      lineTop = vpt.br.y - 1;
    }

    const line = new fabric.Line([-9999, lineTop, 9999, lineTop], {
      stroke: color,
      strokeWidth: snapLineWidth,
      strokeDashArray: snapLineDash,
      selectable: false,
      evented: false,
      noFocusing: true,
    });
    horizontalLines.push(line);
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  canvas.distributeHorizontally = function () {
    const selection = this.getActiveObject();
    if (
      !selection ||
      selection.type !== "activeselection" ||
      selection.size() < 3
    )
      return;

    const objects = selection.getObjects().sort((a, b) => a.left - b.left);
    const leftMost = objects[0];
    const rightMost = objects[objects.length - 1];
    const totalWidth = objects.reduce(
      (sum, obj) => sum + obj.getScaledWidth(),
      0
    );
    const totalSpan =
      rightMost.left + rightMost.getScaledWidth() - leftMost.left;
    const spacing = (totalSpan - totalWidth) / (objects.length - 1);

    let currentLeft = leftMost.left + leftMost.getScaledWidth() + spacing;
    for (let i = 1; i < objects.length - 1; i++) {
      objects[i].set("left", currentLeft);
      currentLeft += objects[i].getScaledWidth() + spacing;
    }
    this.renderAll();
    this.fire("object:modified", { target: selection });
  };

  canvas.distributeVertically = function () {
    const selection = this.getActiveObject();
    if (
      !selection ||
      selection.type !== "activeselection" ||
      selection.size() < 3
    )
      return;

    const objects = selection.getObjects().sort((a, b) => a.top - b.top);
    const topMost = objects[0];
    const bottomMost = objects[objects.length - 1];
    const totalHeight = objects.reduce(
      (sum, obj) => sum + obj.getScaledHeight(),
      0
    );
    const totalSpan =
      bottomMost.top + bottomMost.getScaledHeight() - topMost.top;
    const spacing = (totalSpan - totalHeight) / (objects.length - 1);

    let currentTop = topMost.top + topMost.getScaledHeight() + spacing;
    for (let i = 1; i < objects.length - 1; i++) {
      objects[i].set("top", currentTop);
      currentTop += objects[i].getScaledHeight() + spacing;
    }
    this.renderAll();
    this.fire("object:modified", { target: selection });
  };

  canvas.alignObjects = function (edge) {
    const selection = this.getActiveObject();
    if (!selection) return;
    const objects =
      selection.type === "activeselection"
        ? selection.getObjects()
        : [selection];
    if (objects.length < 2 && selection.type !== "activeselection") return;

    const selectionBounds = selection.getBoundingRect();

    objects.forEach((obj) => {
      switch (edge) {
        case "left":
          obj.set("left", selectionBounds.left);
          break;
        case "right":
          obj.set(
            "left",
            selectionBounds.left + selectionBounds.width - obj.getScaledWidth()
          );
          break;
        case "top":
          obj.set("top", selectionBounds.top);
          break;
        case "bottom":
          obj.set(
            "top",
            selectionBounds.top + selectionBounds.height - obj.getScaledHeight()
          );
          break;
        case "center-h":
          obj.set(
            "left",
            selectionBounds.left +
              selectionBounds.width / 2 -
              obj.getScaledWidth() / 2
          );
          break;
        case "center-v":
          obj.set(
            "top",
            selectionBounds.top +
              selectionBounds.height / 2 -
              obj.getScaledHeight() / 2
          );
          break;
      }
      obj.setCoords();
    });

    this.renderAll();
    this.fire("object:modified", { target: selection });
  };
}
