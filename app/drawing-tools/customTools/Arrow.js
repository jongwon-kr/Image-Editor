import { ArrowHeadStyle } from "../../utils/constants.ts";
import { getLineAngle, generateUniqueId } from "../../utils/drawingUtils.ts";

class ArrowPathManager {
  /**
   * @param {Array<Array<string|number>>} path
   * @returns {object}
   */
  extractEndpoints(path) {
    if (!path || path.length === 0) {
      return {
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        beforeStart: { x: 0, y: 0 },
        beforeEnd: { x: 0, y: 0 },
      };
    }

    const start = { x: path[0][1], y: path[0][2] };
    let end, beforeEnd;

    if (path[1] && path[1][0] === "Q") {
      end = { x: path[1][3], y: path[1][4] };
      beforeEnd = { x: path[1][1], y: path[1][2] };
    } else if (path[1]) {
      end = { x: path[1][1], y: path[1][2] };
      beforeEnd = start;
    } else {
      end = start;
      beforeEnd = start;
    }

    return {
      start,
      end,
      beforeStart:
        path.length > 1 && path[1][0] === "Q"
          ? { x: path[1][1], y: path[1][2] }
          : end,
      beforeEnd,
    };
  }

  /**
   * @param {object} endpoints
   * @returns {{startAngle: number, endAngle: number}}
   */
  calculateAngles(endpoints) {
    const { start, end, beforeStart, beforeEnd } = endpoints;
    const startAngle =
      getLineAngle(beforeStart.x - start.x, beforeStart.y - start.y) + Math.PI;
    const endAngle = getLineAngle(end.x - beforeEnd.x, end.y - beforeEnd.y);

    return { startAngle, endAngle };
  }
}

export class Arrow extends fabric.Path {
  static get type() {
    return "Arrow";
  }

  isEditing = false;
  tempControls = null;

  constructor(path, options = {}) {
    super(path, options);

    this.pathManager = new ArrowPathManager();

    this.name = "Arrow";
    this.id = options.id || generateUniqueId();
    this.objectCaching = false;
    this.borderDashArray = [2, 2];

    this.startArrowHeadStyle =
      options.startArrowHeadStyle || ArrowHeadStyle.NoHead;
    this.endArrowHeadStyle = options.endArrowHeadStyle || ArrowHeadStyle.Head;

    this.on("modified", this._onModified);
    this.on("modifyPath", this._onModifyPath);
    this.on("mousedblclick", this._onDoubleClick);

    this._updateArrow();
  }

  convertToCurve() {
    if (
      !this.path ||
      this.path.length < 2 ||
      (this.path[1] && this.path[1][0] !== "L")
    )
      return;

    const startPoint = this.path[0];
    const endPoint = this.path[1];
    const startX = startPoint[1];
    const startY = startPoint[2];
    const endX = endPoint[1];
    const endY = endPoint[2];

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const newPath = [
      ["M", startX, startY],
      ["Q", midX, midY, endX, endY],
    ];

    this.path = newPath;
    this.dirty = true;
  }

  /**
   * @private
   */
  _updateArrow() {
    if (!this.pathManager || !this.path || this.path.length < 2) return;

    const endpoints = this.pathManager.extractEndpoints(this.path);
    const angles = this.pathManager.calculateAngles(endpoints);

    this._updateArrowHeads(
      endpoints.start,
      endpoints.end,
      angles.startAngle,
      angles.endAngle
    );
  }

  /**
   * @param {{x: number, y: number}} startPoint
   * @param {{x: number, y: number}} endPoint
   * @param {number} angleStart
   * @param {number} angleEnd
   * @private
   */
  _updateArrowHeads(startPoint, endPoint, angleStart, angleEnd) {
    const pathOffset = this.pathOffset || { x: 0, y: 0 };

    if (this.startArrowHeadStyle !== ArrowHeadStyle.NoHead) {
      this.startArrowHeadPath = this._calculateHeadPath(
        startPoint.x,
        startPoint.y,
        angleStart,
        pathOffset
      );
      this.startArrowHeadFilled =
        this.startArrowHeadStyle === ArrowHeadStyle.FilledHead;
    } else {
      this.startArrowHeadPath = null;
    }

    if (this.endArrowHeadStyle !== ArrowHeadStyle.NoHead) {
      this.endArrowHeadPath = this._calculateHeadPath(
        endPoint.x,
        endPoint.y,
        angleEnd,
        pathOffset
      );
      this.endArrowHeadFilled =
        this.endArrowHeadStyle === ArrowHeadStyle.FilledHead;
    } else {
      this.endArrowHeadPath = null;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} angle
   * @param {{x: number, y: number}} pathOffset
   * @returns {Array<Array<string|number>>}
   * @private
   */
  _calculateHeadPath(x, y, angle, pathOffset) {
    const dynamicHeadlen = Math.max(this.strokeWidth * 3, 25);
    const x1 = x - dynamicHeadlen * Math.cos(angle - Math.PI / 7);
    const y1 = y - dynamicHeadlen * Math.sin(angle - Math.PI / 7);
    const x2 = x - dynamicHeadlen * Math.cos(angle + Math.PI / 7);
    const y2 = y - dynamicHeadlen * Math.sin(angle + Math.PI / 7);

    return [
      ["M", x1 - pathOffset.x, y1 - pathOffset.y],
      ["L", x - pathOffset.x, y - pathOffset.y],
      ["L", x2 - pathOffset.x, y2 - pathOffset.y],
    ];
  }

  /**
   * @private
   */
  _onModified() {
    this._updateArrow();
    this.setCoords();
  }

  /**
   * @private
   */
  _onModifyPath() {
    this._updateArrow();
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

  /**
   * @private
   * @param {string} key
   * @param {*} value
   * @returns {Arrow}
   */
  _set(key, value) {
    super._set(key, value);
    this._updateArrow();
    return this;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @private
   */
  _render(ctx) {
    ctx.save();

    super._render(ctx);

    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.stroke;

    if (this.startArrowHeadPath) {
      ctx.beginPath();
      this.startArrowHeadPath.forEach((segment) => {
        if (segment[0] === "M") ctx.moveTo(segment[1], segment[2]);
        else if (segment[0] === "L") ctx.lineTo(segment[1], segment[2]);
      });

      if (this.startArrowHeadFilled) {
        ctx.closePath();
        ctx.fillStyle = this.stroke;
        ctx.fill();
      }
      ctx.stroke();
    }

    if (this.endArrowHeadPath) {
      ctx.beginPath();
      this.endArrowHeadPath.forEach((segment) => {
        if (segment[0] === "M") ctx.moveTo(segment[1], segment[2]);
        else if (segment[0] === "L") ctx.lineTo(segment[1], segment[2]);
      });

      if (this.endArrowHeadFilled) {
        ctx.closePath();
        ctx.fillStyle = this.stroke;
        ctx.fill();
      }
      ctx.stroke();
    }

    ctx.restore();
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
      startArrowHeadStyle: this.startArrowHeadStyle,
      endArrowHeadStyle: this.endArrowHeadStyle,
    };
  }
}

fabric.classRegistry.setClass(Arrow);
fabric.classRegistry.setSVGClass(Arrow);
