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

    let textbox = new fabric.Textbox("Your text goes here...", {
      left: textboxRect.left,
      top: textboxRect.top,
      width: textboxRect.width < 80 ? 80 : textboxRect.width,
      fontSize: 18,
      fontFamily: "'Open Sans', sans-serif",
    });
    _self.canvas.remove(textboxRect);
    _self.canvas.add(textbox).setActiveObject(textbox);
    textbox.setControlsVisibility({
      mb: false,
    });
    _self.canvas.fire("object:modified");
    this.setActiveTool("select");
  });
}

export { textBoxDrawing };
