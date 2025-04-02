import { imgEditor } from "../index.js";

/**
 * jpg, png, svg 파일 처리
 */
function processFiles(files) {
  return new Promise((resolve) => {
    // files가 유효한지 확인
    if (
      !files ||
      (typeof files !== "object" && !Array.isArray(files)) ||
      files.length === 0
    ) {
      console.warn("유효하지 않은 files 매개변수:", files);
      return resolve([]);
    }

    const canvas = imgEditor.canvas;
    const fileList = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    let pending = files.length;

    const canvasWidth = canvas.originalW;
    const canvasHeight = canvas.originalH;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    for (let file of files) {
      if (!(file instanceof Blob) || !allowedTypes.includes(file.type)) {
        console.warn("유효하지 않은 파일:", file);
        pending--;
        if (pending === 0) resolve(fileList);
        continue;
      }

      let reader = new FileReader();

      if (file.type === "image/svg+xml") {
        reader.onload = (f) => {
          fabric.loadSVGFromString(f.target.result, (objects, options) => {
            let obj = fabric.util.groupSVGElements(objects, options);
            pushToFileList(obj, file, f.target.result);

            obj
              .set({
                left: centerX,
                top: centerY,
              })
              .setCoords();

            canvas.add(obj);
            canvas.setActiveObject(obj);
            canvas.renderAll();
            canvas.fire("object:modified");

            pending--;
            if (pending === 0) resolve(fileList);
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (f) => {
          fabric.Image.fromURL(f.target.result, (img) => {
            pushToFileList(img, file, f.target.result);

            img.scaleToHeight(300);
            img.scaleToWidth(300);
            img
              .set({
                left: centerX,
                top: centerY,
              })
              .setCoords();

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            canvas.fire("object:modified");

            pending--;
            if (pending === 0) resolve(fileList);
          });
        };
        reader.readAsDataURL(file);
      }
    }

    function pushToFileList(obj, f, fileData) {
      let fileObj = {
        preview: obj.toDataURL({
          format: "png",
          multiplier: 0.2,
        }),
        file: {
          name: f.name,
          type: f.type,
          size: f.size,
          lastModified: f.lastModified,
          data: fileData,
        },
        timestamp: new Date().getTime(),
      };
      fileList.push(fileObj);
    }
  });
}

export { processFiles };
