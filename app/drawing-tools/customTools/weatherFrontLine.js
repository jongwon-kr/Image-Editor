import { generateUniqueId } from "../../utils/drawingUtils.ts";
import {
  WeatherFrontLineColor,
  WeatherFrontLineType,
} from "../../utils/constants.ts";

export class WeatherFrontLine extends fabric.Path {
  static get type() {
    return "WeatherFrontLine";
  }

  weatherFrontLineType = WeatherFrontLineType.WARM;
  spacing = 30;
  shapeSize = 8;
  isReflect = false;
  isEditing = false;
  tempControls = null;

  constructor(path, options = {}) {
    super(path, options);
    this.name = "WeatherFrontLine";
    this.id = options.id || generateUniqueId();
    this.strokeWidth = 2;
    this.fill = null;
    this.objectCaching = false;
    this.borderDashArray = [2, 2];
    this.weatherFrontLineType =
      options.weatherFrontLineType || WeatherFrontLineType.WARM;
    this.spacing = options.spacing || 30;
    this.shapeSize = options.shapeSize || 8;
    this.isReflect = options.isReflect || false;

    this.stroke = WeatherFrontLineColor[this.weatherFrontLineType].lineColor;

    this.on("mousedblclick", this._onDoubleClick);
  }

  convertToCurve() {
    if (!this.path || this.path.length < 2) return;

    const newPath = [this.path[0]];

    for (let i = 1; i < this.path.length; i++) {
      const prevSegment = newPath[newPath.length - 1];
      const currentSegment = this.path[i];

      if (currentSegment[0] === "L") {
        const startX =
          prevSegment[0] === "M"
            ? prevSegment[1]
            : prevSegment[prevSegment.length - 2];
        const startY =
          prevSegment[0] === "M"
            ? prevSegment[2]
            : prevSegment[prevSegment.length - 1];

        const endX = currentSegment[1];
        const endY = currentSegment[2];

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        newPath.push(["Q", midX, midY, endX, endY]);
      } else {
        newPath.push(currentSegment);
      }
    }

    this.path = newPath;
    this.dirty = true;

    if (this.isEditing) {
      this._setupPathControls();
    }

    this.setCoords();
  }

  _onDoubleClick() {
    if (!this.isEditing) {
      this.enterEditMode();
    } else {
      this.exitEditMode();
    }
  }

  enterEditMode() {
    if (this.isEditing) return;
    this.isEditing = true;
    this.tempControls = this.controls;

    this._setupPathControls();
    this.setCoords();

    this.canvas?.setActiveObject(this);
    this.canvas?.renderAll();
  }

  exitEditMode() {
    if (!this.isEditing) return;
    this.isEditing = false;
    this.controls = this.tempControls;

    this.setCoords();
    this.canvas?.renderAll();
  }

  _setupPathControls() {
    const controls = fabric.controlsUtils.createPathControls(this, {
      pointStyle: {
        controlFill: "white",
      },
      controlPointStyle: {
        controlStroke: "Indigo",
        controlFill: "MediumPurple",
      },
    });

    this.controls = {
      ...fabric.Object.prototype.controls,
      ...controls,
    };
  }

  addPoint(pointer) {
    if (!this.isEditing || !this.path || !this.canvas) return;

    const straightPath = this._getStraightPath();
    if (straightPath.length < 2) return;

    let minDistance = Infinity;
    let insertionIndex = -1;

    const inverseTransform = fabric.util.invertTransform(
      this.calcTransformMatrix()
    );
    const localPointer = fabric.util.transformPoint(pointer, inverseTransform);
    localPointer.x += this.pathOffset.x;
    localPointer.y += this.pathOffset.y;

    for (let i = 0; i < straightPath.length - 1; i++) {
      const p1 = new fabric.Point(straightPath[i][1], straightPath[i][2]);
      const p2 = new fabric.Point(
        straightPath[i + 1][1],
        straightPath[i + 1][2]
      );
      const distance = this._getPointToSegmentDistance(localPointer, p1, p2);
      if (distance < minDistance) {
        minDistance = distance;
        insertionIndex = i + 1;
      }
    }

    if (insertionIndex !== -1) {
      const anchorSegment = this.path[0];
      const anchorPoint = new fabric.Point(
        anchorSegment[anchorSegment.length - 2],
        anchorSegment[anchorSegment.length - 1]
      );
      const anchorPointInCanvasPlane = fabric.util.transformPoint(
        anchorPoint.subtract(this.pathOffset),
        this.calcTransformMatrix()
      );

      const prevSegment = this.path[insertionIndex - 1];
      const startX =
        prevSegment[0] === "M"
          ? prevSegment[1]
          : prevSegment[prevSegment.length - 2];
      const startY =
        prevSegment[0] === "M"
          ? prevSegment[2]
          : prevSegment[prevSegment.length - 1];
      const originalSegment = this.path[insertionIndex];
      const endX = originalSegment[originalSegment.length - 2];
      const endY = originalSegment[originalSegment.length - 1];
      const newX = localPointer.x;
      const newY = localPointer.y;
      const midX1 = (startX + newX) / 2;
      const midY1 = (startY + newY) / 2;
      const newSegment1 = ["Q", midX1, midY1, newX, newY];
      const midX2 = (newX + endX) / 2;
      const midY2 = (newY + endY) / 2;
      const newSegment2 = ["Q", midX2, midY2, endX, endY];

      const newPath = [...this.path];
      newPath.splice(insertionIndex, 1, newSegment1, newSegment2);

      this.set("path", newPath);
      this.setDimensions();
      this._setupPathControls();

      const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
        anchorPoint.subtract(this.pathOffset),
        this.calcTransformMatrix()
      );
      const diff = newAnchorPointInCanvasPlane.subtract(
        anchorPointInCanvasPlane
      );
      this.set({
        left: this.left - diff.x,
        top: this.top - diff.y,
      });
      this.setCoords();
      this.canvas?.renderAll();
      this.canvas?.fire("object:modified", { target: this });
    }
  }

  removePoint(pointer) {
    if (!this.isEditing || !this.path || this.path.length <= 2) return;

    let minDistance = Infinity;
    let removalIndex = -1;

    const inverseTransform = fabric.util.invertTransform(
      this.calcTransformMatrix()
    );
    const localPointer = fabric.util.transformPoint(pointer, inverseTransform);
    localPointer.x += this.pathOffset.x;
    localPointer.y += this.pathOffset.y;

    for (let i = 0; i < this.path.length; i++) {
      const segment = this.path[i];
      const pointX = segment[segment.length - 2];
      const pointY = segment[segment.length - 1];
      const controlPoint = new fabric.Point(pointX, pointY);
      const distance = localPointer.distanceFrom(controlPoint);

      if (distance < minDistance) {
        minDistance = distance;
        removalIndex = i;
      }
    }

    if (removalIndex !== -1 && minDistance <= 5) {
      const anchorIndex = removalIndex === 0 ? 1 : 0;
      const anchorSegment = this.path[anchorIndex];
      const anchorPoint = new fabric.Point(
        anchorSegment[anchorSegment.length - 2],
        anchorSegment[anchorSegment.length - 1]
      );
      const anchorPointInCanvasPlane = fabric.util.transformPoint(
        anchorPoint.subtract(this.pathOffset),
        this.calcTransformMatrix()
      );

      const newPath = [...this.path];
      if (removalIndex === 0 && newPath.length > 2) {
        const nextPointSegment = newPath[1];
        const newStartPoint = [
          "M",
          nextPointSegment[nextPointSegment.length - 2],
          nextPointSegment[nextPointSegment.length - 1],
        ];
        newPath.splice(0, 2, newStartPoint);
      } else if (removalIndex === newPath.length - 1) {
        newPath.pop();
      } else {
        const prevSegment = newPath[removalIndex - 1];
        const nextSegment = newPath[removalIndex + 1];
        const startX = prevSegment[prevSegment.length - 2];
        const startY = prevSegment[prevSegment.length - 1];
        const endX = nextSegment[nextSegment.length - 2];
        const endY = nextSegment[nextSegment.length - 1];
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const newSegment = ["Q", midX, midY, endX, endY];
        newPath.splice(removalIndex, 2, newSegment);
      }

      this.set("path", newPath);
      this.setDimensions();
      this._setupPathControls();

      const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
        anchorPoint.subtract(this.pathOffset),
        this.calcTransformMatrix()
      );
      const diff = newAnchorPointInCanvasPlane.subtract(
        anchorPointInCanvasPlane
      );
      this.set({
        left: this.left - diff.x,
        top: this.top - diff.y,
      });
      this.setCoords();
      this.canvas?.renderAll();
      this.canvas.fire("object:modified", { target: this });
    }
  }

  _getStraightPath() {
    const straightPath = [];
    if (!this.path) return straightPath;

    for (const segment of this.path) {
      const command = segment[0];
      if (command === "M") {
        straightPath.push(segment);
      } else if (command === "Q") {
        straightPath.push(["L", segment[3], segment[4]]);
      } else {
        straightPath.push(segment);
      }
    }
    return straightPath;
  }

  _getPointToSegmentDistance(point, p1, p2) {
    const l2 = p1.distanceFrom(p2) ** 2;
    if (l2 === 0) return point.distanceFrom(p1);

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) /
          l2
      )
    );

    const closestPoint = new fabric.Point(
      p1.x + t * (p2.x - p1.x),
      p1.y + t * (p2.y - p1.y)
    );

    return point.distanceFrom(closestPoint);
  }

  _render(ctx) {
    super._render(ctx);

    const points = this._getFlattenedPathPoints();
    if (points.length < 2) return;

    ctx.save();

    const frontStyles = {
      [WeatherFrontLineType.WARM]: { shape: "semicircle", shapeColor: "red" },
      [WeatherFrontLineType.COLD]: { shape: "triangle", shapeColor: "blue" },
      [WeatherFrontLineType.STATIONARY]: {
        shape: "alternate",
        shapeColor: ["red", "blue"],
      },
      [WeatherFrontLineType.OCCLUDED]: {
        shape: "alternate",
        shapeColor: ["purple", "purple"],
      },
    };
    const style = frontStyles[this.weatherFrontLineType];

    let distanceTraveled = 0;
    let shapeIndex = 0;
    let targetDistance = this.spacing / 2;

    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      while (distanceTraveled + segmentLength >= targetDistance) {
        const distanceIntoSegment = targetDistance - distanceTraveled;
        const t = segmentLength > 0 ? distanceIntoSegment / segmentLength : 0;

        const point = {
          x: p1.x + t * dx,
          y: p1.y + t * dy,
        };
        const tangentAngle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(point.x - this.pathOffset.x, point.y - this.pathOffset.y);
        ctx.rotate(tangentAngle - (this.isReflect ? Math.PI : 0));

        if (style.shape === "semicircle") {
          this._drawSemicircle(ctx, this.shapeSize, style.shapeColor);
        } else if (style.shape === "triangle") {
          this._drawTriangle(ctx, this.shapeSize, style.shapeColor);
        } else if (style.shape === "alternate") {
          const currentShapeIndex = shapeIndex % 2;
          const color = style.shapeColor[currentShapeIndex];
          if (currentShapeIndex === 0) {
            this._drawSemicircle(ctx, this.shapeSize, color);
          } else {
            if (this.weatherFrontLineType === WeatherFrontLineType.OCCLUDED)
              ctx.rotate(Math.PI);
            this._drawTriangle(ctx, this.shapeSize, color);
          }
        }

        shapeIndex++;
        ctx.restore();

        targetDistance += this.spacing;
      }

      distanceTraveled += segmentLength;
    }

    ctx.restore();
  }

  _getFlattenedPathPoints(steps = 100) {
    const points = [];
    if (!this.path || this.path.length === 0) return points;

    let currentPoint = { x: 0, y: 0 };
    for (const segment of this.path) {
      const [type, ...coords] = segment;
      switch (type) {
        case "M":
          currentPoint = { x: coords[0], y: coords[1] };
          points.push(currentPoint);
          break;
        case "L":
          currentPoint = { x: coords[0], y: coords[1] };
          points.push(currentPoint);
          break;
        case "Q":
          const startPoint = { ...currentPoint };
          const p1 = { x: coords[0], y: coords[1] };
          const p2 = { x: coords[2], y: coords[3] };
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x =
              (1 - t) * (1 - t) * startPoint.x +
              2 * (1 - t) * t * p1.x +
              t * t * p2.x;
            const y =
              (1 - t) * (1 - t) * startPoint.y +
              2 * (1 - t) * t * p1.y +
              t * t * p2.y;
            points.push({ x, y });
          }
          currentPoint = p2;
          break;
      }
    }
    return points;
  }

  _drawSemicircle(ctx, size, color) {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  _drawTriangle(ctx, size, color) {
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, -size);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  _getSegmentEndPoint(segment) {
    switch (segment[0]) {
      case "M":
      case "L":
        return { x: segment[1], y: segment[2] };
      case "Q":
        return { x: segment[3], y: segment[4] };
      case "C":
        return { x: segment[5], y: segment[6] };
      default:
        return { x: 0, y: 0 };
    }
  }

  toObject(propertiesToInclude = []) {
    return super.toObject([
      ...propertiesToInclude,
      "weatherFrontLineType",
      "spacing",
      "shapeSize",
      "isReflect",
    ]);
  }
}

fabric.classRegistry.setClass(WeatherFrontLine);
fabric.classRegistry.setSVGClass(WeatherFrontLine);
