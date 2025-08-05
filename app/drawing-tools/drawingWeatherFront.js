// @ts-nocheck
import { imgEditor } from "../index.ts";
import { updateScaleControlPoints } from "../utils/utils.js";
import { updateControlPointsAndPath } from "./drawingArrow.js";
import { WeatherFrontLine } from "./weatherFrontLine copy.js";

let isControl = false;
let isScale = false;

function inRange(radius, cursorX, cursorY, targetX, targetY) {
  return (
    Math.abs(cursorX - targetX) <= radius &&
    Math.abs(cursorY - targetY) <= radius
  );
}

function createControlPoint(left, top, front, isMidPoint = false) {
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
    parentFront: front,
    offsetX: -7.5,
    offsetY: -7.5,
  });
}

function calculateQuadraticBezierLength(
  startX,
  startY,
  midX,
  midY,
  endX,
  endY
) {
  const ax = startX - 2 * midX + endX;
  const ay = startY - 2 * midY + endY;
  const bx = 2 * (midX - startX);
  const by = 2 * (midY - startY);

  const integrand = (t) => {
    const dx_dt = 2 * ax * t + bx;
    const dy_dt = 2 * ay * t + by;
    return Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt);
  };

  const gaussPoints = [
    { t: 0.5 - 0.5 * Math.sqrt(3 / 5), w: 5 / 9 },
    { t: 0.5, w: 8 / 9 },
    { t: 0.5 + 0.5 * Math.sqrt(3 / 5), w: 5 / 9 },
  ];

  let length = 0;
  for (const point of gaussPoints) {
    length += point.w * integrand(point.t);
  }
  length *= 0.5;

  return length;
}

function createSemicirclePath(centerX, centerY, shapeSize, tangentAngle) {
  const cosAngle = Math.cos(tangentAngle);
  const sinAngle = Math.sin(tangentAngle);
  const arcStartX = centerX - shapeSize * cosAngle;
  const arcStartY = centerY - shapeSize * sinAngle;
  const arcEndX = centerX + shapeSize * cosAngle;
  const arcEndY = centerY + shapeSize * sinAngle;
  return `M${arcStartX},${arcStartY} A${shapeSize},${shapeSize} 0 0 1 ${arcEndX},${arcEndY}`;
}

function createTrianglePath(centerX, centerY, shapeSize, tangentAngle) {
  const cosAngle = Math.cos(tangentAngle);
  const sinAngle = Math.sin(tangentAngle);
  const baseLeftX = centerX - shapeSize * cosAngle;
  const baseLeftY = centerY - shapeSize * sinAngle;
  const baseRightX = centerX + shapeSize * cosAngle;
  const baseRightY = centerY + shapeSize * sinAngle;
  const apexX = centerX + shapeSize * sinAngle;
  const apexY = centerY - shapeSize * cosAngle;
  return `M${baseLeftX},${baseLeftY} L${baseRightX},${baseRightY} L${apexX},${apexY} Z`;
}

function generateWeatherFrontPath(front, fabricCanvas) {
  const { path, frontType, isReflect: originalIsReflect } = front;
  const isReflect =
    frontType === "stationary" ? !originalIsReflect : originalIsReflect;
  if (!path || path.length < 2) return;

  if (front.visible === false || front.isScaledInGroup === true) {
    return;
  }

  if (front.shapeObjects) {
    front.shapeObjects.forEach((obj) => fabricCanvas.remove(obj));
  }
  front.shapeObjects = [];

  const defaultSpacing = 24;
  const defaultShapeSize = 8;

  const frontStyles = {
    warm: {
      lineColor: "red",
      shape: "semicircle",
      shapeColor: "red",
      spacing: defaultSpacing,
      shapeSize: defaultShapeSize,
    },
    cold: {
      lineColor: "blue",
      shape: "triangle",
      shapeColor: "blue",
      spacing: defaultSpacing,
      shapeSize: defaultShapeSize,
    },
    stationary: {
      lineColor: "black",
      shape: "alternate",
      shapeColor: ["red", "blue"],
      spacing: defaultSpacing,
      shapeSize: defaultShapeSize,
    },
    occluded: {
      lineColor: "purple",
      shape: "alternate",
      shapeColor: ["purple", "purple"],
      spacing: defaultSpacing,
      shapeSize: defaultShapeSize,
    },
  };
  const style = frontStyles[frontType] || frontStyles.warm;
  const { lineColor, shape, shapeColor, spacing, shapeSize } = style;

  let pathD = "";
  const referenceAngle = 180;
  let lastShapePosition = null;
  const groupObjects = [];

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];

    const startX = start[0] === "M" ? start[1] : start[3] || start[1];
    const startY = start[0] === "M" ? start[2] : start[4] || start[2];
    const endX = end[0] === "Q" ? end[3] : end[1];
    const endY = end[0] === "Q" ? end[4] : end[2];

    const dx = endX - startX;
    const dy = endY - startY;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (i === 0) {
      pathD += `M${startX},${startY}`;
    }
    if (end[0] === "Q") {
      pathD += ` Q${end[1]},${end[2]} ${endX},${endY}`;
    } else {
      pathD += ` L${endX},${endY}`;
    }

    const line = new fabric.Path(pathD, {
      stroke: lineColor,
      strokeWidth: 0,
      fill: false,
      selectable: false,
      evented: false,
      noFocusing: true,
      hasControls: false,
      frontShape: true,
    });
    groupObjects.push(line);

    let actualSegmentLength = segmentLength;
    if (end[0] === "Q") {
      const midX = end[1];
      const midY = end[2];
      actualSegmentLength = calculateQuadraticBezierLength(
        startX,
        startY,
        midX,
        midY,
        endX,
        endY
      );
    }

    let distAccum = spacing / 2;
    let shapeIndex =
      i === 0 ? 0 : groupObjects.length % (shape === "alternate" ? 2 : 1);

    while (distAccum < actualSegmentLength) {
      let x, y, tangentAngle;
      let ratio = distAccum / actualSegmentLength;

      if (end[0] === "Q") {
        const midX = end[1];
        const midY = end[2];
        const targetArcLength = distAccum;
        let t = 0;
        let arcLength = 0;
        const steps = 100;
        const dt = 1 / steps;
        for (let j = 0; j < steps; j++) {
          const t0 = j * dt;
          const t1 = (j + 1) * dt;
          const midT = (t0 + t1) / 2;
          const dx_dt =
            2 * (1 - midT) * (midX - startX) + 2 * midT * (endX - midX);
          const dy_dt =
            2 * (1 - midT) * (midY - startY) + 2 * midT * (endY - midY);
          const speed = Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt);
          arcLength += speed * dt;
          if (arcLength >= targetArcLength) {
            t = t0 + (targetArcLength - (arcLength - speed * dt)) / speed;
            break;
          }
        }
        if (arcLength < targetArcLength) t = 1;
        ratio = t;

        x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

        const dx_dt = 2 * (1 - t) * (midX - startX) + 2 * t * (endX - midX);
        const dy_dt = 2 * (1 - t) * (midY - startY) + 2 * t * (endY - midY);
        const magnitude = Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt);
        tangentAngle = magnitude > 0 ? Math.atan2(dy_dt, dx_dt) : angle;
      } else {
        x = startX + ratio * (endX - startX);
        y = startY + ratio * (endY - startY);
        tangentAngle = angle;
      }

      if (lastShapePosition) {
        const distanceToLast = Math.sqrt(
          (x - lastShapePosition.x) ** 2 + (y - lastShapePosition.y) ** 2
        );
        if (distanceToLast < spacing / 2) {
          distAccum += spacing;
          continue;
        }
      }

      const angleDeg = (tangentAngle * 180) / Math.PI;
      const normalizedAngle = ((angleDeg % 360) + 360) % 360;
      const diagonalAngles = [45, 135, 225, 315];
      const minDistance = Math.min(
        ...diagonalAngles.map((d) => {
          const dist = Math.abs(normalizedAngle - d);
          return dist > 180 ? 360 - dist : dist;
        })
      );
      const maxOffset = shapeSize * 0.5;
      const offsetY =
        frontType === "stationary" && shape === "alternate"
          ? shapeIndex % 2 === 0
            ? maxOffset * (minDistance / 45)
            : -(maxOffset * (minDistance / 45))
          : maxOffset * (minDistance / 45);

      const normalAngle = tangentAngle + (Math.PI / 2) * (isReflect ? -1 : 1);
      let centerX = x + offsetY * Math.cos(normalAngle);
      let centerY = y + offsetY * Math.sin(normalAngle);

      const offsetFactor = shapeSize * 0.15;
      const dx = offsetFactor * Math.cos(normalAngle + Math.PI / 2);
      const dy = offsetFactor * Math.sin(normalAngle + Math.PI / 2);
      centerX += dx;
      centerY += dy;

      if (normalAngle >= -1.5 && normalAngle < 0) {
        centerX += offsetFactor;
      } else if (normalAngle >= 0 && normalAngle < 1.5) {
        centerX += offsetFactor;
        centerY += offsetFactor;
      } else if (normalAngle >= 1.5 && normalAngle < 3.0) {
        centerY += offsetFactor;
      } else if (normalAngle >= 2.9) {
        centerX += offsetFactor;
        centerY += offsetFactor;
      }

      let shapePath, fillColor, rotationAngle;
      const baseAngle = tangentAngle / Math.PI;
      rotationAngle = referenceAngle + baseAngle + (isReflect ? 180 : 0);

      if (shape === "semicircle") {
        shapePath = createSemicirclePath(
          centerX,
          centerY,
          shapeSize,
          tangentAngle
        );
        fillColor = shapeColor;
      } else if (shape === "triangle") {
        shapePath = createTrianglePath(
          centerX,
          centerY,
          shapeSize,
          tangentAngle
        );
        fillColor = shapeColor;
      } else if (shape === "alternate") {
        const isSemicircle = shapeIndex % 2 === 0;
        shapePath = isSemicircle
          ? createSemicirclePath(centerX, centerY, shapeSize, tangentAngle)
          : createTrianglePath(centerX, centerY, shapeSize, tangentAngle);
        fillColor = shapeColor[shapeIndex % 2];
        if (frontType === "stationary" && !isSemicircle) {
          rotationAngle += 180;
        }
        shapeIndex++;
      }

      const shapeObject = new fabric.Path(shapePath, {
        fill: fillColor,
        stroke: "none",
        strokeWidth: 0,
        angle: rotationAngle,
        selectable: false,
        evented: false,
        noFocusing: true,
        hasControls: false,
        originX: "center",
        originY: "center",
        left: centerX,
        top: centerY,
        scaleX: 1,
        scaleY: 1,
        strokeUniform: true,
        frontShape: true,
      });
      groupObjects.push(shapeObject);

      lastShapePosition = { x, y };
      distAccum += spacing;
    }
  }

  const frontGroup = new fabric.Group(groupObjects, {
    selectable: false,
    evented: false,
    noFocusing: true,
    hasControls: false,
    frontShape: true,
  });
  front.shapeObjects.push(frontGroup);
  fabricCanvas.add(frontGroup);

  front.pathD = pathD;
  front.set({
    stroke: lineColor,
    path: fabric.util.parsePath(pathD),
    scaleX: 1,
    scaleY: 1,
    dirty: true,
  });
}

function attachControlPoints(fabricCanvas, front, moveLeft, moveTop) {
  if (!front || !front.path || front.path.length < 2) return;

  if (front.controlPoints) {
    front.controlPoints.forEach((point) => {
      fabricCanvas.remove(point);
      fabricCanvas.renderAll();
    });
  }

  if (!moveLeft) {
    moveLeft = 0;
  }

  if (!moveTop) {
    moveTop = 0;
  }

  front.controlPoints = [];

  const newFront = [];
  for (let i = 0; i < front.path.length; i++) {
    if (i === 0) {
      newFront.push(front.path[i]);
      continue;
    }
    const prev = front.path[i - 1];
    const curr = front.path[i];
    if (curr[0] === "L") {
      const startX = prev[0] === "M" ? prev[1] : prev[prev.length - 2];
      const startY = prev[0] === "M" ? prev[2] : prev[prev.length - 1];
      const endX = curr[1];
      const endY = curr[2];
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      newFront.push(["Q", midX, midY, endX, endY]);
    } else {
      newFront.push(curr);
    }
  }
  front.path = newFront;

  const oCoords = front.oCoords || {};
  const minX = oCoords.tl ? oCoords.tl.x : front.left || 0;
  const maxX = oCoords.br ? oCoords.br.x : front.left || 0;
  const minY = oCoords.tl ? oCoords.tl.y : front.top || 0;
  const maxY = oCoords.br ? oCoords.br.y : front.top || 0;
  const isValidOCoords =
    minX !== maxX && minY !== maxY && oCoords.tl && oCoords.br;

  let pathMinX = Infinity,
    pathMaxX = -Infinity,
    pathMinY = Infinity,
    pathMaxY = -Infinity;
  front.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      pathMinX = Math.min(pathMinX, segment[1]);
      pathMaxX = Math.max(pathMaxX, segment[1]);
      pathMinY = Math.min(pathMinY, segment[2]);
      pathMaxY = Math.max(pathMaxY, segment[2]);
    } else if (segment[0] === "Q") {
      pathMinX = Math.min(pathMinX, segment[1], segment[3]);
      pathMaxX = Math.max(pathMaxX, segment[1], segment[3]);
      pathMinY = Math.min(pathMinY, segment[2], segment[4]);
      pathMaxY = Math.max(pathMaxY, segment[2], segment[4]);
    }
  });

  const scaleX = front.scaleX || 1;
  const scaleY = front.scaleY || 1;
  let adjustedScaleX = scaleX;
  let adjustedScaleY = scaleY;
  const pathWidth = pathMaxX - pathMinX;
  const pathHeight = pathMaxY - pathMinY;
  const oCoordsWidth = maxX - minX;
  const oCoordsHeight = maxY - minY;

  if (isValidOCoords && pathWidth > 0 && pathHeight > 0) {
    if (pathWidth * scaleX > oCoordsWidth) {
      adjustedScaleX = oCoordsWidth / pathWidth;
    }
    if (pathHeight * scaleY > oCoordsHeight) {
      adjustedScaleY = oCoordsHeight / pathHeight;
    }
  }
  adjustedScaleX = Math.max(0.01, adjustedScaleX);
  adjustedScaleY = Math.max(0.01, adjustedScaleY);

  for (let i = 0; i < front.path.length - 1; i++) {
    const start = i === 0 ? front.path[0] : front.path[i];
    const end = front.path[i + 1];

    const startX = start[0] === "M" || start[0] === "L" ? start[1] : start[3];
    const startY = start[0] === "M" || start[0] === "L" ? start[2] : start[4];
    const endX = end[0] === "Q" ? end[3] : end[1];
    const endY = end[0] === "Q" ? end[4] : end[2];

    let controlStartX = startX;
    let controlStartY = startY;
    let controlEndX = endX;
    let controlEndY = endY;
    let controlMidX, controlMidY;

    if (end[0] === "Q") {
      controlMidX = end[1];
      controlMidY = end[2];
    }

    if (scaleX !== 1 || scaleY !== 1) {
      controlStartX = (startX - pathMinX) * adjustedScaleX + minX;
      controlStartY = (startY - pathMinY) * adjustedScaleY + minY;
      controlEndX = (endX - pathMinX) * adjustedScaleX + minX;
      controlEndY = (endY - pathMinY) * adjustedScaleY + minY;
      if (end[0] === "Q") {
        controlMidX = (end[1] - pathMinX) * adjustedScaleX + minX;
        controlMidY = (end[2] - pathMinY) * adjustedScaleY + minY;
      }
    }

    if (i === 0) {
      const p0 = createControlPoint(
        controlStartX - 7.5 + moveLeft,
        controlStartY - 7.5 + moveTop,
        front
      );
      p0.segmentIndex = i;
      p0.isStart = true;
      front.controlPoints.push(p0);
      fabricCanvas.add(p0);
    }

    const p2 = createControlPoint(
      controlEndX - 7.5 + moveLeft,
      controlEndY - 7.5 + moveTop,
      front
    );
    p2.segmentIndex = i;
    front.controlPoints.push(p2);
    fabricCanvas.add(p2);

    if (end[0] === "Q") {
      const p1 = createControlPoint(
        controlMidX - 7.5 + moveLeft,
        controlMidY - 7.5 + moveTop,
        front,
        true
      );
      p1.segmentIndex = i;
      p1.isMidPoint = true;
      front.controlPoints.push(p1);
      fabricCanvas.add(p1);
    }
  }

  if (!front._isEventHandlersAttached) {
    attachWeatherFrontEventHandlers(fabricCanvas, front);
    front._isEventHandlersAttached = true;
  }

  bindControlPoints(front);
  attachControlPointEvents(fabricCanvas, front);
  updateScaleControlPoints(fabricCanvas);
  fabricCanvas.renderAll();
}

function attachWeatherFrontEventHandlers(fabricCanvas, front) {
  let lastMousePos = null;

  front.on("selected", function () {
    if (fabricCanvas.getActiveObjects().length > 1) return;

    front.isScaledInGroup = false;

    if (this.scaleX !== 1 || this.scaleY !== 1) {
      if (this.shapeObjects) {
        this.shapeObjects.forEach((obj) => fabricCanvas.remove(obj));
        this.shapeObjects = [];
      }
      updateWeatherFrontPath(
        this,
        this.lastFrontMatrix || [1, 0, 0, 1, 0, 0],
        null,
        null
      );
      generateWeatherFrontPath(this, fabricCanvas);
      attachControlPoints(fabricCanvas, this);
    } else if (!isControl) {
      syncWeatherFrontWithControlPoints(this, fabricCanvas);
      updateControlPoints(this);
      generateWeatherFrontPath(this, fabricCanvas);
    }

    if (this.controlPoints) {
      this.controlPoints.forEach((p) => {
        p.set({ visible: true });
        fabricCanvas.bringObjectToFront(p);
      });
    }
    isControl = false;
    fabricCanvas.renderAll();
  });

  front.on("deselected", function () {
    if (this.controlPoints) {
      this.controlPoints.forEach(
        (p) => !p.selected && p.set({ visible: false })
      );
    }
    fabricCanvas.renderAll();
  });

  front.on("moving", function () {
    if (this.shapeObjects) {
      this.shapeObjects.forEach((obj) => fabricCanvas.remove(obj));
      this.shapeObjects = [];
    }
    updateControlPoints(this);
    generateWeatherFrontPath(this, fabricCanvas);
    updateWeatherFrontDimensions(this);
    this.controlPoints.forEach((p) => fabricCanvas.bringObjectToFront(p));
    fabricCanvas.renderAll();
  });

  front.on("scaling", function (e) {
    isScale = true;

    const corner = e.transform?.corner;
    const pointer = fabricCanvas.getPointer(e.e);

    let direction = null;
    if (lastMousePos) {
      const center = this.getCenterPoint();
      const distToCenter = Math.sqrt(
        (pointer.x - center.x) ** 2 + (pointer.y - center.y) ** 2
      );
      const prevDistToCenter = Math.sqrt(
        (lastMousePos.x - center.x) ** 2 + (lastMousePos.y - center.y) ** 2
      );
      direction = distToCenter > prevDistToCenter ? "outward" : "inward";
    }
    lastMousePos = pointer;

    const lastFrontMatrix = this.lastFrontMatrix || [1, 0, 0, 1, 0, 0];
    updateWeatherFrontPath(this, lastFrontMatrix, corner, direction);

    if (this.controlPoints) {
      this.controlPoints.forEach((point) => this.canvas.remove(point));
      this.controlPoints = [];
    }
    if (this.shapeObjects) {
      this.shapeObjects.forEach((obj) => fabricCanvas.remove(obj));
      this.shapeObjects = [];
    }

    const matrix = this.calcTransformMatrix();
    this.set({
      lastFrontMatrix: matrix,
    });

    updateWeatherFrontDimensions(this);
    generateWeatherFrontPath(this, fabricCanvas);
    attachControlPoints(fabricCanvas, this);
    this.canvas.renderAll();
  });

  fabricCanvas.on("mouse:move", (e) => {
    if (isScale) {
      lastMousePos = fabricCanvas.getPointer(e.e);
    }
  });

  fabricCanvas.on("mouse:up", () => {
    if (isScale) {
      isScale = false;
      lastMousePos = null;
      if (fabricCanvas.getActiveObjects().length === 1) {
        const temp = fabricCanvas.getActiveObjects()[0];
        fabricCanvas.discardActiveObject();
        fabricCanvas.setActiveObject(temp);
      }
      generateWeatherFrontPath(front, fabricCanvas);
      attachControlPoints(fabricCanvas, front);
      fabricCanvas.renderAll();
    }
  });
}

function updateWeatherFrontPath(front, lastFrontMatrix, corner, direction) {
  if (!front || !front.path || front.path.length < 2) return;

  let scaleX = front.scaleX || 1;
  let scaleY = front.scaleY || 1;

  const { minX, maxX, minY, maxY } = calculatePathBounds(front.path);
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  const anchorPoints = {
    tl: { x: maxX, y: maxY },
    tr: { x: minX, y: maxY },
    bl: { x: maxX, y: minY },
    br: { x: minX, y: minY },
    mt: { x: centerX, y: maxY },
    mb: { x: centerX, y: minY },
    ml: { x: maxX, y: centerY },
    mr: { x: minX, y: centerY },
  };

  const scalingRules = {
    "tl-inward": { scaleX: true, scaleY: true },
    "tl-outward": { scaleX: true, scaleY: true },
    "tr-inward": { scaleX: true, scaleY: true },
    "tr-outward": { scaleX: true, scaleY: true },
    "bl-inward": { scaleX: true, scaleY: true },
    "bl-outward": { scaleX: true, scaleY: true },
    "br-inward": { scaleX: true, scaleY: true },
    "br-outward": { scaleX: true, scaleY: true },
    "mt-inward": { scaleX: false, scaleY: true },
    "mt-outward": { scaleX: false, scaleY: true },
    "mb-inward": { scaleX: false, scaleY: true },
    "mb-outward": { scaleX: false, scaleY: true },
    "ml-inward": { scaleX: true, scaleY: false },
    "ml-outward": { scaleX: true, scaleY: false },
    "mr-inward": { scaleX: true, scaleY: false },
    "mr-outward": { scaleX: true, scaleY: false },
  };

  if (corner && direction && scalingRules[`${corner}-${direction}`]) {
    const rule = scalingRules[`${corner}-${direction}`];
    if (!rule.scaleX) scaleX = 1;
    if (!rule.scaleY) scaleY = 1;
  } else {
    console.warn("Unknown corner or direction:", corner, direction);
    return;
  }

  const anchor = anchorPoints[corner] || { x: centerX, y: centerY };

  front.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      const x = segment[1];
      const y = segment[2];

      segment[1] = anchor.x + (x - anchor.x) * scaleX;
      segment[2] = anchor.y + (y - anchor.y) * scaleY;
    } else if (segment[0] === "Q") {
      const x1 = segment[1];
      const y1 = segment[2];
      const x2 = segment[3];
      const y2 = segment[4];

      segment[1] = anchor.x + (x1 - anchor.x) * scaleX;
      segment[2] = anchor.y + (y1 - anchor.y) * scaleY;
      segment[3] = anchor.x + (x2 - anchor.x) * scaleX;
      segment[4] = anchor.y + (y2 - anchor.y) * scaleY;
    }
  });

  if (front.shapeObjects && front.shapeObjects.length > 0) {
    front.shapeObjects.forEach((group) => {
      group._objects.forEach((shape) => {
        if (shape.frontShape && shape.path) {
          shape.path.forEach((segment) => {
            if (
              segment[0] === "M" ||
              segment[0] === "A" ||
              segment[0] === "L"
            ) {
              const x = segment[1];
              const y = segment[2];
              segment[1] = anchor.x + (x - anchor.x) * scaleX;
              segment[2] = anchor.y + (y - anchor.y) * scaleY;
            }
          });

          const shapeCenterX = anchor.x + (shape.left - anchor.x) * scaleX;
          const shapeCenterY = anchor.y + (shape.top - anchor.y) * scaleY;
          shape.set({
            left: shapeCenterX,
            top: shapeCenterY,
            scaleX: 1,
            scaleY: 1,
            dirty: true,
          });
          shape.setCoords();
        }
      });
      group.setCoords();
    });
  }

  front.set({
    path: front.path,
    scaleX: 1,
    scaleY: 1,
    dirty: true,
  });
  front.setCoords();
}

function calculatePathBounds(path) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      minX = Math.min(minX, segment[1]);
      maxX = Math.max(maxX, segment[1]);
      minY = Math.min(minY, segment[2]);
      maxY = Math.max(maxY, segment[2]);
    } else if (segment[0] === "Q") {
      minX = Math.min(minX, segment[1], segment[3]);
      maxX = Math.max(maxX, segment[1], segment[3]);
      minY = Math.min(minY, segment[2], segment[4]);
      maxY = Math.max(maxY, segment[2], segment[4]);
    }
  });
  return { minX, maxX, minY, maxY };
}

function applyWeatherFrontScaling(front, fabricCanvas, groupTransform = null) {
  const frontMatrix = front.calcTransformMatrix();
  const scaleX = frontMatrix[0] || 1;
  const scaleY = frontMatrix[3] || 1;
  const width = front.width || 0;
  const height = front.height || 0;
  const pathOffsetX = frontMatrix[4];
  const pathOffsetY = frontMatrix[5];

  const minX = pathOffsetX - width / 2;
  const maxX = pathOffsetX + width / 2;
  const minY = pathOffsetY - height / 2;
  const maxY = pathOffsetY + height / 2;
  const oCoordsWidth = maxX - minX;
  const oCoordsHeight = maxY - minY;

  const isValidOCoords =
    oCoordsWidth > 0 && oCoordsHeight > 0 && minX !== maxX && minY !== maxY;
  let fallbackBounds;
  if (!isValidOCoords) {
    fallbackBounds = front._calcDimensions();
    fallbackBounds.minX = fallbackBounds.left;
    fallbackBounds.maxX = fallbackBounds.left + fallbackBounds.width;
    fallbackBounds.minY = fallbackBounds.top;
    fallbackBounds.maxY = fallbackBounds.top + fallbackBounds.height;
  }

  let pathMinX = Infinity,
    pathMaxX = -Infinity,
    pathMinY = Infinity,
    pathMaxY = -Infinity;
  front.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      pathMinX = Math.min(pathMinX, segment[1]);
      pathMaxX = Math.max(pathMaxX, segment[1]);
      pathMinY = Math.min(pathMinY, segment[2]);
      pathMaxY = Math.max(pathMaxY, segment[2]);
    } else if (segment[0] === "Q") {
      pathMinX = Math.min(pathMinX, segment[1], segment[3]);
      pathMaxX = Math.max(pathMaxX, segment[1], segment[3]);
      pathMinY = Math.min(pathMinY, segment[2], segment[4]);
      pathMaxY = Math.max(pathMaxY, segment[2], segment[4]);
    }
  });
  const pathWidth = pathMaxX - pathMinX;
  const pathHeight = pathMaxY - pathMinY;

  let adjustedScaleX = scaleX;
  let adjustedScaleY = scaleY;
  if (isValidOCoords && pathWidth > 0 && pathHeight > 0) {
    if (pathWidth * scaleX > oCoordsWidth) {
      adjustedScaleX = oCoordsWidth / pathWidth;
    }
    if (pathHeight * scaleY > oCoordsHeight) {
      adjustedScaleY = oCoordsHeight / pathHeight;
    }
  }
  adjustedScaleX = Math.max(0.01, adjustedScaleX);
  adjustedScaleY = Math.max(0.01, adjustedScaleY);

  const pathLeftOffset = minX;
  const pathTopOffset = minY;

  const transformMatrix = groupTransform || [1, 0, 0, 1, 0, 0];
  front.path.forEach((segment) => {
    if (segment[0] === "M" || segment[0] === "L") {
      const x1 = (segment[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
      const y1 = (segment[2] - pathMinY) * adjustedScaleY + pathTopOffset;
      const transformed = fabric.util.transformPoint(
        new fabric.Point(x1, y1),
        transformMatrix
      );
      segment[1] = transformed.x;
      segment[2] = transformed.y;
    } else if (segment[0] === "Q") {
      const x1 = (segment[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
      const y1 = (segment[2] - pathMinY) * adjustedScaleY + pathTopOffset;
      const x2 = (segment[3] - pathMinX) * adjustedScaleX + pathLeftOffset;
      const y2 = (segment[4] - pathMinY) * adjustedScaleY + pathTopOffset;
      const transformed1 = fabric.util.transformPoint(
        new fabric.Point(x1, y1),
        transformMatrix
      );
      const transformed2 = fabric.util.transformPoint(
        new fabric.Point(x2, y2),
        transformMatrix
      );
      segment[1] = transformed1.x;
      segment[2] = transformed1.y;
      segment[3] = transformed2.x;
      segment[4] = transformed2.y;
    }
  });

  if (front.shapeObjects && front.shapeObjects.length > 0) {
    front.shapeObjects.forEach((group) => {
      group._objects.forEach((shape) => {
        if (shape.frontShape && shape.path) {
          shape.path.forEach((segment) => {
            if (segment[0] === "M" || segment[0] === "C") {
              const x =
                (segment[1] - pathMinX) * adjustedScaleX + pathLeftOffset;
              const y =
                (segment[2] - pathMinY) * adjustedScaleY + pathTopOffset;
              const transformed = fabric.util.transformPoint(
                new fabric.Point(x, y),
                transformMatrix
              );
              segment[1] = transformed.x;
              segment[2] = transformed.y;
              if (segment[0] === "C") {
                const x2 =
                  (segment[3] - pathMinX) * adjustedScaleX + pathLeftOffset;
                const y2 =
                  (segment[4] - pathMinY) * adjustedScaleY + pathTopOffset;
                const x3 =
                  (segment[5] - pathMinX) * adjustedScaleX + pathLeftOffset;
                const y3 =
                  (segment[6] - pathMinY) * adjustedScaleY + pathTopOffset;
                const transformed2 = fabric.util.transformPoint(
                  new fabric.Point(x2, y2),
                  transformMatrix
                );
                const transformed3 = fabric.util.transformPoint(
                  new fabric.Point(x3, y3),
                  transformMatrix
                );
                segment[3] = transformed2.x;
                segment[4] = transformed2.y;
                segment[5] = transformed3.x;
                segment[6] = transformed3.y;
              }
            }
          });
          const shapeCenterX =
            (shape.left - pathMinX) * adjustedScaleX + pathLeftOffset;
          const shapeCenterY =
            (shape.top - pathMinY) * adjustedScaleY + pathTopOffset;
          const transformedShape = fabric.util.transformPoint(
            new fabric.Point(shapeCenterX, shapeCenterY),
            transformMatrix
          );
          shape.set({
            left: transformedShape.x,
            top: transformedShape.y,
            scaleX: 1,
            scaleY: 1,
          });
          shape.setCoords();
        }
      });
      group.setCoords();
    });
  }

  const newLeft = isValidOCoords ? minX : originalLeft;
  const newTop = isValidOCoords ? minY : originalTop;

  updateWeatherFrontDimensions(front);
  front.set({ scaleX: 1, scaleY: 1, left: newLeft, top: newTop });
  attachControlPoints(fabricCanvas, front);
  generateWeatherFrontPath(front, fabricCanvas);
}

function bindControlPoints(front) {
  const frontTransform = front.calcTransformMatrix();
  const invertedFrontTransform = fabric.util.invertTransform(frontTransform);

  front.controlPoints.forEach((point) => {
    const pointTransform = point.calcTransformMatrix();
    point.relationship = fabric.util.multiplyTransformMatrices(
      invertedFrontTransform,
      pointTransform
    );
  });

  front.off("moving");
  front.on("moving", () => {
    if (front.shapeObjects && front.canvas) {
      front.shapeObjects.forEach((obj) => front.canvas.remove(obj));
      front.shapeObjects = [];
    }
    updateControlPoints(front);
    generateWeatherFrontPath(front, front.canvas);
    updateWeatherFrontDimensions(front);
    front.controlPoints.forEach((p) => front.canvas.bringObjectToFront(p));
    front.canvas.renderAll();
  });

  front.off("rotating");
  front.on("rotating", () => {
    if (front.shapeObjects) {
      front.shapeObjects.forEach((obj) => front.canvas.remove(obj));
      front.shapeObjects = [];
    }
    updateControlPoints(front);
    generateWeatherFrontPath(front, front.canvas);
    front.canvas.renderAll();
  });
}

function updateControlPoints(front) {
  if (!front || !front.controlPoints) return;
  if (!imgEditor.canvas) {
    console.error("Canvas is not initialized");
    return;
  }
  const frontTransform = front.calcTransformMatrix();
  const zoom = imgEditor.canvas.getZoom();

  front.controlPoints.forEach((point) => {
    if (!point.relationship) return;

    const newTransform = fabric.util.multiplyTransformMatrices(
      frontTransform,
      point.relationship
    );
    const opt = fabric.util.qrDecompose(newTransform);

    point.set({
      left: opt.translateX + point.offsetX / zoom,
      top: opt.translateY + point.offsetY / zoom,
    });
    point.setCoords();
  });

  syncWeatherFrontWithControlPoints(front, front.canvas, true);
}

function updateWeatherFrontFromControlPoints(front, movedPoint) {
  const segmentIndex = movedPoint.segmentIndex;
  const newX = movedPoint.left - movedPoint.offsetX;
  const newY = movedPoint.top - movedPoint.offsetY;

  if (movedPoint.isStart) {
    front.path[segmentIndex][1] = newX;
    front.path[segmentIndex][2] = newY;
  } else if (movedPoint.isMidPoint) {
    front.path[segmentIndex + 1][1] = newX;
    front.path[segmentIndex + 1][2] = newY;
  } else {
    const segment = front.path[segmentIndex + 1];
    if (segment[0] === "Q") {
      segment[3] = newX;
      segment[4] = newY;
    } else {
      segment[1] = newX;
      segment[2] = newY;
    }
  }

  if (front.shapeObjects) {
    front.shapeObjects.forEach((obj) => front.canvas.remove(obj));
    front.shapeObjects = [];
  }

  updateWeatherFrontDimensions(front);
  generateWeatherFrontPath(front, front.canvas);
  front.canvas.renderAll();
}

function syncWeatherFrontWithControlPoints(
  front,
  fabricCanvas,
  isMoving = false
) {
  if (!front.controlPoints || !front.path) return;

  let needsUpdate = false;
  front.controlPoints.forEach((point) => {
    const segmentIndex = point.segmentIndex;
    const actualX = point.left - point.offsetX;
    const actualY = point.top - point.offsetY;

    if (point.isStart) {
      const [cmd, x, y] = front.path[segmentIndex];
      if (x !== actualX || y !== actualY) {
        front.path[segmentIndex][1] = actualX;
        front.path[segmentIndex][2] = actualY;
        needsUpdate = true;
      }
    } else if (point.isMidPoint) {
      const [cmd, midX, midY, endX, endY] = front.path[segmentIndex + 1];
      if (midX !== actualX || midY !== actualY) {
        front.path[segmentIndex + 1][1] = actualX;
        front.path[segmentIndex + 1][2] = actualY;
        needsUpdate = true;
      }
    } else {
      const segment = front.path[segmentIndex + 1];
      const [cmd, x1, y1, x2, y2] =
        segment[0] === "Q"
          ? segment
          : [segment[0], null, null, segment[1], segment[2]];
      if (segment[0] === "Q" && (x2 !== actualX || y2 !== actualY)) {
        segment[3] = actualX;
        segment[4] = actualY;
        needsUpdate = true;
      } else if (segment[0] === "L" && (x1 !== actualX || y1 !== actualY)) {
        segment[1] = actualX;
        segment[2] = actualY;
        needsUpdate = true;
      }
    }
  });

  if (needsUpdate && !isMoving) {
    updateWeatherFrontDimensions(front);
    attachControlPoints(fabricCanvas, front);
    generateWeatherFrontPath(front, fabricCanvas);
  }
}

function attachControlPointEvents(fabricCanvas, front) {
  front.controlPoints.forEach((point) => {
    point.on("moving", () => {
      isControl = true;
      updateWeatherFrontFromControlPoints(front, point);
      bindControlPoints(front);
      front.controlPoints.forEach((p) => fabricCanvas.bringObjectToFront(p));
    });

    point.on("selected", () => {
      if (front.shapeObjects) {
        front.shapeObjects.forEach((obj) => fabricCanvas.remove(obj));
        front.shapeObjects = [];
      }
      generateWeatherFrontPath(front, fabricCanvas);
      front.controlPoints.forEach((p) => {
        p.set({ visible: true });
        fabricCanvas.bringObjectToFront(p);
      });
      fabricCanvas.renderAll();
    });

    point.on("deselected", () => {
      front.controlPoints.forEach(
        (p) => !p.selected && p.set({ visible: false })
      );
      generateWeatherFrontPath(front, fabricCanvas);
      fabricCanvas.renderAll();
    });

    point.on("mouseup", () => {
      fabricCanvas.setActiveObject(front);
      generateWeatherFrontPath(front, fabricCanvas);
      front.controlPoints.forEach((p) => fabricCanvas.bringObjectToFront(p));
      fabricCanvas.renderAll();
    });
  });
}

function updateWeatherFrontDimensions(front) {
  const dims = front._calcDimensions();
  front.set({
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
  front.setCoords();
}

function drawingWeatherFront(fabricCanvas, frontType = "warm") {
  fabricCanvas.isDrawingWeatherFrontMode = true;
  const front = new WeatherFrontLine(`M0 0 L0 0`, { frontType });
  front.initializeDrawing(fabricCanvas);
}

function removeAllFrontShapes(fabricCanvas) {
  const fronts = fabricCanvas
    .getObjects()
    .filter((obj) => obj.pathType === "weatherFront");
  fronts.forEach((front) => {
    if (front.shapeObjects) {
      front.shapeObjects.forEach((obj) => {
        fabricCanvas.remove(obj);
      });
      front.shapeObjects = [];
    }
  });
  fabricCanvas.renderAll();
}

export {
  drawingWeatherFront as weatherFrontDrawing,
  inRange,
  createControlPoint,
  attachControlPoints,
  bindControlPoints,
  updateControlPoints,
  updateWeatherFrontFromControlPoints,
  attachControlPointEvents,
  updateWeatherFrontDimensions,
  generateWeatherFrontPath,
  removeAllFrontShapes,
  applyWeatherFrontScaling,
};
