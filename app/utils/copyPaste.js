// @ts-nocheck
"use strict";

function copyPaste(canvas) {
  // 캔버스 중심 좌표 계산
  const getCanvasCenter = () => {
    const vpt = canvas.viewportTransform;
    const zoom = vpt[0];
    const canvasWidth = canvas.width / zoom;
    const canvasHeight = canvas.height / zoom;
    return {
      x: canvasWidth / 2 - vpt[4] / zoom,
      y: canvasHeight / 2 - vpt[5] / zoom,
    };
  };

  // DataURL을 Blob 및 File로 변환
  const dataURLtoFile = (dataUrl, filename) => {
    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return new File([blob], filename, { type: mime });
    } catch (err) {
      console.error("DataURL을 File로 변환 실패:", err);
      return null;
    }
  };

  // 이미지 파일을 캔버스에 추가
  const addImageToCanvas = (file, filename) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      fabric.Image.fromURL(
        dataUrl,
        (img) => {
          if (!img.getElement() || img.width === 0 || img.height === 0) {
            console.error("유효하지 않은 이미지 데이터입니다.", dataUrl);
            alert("이미지를 로드할 수 없습니다.");
            return;
          }

          const center = getCanvasCenter();
          img.set({
            left: center.x,
            top: center.y,
            originX: "center",
            originY: "center",
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.fire("object:modified");
          canvas.renderAll();
          console.log(`이미지 붙여넣기 성공: ${filename}`);
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.onerror = () => {
      console.error("이미지 파일 읽기 실패:", filename);
      alert("이미지 파일을 읽는 데 실패했습니다.");
    };
    reader.readAsDataURL(file);
  };

  // 클립보드에 이미지 복사
  const copyImageToClipboard = (dataUrl) => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    const img = document.createElement("img");
    img.src = dataUrl;
    div.appendChild(img);
    document.body.appendChild(div);

    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      const success = document.execCommand("copy");
      if (success) {
        console.log("클립보드에 이미지 복사 성공");
      } else {
        console.warn("클립보드 복사 실패: execCommand 반환값 false");
        alert("클립보드 복사에 실패했습니다. 브라우저 호환성을 확인하세요.");
      }
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      alert("클립보드 복사에 실패했습니다. 브라우저 호환성을 확인하세요.");
    }

    document.body.removeChild(div);
    selection.removeAllRanges();
  };

  // 선택된 객체와 weatherFront의 shapeObjects를 이미지로 변환
  const objectsToImage = (objects, activeObject) => {
    const allObjects = [];
    const weatherFronts = [];

    // 선택된 객체와 weatherFront의 shapeObjects 수집
    objects.forEach((obj) => {
      allObjects.push(obj);
      if (obj.pathType === "weatherFront" && obj.shapeObjects) {
        weatherFronts.push(obj);
        allObjects.push(...obj.shapeObjects);
      }
    });

    if (allObjects.length === 0) {
      return null;
    }

    // ActiveSelection 또는 단일 객체의 경계 계산
    const bounds = activeObject.getBoundingRect();
    const width = bounds.width;
    const height = bounds.height;

    if (width <= 0 || height <= 0) {
      console.error("유효하지 않은 객체 경계:", { width, height });
      return null;
    }

    // 임시 캔버스 생성
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: width,
      height: height,
      backgroundColor: "transparent",
    });

    // 객체를 임시 캔버스에 복제하여 렌더링
    allObjects.forEach(async (obj) => {
      const clone = await fabric.util.object.clone(obj);
      clone.set({
        left: obj.left - bounds.left,
        top: obj.top - bounds.top,
        evented: false,
        selectable: false,
      });
      tempCanvas.add(clone);
    });

    // weatherFront의 shapeObjects 렌더링
    weatherFronts.forEach((front) => {
      if (front.shapeObjects) {
        front.shapeObjects.forEach(async (shape) => {
          const clone = await fabric.util.object.clone(shape);
          clone.set({
            left: shape.left - bounds.left,
            top: shape.top - bounds.top,
            evented: false,
            selectable: false,
          });
          tempCanvas.add(clone);
        });
      }
    });

    tempCanvas.renderAll();
    const dataUrl = tempCanvas.toDataURL({
      format: "png",
      quality: 1,
    });

    tempCanvas.dispose();
    return dataUrl;
  };

  // 객체 복사 처리 (이미지로 변환)
  const handleCopy = (event) => {
    event.preventDefault();
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      console.warn("복사할 객체가 선택되지 않았습니다.");
      alert("복사할 객체를 선택하세요.");
      return;
    }

    // 단일 객체 또는 ActiveSelection의 객체 수집
    const objects =
      activeObject instanceof fabric.ActiveSelection
        ? activeObject._objects
        : [activeObject];

    // 객체와 weatherFront의 shapeObjects를 이미지로 변환
    const dataUrl = objectsToImage(objects, activeObject);
    if (!dataUrl) {
      console.error("이미지 생성 실패");
      alert("이미지 복사에 실패했습니다.");
      return;
    }

    const filename = `copied_image_${Date.now()}.png`;
    const file = dataURLtoFile(dataUrl, filename);
    if (!file) {
      console.error("이미지 파일 생성 실패");
      alert("이미지 복사에 실패했습니다.");
      return;
    }

    // 캔버스 내부 저장
    canvas.copiedImage = file;
    // 외부 클립보드에 복사
    copyImageToClipboard(dataUrl);
  };

  // 객체 복사 처리 (이미지로 변환)
  const handleCutting = (event) => {
    event.preventDefault();
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      console.warn("복사할 객체가 선택되지 않았습니다.");
      alert("복사할 객체를 선택하세요.");
      return;
    }

    // 단일 객체 또는 ActiveSelection의 객체 수집
    const objects =
      activeObject instanceof fabric.ActiveSelection
        ? activeObject._objects
        : [activeObject];

    // 객체와 weatherFront의 shapeObjects를 이미지로 변환
    const dataUrl = objectsToImage(objects, activeObject);
    if (!dataUrl) {
      console.error("이미지 생성 실패");
      alert("이미지 복사에 실패했습니다.");
      return;
    }

    const filename = `copied_image_${Date.now()}.png`;
    const file = dataURLtoFile(dataUrl, filename);
    if (!file) {
      console.error("이미지 파일 생성 실패");
      alert("이미지 복사에 실패했습니다.");
      return;
    }

    // 캔버스 내부 저장
    canvas.copiedImage = file;
    // 외부 클립보드에 복사
    copyImageToClipboard(dataUrl);
    objects.forEach((obj) => canvas.remove(obj));
  };

  // 이미지 붙여넣기 처리
  const handlePaste = (event) => {
    event.preventDefault();
    if (!canvas.copiedImage) {
      console.warn("복사된 이미지가 없습니다.");
      alert("복사된 이미지가 없습니다. 먼저 객체를 복사하세요.");
      return;
    }

    const filename = `pasted_image_${Date.now()}.png`;
    addImageToCanvas(canvas.copiedImage, filename);
  };

  // 이벤트 리스너 등록
  document.addEventListener("DOMContentLoaded", () => {
    if (!canvas || !canvas.getActiveObject) {
      console.error("Canvas 객체가 초기화되지 않았습니다.");
      alert("Canvas 초기화에 실패했습니다.");
      return;
    }

    document.addEventListener("keydown", (e) => {
      if (!e.ctrlKey) return;

      // Ctrl+C: 객체를 이미지로 복사
      if (e.key === "c" || e.key === "C") {
        handleCopy(e);
      }

      // Ctrl+X: 객체를 이미지로 잘라내기
      if (e.key === "x" || e.key === "X") {
        handleCutting(e);
      }

      // Ctrl+V: 복사된 이미지 붙여넣기
      if (e.key === "v" || e.key === "V") {
        handlePaste(e);
      }
    });

    // paste 이벤트 (캔버스에 직접 바인딩)
    canvas.wrapperEl.addEventListener("paste", handlePaste);
  });
}

export { copyPaste };
