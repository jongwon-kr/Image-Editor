import { generateUniqueId } from "../../utils/drawingUtils.ts";

export class PolyPath extends fabric.Path {
  static get type() {
    return "PolyPath";
  }

  isEditing = false;
  isSmoothing = false;
  tempControls = null;

  constructor(path, options = {}) {
    super(path, options);
    this.name = "PolyPath";
    this.id = options.id || generateUniqueId();
    this.objectCaching = false;
    this.borderDashArray = [2, 2];

    this.on("mousedblclick", this._onDoubleClick);
  }

  /**
   * @private
   */
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

  /**
   * @private
   */
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
    this.canvas.fire("object:modified");
  }

  smoothing() {
    const straightPath = this._getStraightPath();
    if (straightPath.length < 3) {
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

    const isClosed =
      Math.abs(points[0].x - points[points.length - 1].x) < 1 &&
      Math.abs(points[0].y - points[points.length - 1].y) < 1;

    if (isClosed) {
      points.pop();
    }

    const newPath = [];
    newPath.push(["M", points[0].x, points[0].y]);
    const tension = 0.2;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (!p2) {
        break;
      }

      let p0, p3;
      if (i === 0) {
        p0 = points[points.length - 1];
      } else {
        p0 = points[i - 1];
      }

      if (i >= points.length - 2) {
        p3 = points[(i + 2) % points.length];
      } else {
        p3 = points[i + 2];
      }

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

    const p1 = points[points.length - 1];
    const p2 = points[0];
    const p0 = points[points.length - 2];
    const p3 = points[1];

    const cp1 = {
      x: p1.x + (p2.x - p0.x) * tension,
      y: p1.y + (p2.y - p0.y) * tension,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) * tension,
      y: p2.y - (p3.y - p1.y) * tension,
    };
    newPath.push(["C", cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y]);

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
    this.canvas.fire("object:modified");
  }

  /**
   * @param {string[]} [propertiesToInclude]
   * @returns {object}
   */
  toObject(propertiesToInclude) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
      name: this.name,
      isSmoothing: this.isSmoothing,
    };
  }

  /**
   * @param {fabric.Point} pointer
   */
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
      if (this.isSmoothing) {
        straightPath.splice(insertionIndex, 0, [
          "L",
          localPointer.x,
          localPointer.y,
        ]);
        this.set("path", straightPath);
        this.smoothing();
      } else {
        const anchorPoint = new fabric.Point(this.path[0][1], this.path[0][2]);
        const anchorPointInCanvasPlane = fabric.util.transformPoint(
          anchorPoint.subtract(this.pathOffset),
          this.calcTransformMatrix()
        );

        const newPath = [...this.path];
        newPath.splice(insertionIndex, 0, [
          "L",
          localPointer.x,
          localPointer.y,
        ]);

        this.set("path", newPath);
        this.setDimensions();

        const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
          new fabric.Point(this.path[0][1], this.path[0][2]).subtract(
            this.pathOffset
          ),
          this.calcTransformMatrix()
        );
        const diff = newAnchorPointInCanvasPlane.subtract(
          anchorPointInCanvasPlane
        );
        this.set({ left: this.left - diff.x, top: this.top - diff.y });

        this.dirty = true;
        if (this.isEditing) this._setupPathControls();
        this.setCoords();
        this.canvas?.renderAll();
        this.canvas.fire("object:modified");
      }
    }
  }

  /**
   * @param {fabric.Point} pointer
   */
  removePoint(pointer) {
    if (!this.isEditing || !this.path || this.path.length <= 3) return;

    const straightPath = this._getStraightPath();
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
      if (this.isSmoothing) {
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
        this.smoothing();
      } else {
        const anchorPoint = new fabric.Point(this.path[0][1], this.path[0][2]);
        const anchorPointInCanvasPlane = fabric.util.transformPoint(
          anchorPoint.subtract(this.pathOffset),
          this.calcTransformMatrix()
        );

        const newPath = [...this.path];
        newPath.splice(removalIndex, 1);

        if (removalIndex === 0 && newPath.length > 0) {
          const nextPoint = newPath[0];
          newPath[0] = [
            "M",
            nextPoint[nextPoint.length - 2],
            nextPoint[nextPoint.length - 1],
          ];
        }

        this.set("path", newPath);
        this.setDimensions();

        const newAnchorPointInCanvasPlane = fabric.util.transformPoint(
          new fabric.Point(this.path[0][1], this.path[0][2]).subtract(
            this.pathOffset
          ),
          this.calcTransformMatrix()
        );
        const diff = newAnchorPointInCanvasPlane.subtract(
          anchorPointInCanvasPlane
        );
        this.set({ left: this.left - diff.x, top: this.top - diff.y });

        this.dirty = true;
        if (this.isEditing) this._setupPathControls();
        this.setCoords();
        this.canvas?.renderAll();
        this.canvas.fire("object:modified");
      }
    }
  }

  /**
   * @private
   * @returns {Array}
   */
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

  /**
   * @private
   * @param {fabric.Point} point
   * @param {fabric.Point} p1
   * @param {fabric.Point} p2
   * @returns {number}
   */
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
}

fabric.classRegistry.setClass(PolyPath);
fabric.classRegistry.setSVGClass(PolyPath);
