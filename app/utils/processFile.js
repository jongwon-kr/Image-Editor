import { imgEditor } from "../index.js";

function processFiles(files) {
  return new Promise((resolve) => {
    if (files.length === 0) return resolve([]);
    const canvas = imgEditor.canvas;
    const images = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    let pending = files.length; // 처리할 파일 개수

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        pending--; // 허용되지 않는 파일은 처리 대상에서 제외
        if (pending === 0) resolve(images);
        continue;
      }

      let reader = new FileReader();

      if (file.type === "image/svg+xml") {
        reader.onload = (f) => {
          fabric.loadSVGFromString(f.target.result, (objects, options) => {
            let obj = fabric.util.groupSVGElements(objects, options);
            obj.set({ left: 0, top: 0 }).setCoords();
            canvas.add(obj);
            images.push(obj);
            console.log("SVG obj:", obj);
            canvas.renderAll();
            canvas.trigger("object:modified");

            pending--;
            if (pending === 0) resolve(images);
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (f) => {
          fabric.Image.fromURL(f.target.result, (img) => {
            img.set({ left: 0, top: 0 });
            img.scaleToHeight(300);
            img.scaleToWidth(300);
            canvas.add(img);
            images.push(img);
            console.log("Image:", img);
            canvas.renderAll();
            canvas.trigger("object:modified");

            pending--;
            if (pending === 0) resolve(images);
          });
        };
        reader.readAsDataURL(file);
      }
    }
  });
}

export { processFiles };
