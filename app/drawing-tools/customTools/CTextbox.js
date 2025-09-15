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

    this.hideControlOnEnter = false;
    this.cursorDelay = 100;
    this.cursorDuration = 600;

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

    // 'isEditing'이나 'active' 조건 없이 항상 테두리를 그리도록 처리
    if (
      this.textboxBorderWidth > 0 &&
      this.textboxBorderColor &&
      this.textboxBorderColor !== "transparent"
    ) {
      ctx.save();

      // 텍스트, 여백, 텍스트 테두리를 모두 포함하는 정확한 영역을 계산
      const textStrokeWidth = this.strokeWidth || 0;
      const padding = this.padding || 0;
      const contentHalfWidth = this.width / 2 + padding + textStrokeWidth / 2;
      const contentHalfHeight = this.height / 2 + padding + textStrokeWidth / 2;
      
      // 위 영역을 기준으로 텍스트 박스 테두리의 경로를 설정하여 겹침 방지
      const rectPathHalfWidth = contentHalfWidth + this.textboxBorderWidth / 2;
      const rectPathHalfHeight = contentHalfHeight + this.textboxBorderWidth / 2;

      ctx.strokeStyle = this.textboxBorderColor;
      ctx.lineWidth = this.textboxBorderWidth;

      ctx.strokeRect(
        -rectPathHalfWidth + 2,
        -rectPathHalfHeight + 2,
        rectPathHalfWidth * 2 - 4,
        rectPathHalfHeight * 2 - 4
      );

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
