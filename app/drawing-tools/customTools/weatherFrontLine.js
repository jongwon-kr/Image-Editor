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
  isSmoothing = false;
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
    this.isSmoothing = options.isSmoothing ?? true;

    this.stroke = WeatherFrontLineColor[this.weatherFrontLineType].lineColor;

    this.on("mousedblclick", this._onDoubleClick);
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

    this.canvas.preserveObjectStacking = false;
    this.canvas?.setActiveObject(this);
    this.canvas?.renderAll();
  }

  exitEditMode() {
    if (!this.isEditing) return;
    this.isEditing = false;
    this.controls = this.tempControls;

    this.setCoords();

    this.canvas.preserveObjectStacking = true;
    const activeObject = this.canvas.getActiveObject();
    this.canvas.discardActiveObject();
    if (activeObject) {
      this.canvas.setActiveObject(activeObject);
    }
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

  toggleSmoothing() {
    if (this.isSmoothing) {
      this.straighten();
    } else {
      this.smoothing();
    }
  }

  straighten() {
    if (!this.isSmoothing) return;

    const straightPath = this._getStraightPath();
    if (straightPath.length < 2) return;

    const anchorPoint = new fabric.Point(this.path[0][1], this.path[0][2]);
    const anchorPointInCanvasPlane = fabric.util.transformPoint(
      anchorPoint.subtract(this.pathOffset),
      this.calcTransformMatrix()
    );

    this.set("path", straightPath);
    this.setDimensions();

    const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
      new fabric.Point(this.path[0][1], this.path[0][2]).subtract(
        this.pathOffset
      ),
      this.calcTransformMatrix()
    );
    const diff = newAnchorPointInCanvasPlane.subtract(anchorPointInCanvasPlane);
    this.set({ left: this.left - diff.x, top: this.top - diff.y });

    this.isSmoothing = false;
    this.dirty = true;
    if (this.isEditing) {
      this._setupPathControls();
    }
    this.setCoords();
    this.canvas?.renderAll();
    this.canvas?.fire("object:modified");
  }

  smoothing() {
    const straightPath = this._getStraightPath();
    if (straightPath.length < 2) {
      return;
    }

    this.isSmoothing = true;

    const anchorPoint = new fabric.Point(this.path[0][1], this.path[0][2]);
    const anchorPointInCanvasPlane = fabric.util.transformPoint(
      anchorPoint.subtract(this.pathOffset),
      this.calcTransformMatrix()
    );

    let points = straightPath.map((p) => ({
      x: p[p.length - 2],
      y: p[p.length - 1],
    }));

    if (points.length < 2) {
      this.set("path", straightPath);
      return;
    }

    const newPath = [];
    newPath.push(["M", points[0].x, points[0].y]);
    const tension = 0.2;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1 = {
        x: p1.x + (p2.x - p0.x) * tension,
        y: p1.y + (p2.y - p0.y) * tension,
      };
      const cp2 = {
        x: p2.x - (p3.x - p1.x) * tension,
        y: p2.y - (p3.y - p1.y) * tension,
      };
      newPath.push(["C", cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y]);
    }

    this.set("path", newPath);
    this.setDimensions();

    const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
      new fabric.Point(this.path[0][1], this.path[0][2]).subtract(
        this.pathOffset
      ),
      this.calcTransformMatrix()
    );
    const diff = newAnchorPointInCanvasPlane.subtract(anchorPointInCanvasPlane);
    this.set({ left: this.left - diff.x, top: this.top - diff.y });

    this.dirty = true;
    if (this.isEditing) {
      this._setupPathControls();
    }
    this.setCoords();
    this.canvas?.renderAll();
    this.canvas?.fire("object:modified");
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
      straightPath.splice(insertionIndex, 0, [
        "L",
        localPointer.x,
        localPointer.y,
      ]);
      this.set("path", straightPath);
      if (this.isSmoothing) {
        this.smoothing();
      } else {
        this.straighten();
      }
    }
  }

  removePoint(pointer) {
    if (!this.isEditing || !this.path) return;

    const straightPath = this._getStraightPath();
    if (straightPath.length <= 2) return;

    let minDistance = Infinity;
    let removalIndex = -1;

    const inverseTransform = fabric.util.invertTransform(
      this.calcTransformMatrix()
    );
    const localPointer = fabric.util.transformPoint(pointer, inverseTransform);
    localPointer.x += this.pathOffset.x;
    localPointer.y += this.pathOffset.y;

    for (let i = 0; i < straightPath.length; i++) {
      const segment = straightPath[i];
      const point = new fabric.Point(
        segment[segment.length - 2],
        segment[segment.length - 1]
      );
      const distance = localPointer.distanceFrom(point);

      if (distance < minDistance) {
        minDistance = distance;
        removalIndex = i;
      }
    }

    if (removalIndex !== -1 && minDistance <= 10) {
      straightPath.splice(removalIndex, 1);
      if (removalIndex === 0 && straightPath.length > 0) {
        const nextPoint = straightPath[0];
        straightPath[0] = [
          "M",
          nextPoint[nextPoint.length - 2],
          nextPoint[nextPoint.length - 1],
        ];
      }
      this.set("path", straightPath);

      if (this.isSmoothing) {
        this.smoothing();
      } else {
        this.straighten();
      }
    }
  }

  _getStraightPath() {
    const straightPath = [];
    if (!this.path) return straightPath;

    for (const segment of this.path) {
      const command = segment[0];
      if (command === "M" || command === "L") {
        straightPath.push(segment);
      } else if (command === "Q") {
        straightPath.push(["L", segment[3], segment[4]]);
      } else if (command === "C") {
        straightPath.push(["L", segment[5], segment[6]]);
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
        case "Q": {
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
        case "C": {
          const startPoint = { ...currentPoint };
          const p1 = { x: coords[0], y: coords[1] };
          const p2 = { x: coords[2], y: coords[3] };
          const p3 = { x: coords[4], y: coords[5] };
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const tInv = 1 - t;
            const x =
              tInv ** 3 * startPoint.x +
              3 * tInv ** 2 * t * p1.x +
              3 * tInv * t ** 2 * p2.x +
              t ** 3 * p3.x;
            const y =
              tInv ** 3 * startPoint.y +
              3 * tInv ** 2 * t * p1.y +
              3 * tInv * t ** 2 * p2.y +
              t ** 3 * p3.y;
            points.push({ x, y });
          }
          currentPoint = p3;
          break;
        }
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

  toObject(propertiesToInclude = []) {
    return super.toObject([
      ...propertiesToInclude,
      "weatherFrontLineType",
      "spacing",
      "shapeSize",
      "isReflect",
      "isSmoothing",
    ]);
  }
}

fabric.classRegistry.setClass(WeatherFrontLine);
fabric.classRegistry.setSVGClass(WeatherFrontLine);
