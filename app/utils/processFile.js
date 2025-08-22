import { imgEditor } from "../index.ts";

function processFiles(files) {
  return new Promise((resolve) => {
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
            pushToFileList(file, f.target.result);

            if (file.name) {
              obj.set({ label: file.name.split(".")[0] });
            }

            obj.set({ left: centerX, top: centerY }).setCoords();
            canvas.add(obj);
            canvas.fire("object:modified");
            canvas.renderAll();

            pending--;
            if (pending === 0) resolve(fileList);
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = async (f) => {
          const img = await fabric.FabricImage.fromURL(f.target.result);
          pushToFileList(file, f.target.result);

          if (file.name) {
            img.set({ label: file.name.split(".")[0] });
          }

          img.scaleToHeight(300);
          img.scaleToWidth(300);
          img.set({ left: centerX, top: centerY }).setCoords();

          canvas.add(img);
          canvas.fire("object:modified");
          canvas.renderAll();

          pending--;
          if (pending === 0) resolve(fileList);
        };
        reader.readAsDataURL(file);
      }
    }

    async function pushToFileList(file, imgData) {
      const fileObj = {
        imgNm: file.name.split(".")[0],
        imgData: imgData,
        fileNm: file.name,
        registDate: new Date().getTime(),
        shareYn: "N",
        type: file.type,
      };
      fileList.push(fileObj);
    }
  });
}

export { processFiles };
