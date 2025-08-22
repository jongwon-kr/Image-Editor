import {
  getCurvedLineAngle,
  generateUniqueId,
} from "../../utils/drawingUtils.ts";

export class CurvedLine extends fabric.Path {
  static get type() {
    return "CurvedLine";
  }

  isEditing = false;
  tempControls = null;

  constructor(path, options = {}) {
    super(path, options);
    this.name = "CurvedLine";
    this.id = options.id || generateUniqueId();
    this.objectCaching = false;
    this.borderDashArray = [2, 2];
    this.on("mousedblclick", this._onDoubleClick);
  }

  update() {
    this._updateCurvedLine();
    this.dirty = true;
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

  convertToCurved() {
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

    this.setCoords();
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
    };
  }
}

fabric.classRegistry.setClass(CurvedLine);
fabric.classRegistry.setSVGClass(CurvedLine);
