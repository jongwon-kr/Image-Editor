import { generateUniqueId } from "../../utils/drawingUtils.ts";

export class CTextBox extends fabric.IText {
  static get type() {
    return "CTextBox";
  }
  constructor(text, options = {}) {
    super(text, options);
    this.name = "CTextBox";
    this.id = options.id || generateUniqueId();
    this.objectCaching = false;

    this.textboxBorderColor = options.textboxBorderColor || "transparent";
    this.textboxBorderWidth = options.textboxBorderWidth || 2;

    this.on("modified", this._onModified);
  }

  _onModified() {
    this.setCoords();
  }

  _set(key, value) {
    super._set(key, value);
    return this;
  }

  _render(ctx) {
    super._render(ctx);
    if (
      !this.active &&
      this.textboxBorderWidth > 0 &&
      this.textboxBorderColor &&
      this.textboxBorderColor !== "transparent"
    ) {
      ctx.save();
      const w = this.width + this.textboxBorderWidth + this.strokeWidth,
        h = this.height + this.textboxBorderWidth + this.strokeWidth,
        x =
          -this.width / 2 - this.textboxBorderWidth / 2 - this.strokeWidth / 2,
        y =
          -this.height / 2 - this.textboxBorderWidth / 2 - this.strokeWidth / 2;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y);
      ctx.closePath();

      ctx.strokeStyle = this.textboxBorderColor;
      ctx.lineWidth = this.textboxBorderWidth;
      ctx.stroke();
      ctx.restore();
    }
  }

  toObject(propertiesToInclude) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
      name: this.name,
      textboxBorderColor: this.textboxBorderColor,
      textboxBorderWidth: this.textboxBorderWidth,
    };
  }
}

fabric.classRegistry.setClass(CTextBox);
fabric.classRegistry.setSVGClass(CTextBox);
