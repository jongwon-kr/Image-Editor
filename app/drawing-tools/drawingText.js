// @ts-nocheck

/**
 * 글 작성
 */
function textBoxDrawing() {
  const _self = this;
  let isDrawingText = false,
    textboxRect,
    origX,
    origY,
    pointer;

  _self.canvas.on("mouse:down", (o) => {
    if (!_self.canvas.isDrawingTextMode) return;

    isDrawingText = true;
    pointer = _self.canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    textboxRect = new fabric.Rect({
      left: origX,
      top: origY,
      width: pointer.x - origX,
      height: pointer.y - origY,
      strokeWidth: 1,
      stroke: "#C00000",
      fill: "rgba(192, 0, 0, 0.2)",
      transparentCorners: false,
    });
    _self.canvas.add(textboxRect);
  });

  _self.canvas.on("mouse:move", (o) => {
    if (!isDrawingText) return;

    pointer = _self.canvas.getPointer(o.e);

    if (origX > pointer.x) {
      textboxRect.set({
        left: Math.abs(pointer.x),
      });
    }

    if (origY > pointer.y) {
      textboxRect.set({
        top: Math.abs(pointer.y),
      });
    }

    textboxRect.set({
      width: Math.abs(origX - pointer.x),
    });
    textboxRect.set({
      height: Math.abs(origY - pointer.y),
    });

    _self.canvas.renderAll();
  });

  _self.canvas.on("mouse:up", () => {
    if (!isDrawingText) return;

    isDrawingText = false;

    // textBox-section의 배경 색상 선택기에서 현재 색상 가져오기
    const colorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .textBox-section #color-picker`
    );
    const backgroundColor = colorPicker.spectrum("get")
      ? colorPicker.spectrum("get").toRgbString()
      : "transparent";

    let textbox = new fabric.Textbox("텍스트를 입력하세요", {
      left: textboxRect.left,
      top: textboxRect.top,
      width: textboxRect.width < 80 ? 80 : textboxRect.width,
      fontSize: 20,
      lineHeight: 1,
      fontFamily: "맑은 고딕",
      fill: "#fff600",
      backgroundColor: backgroundColor, // 동기화된 배경 색상 적용
      stroke: "transparent",
      strokeWidth: 1,
    });
    _self.canvas.remove(textboxRect);
    _self.canvas.add(textbox);
    _self.canvas.setActiveObject(textbox);
    textbox.setControlsVisibility({
      mb: false,
    });

    // 텍스트 박스 생성 직후 편집 모드로 전환
    textbox.enterEditing();
    textbox.selectAll();
    _self.canvas.fire("object:modified");
    _self.canvas.renderAll();
    this.setActiveTool("select");
  });
}

export { textBoxDrawing };
