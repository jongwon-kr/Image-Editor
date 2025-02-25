import { imgEditor } from "../index.js";

function processFiles(files) {
  return new Promise((resolve) => {
    if (files.length === 0) return resolve([]);

    const canvas = imgEditor.canvas;
    const fileList = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    let pending = files.length;

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        pending--;
        if (pending === 0) resolve(fileList);
        continue;
      }

      let reader = new FileReader();

      if (file.type === "image/svg+xml") {
        reader.onload = (f) => {
          fabric.loadSVGFromString(f.target.result, (objects, options) => {
            let obj = fabric.util.groupSVGElements(objects, options);
            pushToFileList(obj, file);

            obj.set({ left: 0, top: 0 }).setCoords();
            canvas.add(obj);
            canvas.renderAll();
            canvas.trigger("object:modified");

            pending--;
            if (pending === 0) resolve(fileList);
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (f) => {
          fabric.Image.fromURL(f.target.result, (img) => {
            pushToFileList(img, file);

            img.set({ left: 0, top: 0 });
            img.scaleToHeight(300);
            img.scaleToWidth(300);

            canvas.add(img);
            canvas.renderAll();
            canvas.trigger("object:modified");

            pending--;
            if (pending === 0) resolve(fileList);
          });
        };
        reader.readAsDataURL(file);
      }
    }

    function pushToFileList(obj, f) {
      let fileObj = {
        preview: obj.toDataURL({
          format: "png",
          multiplier: 0.2,
        }),
        file: f,
        timestamp: new Date().getTime(),
      };
      fileList.push(fileObj);
    }
  });
}

export { processFiles };
