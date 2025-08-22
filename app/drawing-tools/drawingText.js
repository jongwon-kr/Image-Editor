import { CTextBox } from "./customTools/CTextbox.js";

function textBoxDrawing() {
  const _self = this;

  const handleMouseDown = (o) => {
    if (!_self.canvas.isDrawingTextMode) return;

    const pointer = _self.canvas.getPointer(o.e);

    const colorPicker = $(
      `${_self.containerSelector} .toolpanel#select-panel .textbox-section #color-picker`
    );
    const backgroundColor = colorPicker.spectrum("get")
      ? colorPicker.spectrum("get").toRgbString()
      : "transparent";

    const textBox = new CTextBox("텍스트를 입력하세요", {
      left: pointer.x,
      top: pointer.y,
      width: 200,
      fontSize: 20,
      fontFamily: "맑은 고딕",
      fill: "#000000",
      backgroundColor: backgroundColor,
      stroke: "transparent",
      strokeWidth: 0,
      padding: 2,
      textboxBorderColor: "transparent",
      textboxBorderWidth: 2,
      originX: "center",
      originY: "center",
    });

    _self.canvas.add(textBox);
    _self.canvas.setActiveObject(textBox);

    textBox.enterEditing();
    textBox.selectAll();

    _self.canvas.renderAll();
    _self.setActiveTool("select");
  };

  _self.canvas.on("mouse:down", handleMouseDown);
}

export { textBoxDrawing };
