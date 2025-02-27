"use strict";

function copyPaste(canvas) {
  // JSON 문자열인지 확인하는 유틸리티 함수
  const isJSONObjectString = (s) => {
    try {
      const o = JSON.parse(s);
      return !!o && typeof o === "object" && !Array.isArray(o);
    } catch {
      return false;
    }
  };

  // Base64 문자열인지 확인하는 유틸리티 함수
  const isBase64String = (str) => {
    try {
      str = str.split("base64,").pop();
      window.atob(str);
      return true;
    } catch {
      return false;
    }
  };

  // 키다운 이벤트 리스너
  document.addEventListener("keydown", async (e) => {
    // Ctrl 키가 눌린 상태에서만 동작
    if (!e.ctrlKey) return;

    // Ctrl+C (복사)
    if (e.key === "c" || e.key === "C") {
      e.preventDefault(); // 기본 복사 동작 방지
      const activeObject = canvas.getActiveObject();
      if (!activeObject) {
        return;
      }

      try {
        if (activeObject.type === "image") {
          const dataUrl = activeObject.toDataURL();
          await navigator.clipboard.writeText(dataUrl);
        } else {
          activeObject.clone(async (cloned) => {
            const jsonData = JSON.stringify(cloned.toJSON());
            await navigator.clipboard.writeText(jsonData);
          });
        }
      } catch (err) {
        console.error("클립보드 쓰기 실패:", err);
      }
    }

    // Ctrl+X (잘라내기)
    if (e.key === "x" || e.key === "X") {
      e.preventDefault(); // 기본 잘라내기 동작 방지
      const activeObject = canvas.getActiveObject();
      if (!activeObject) {
        return;
      }

      try {
        if (activeObject.type === "image") {
          const dataUrl = activeObject.toDataURL();
          await navigator.clipboard.writeText(dataUrl);
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.renderAll();
        } else {
          activeObject.clone(async (cloned) => {
            const jsonData = JSON.stringify(cloned.toJSON());
            await navigator.clipboard.writeText(jsonData);
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.renderAll();
          });
        }
        canvas.fire("object:modified");
      } catch (err) {
        console.error("클립보드 쓰기 실패:", err);
      }
    }

    // Ctrl+V (붙여넣기)
    if (e.key === "v" || e.key === "V") {
      e.preventDefault(); // 기본 붙여넣기 동작 방지

      try {
        // 시스템 클립보드에서 데이터 읽기
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          // 이미지 데이터가 있는 경우
          if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
            const blob = await item.getType(item.types[0]);
            const reader = new FileReader();
            reader.onload = (event) => {
              fabric.Image.fromURL(event.target.result, (img) => {
                img.set({
                  left: 0,
                  top: 0,
                  crossOrigin: "anonymous",
                });
                img.scaleToHeight(100);
                img.scaleToWidth(100);
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.fire("object:modified");
                canvas.renderAll();
              }, {
                crossorigin: "anonymous",
              });
            };
            reader.readAsDataURL(blob);
            return;
          }
        }

        // 클립보드에 이미지 없으면 텍스트 데이터 확인
        const textData = await navigator.clipboard.readText();
        if (textData) {
          if (isBase64String(textData)) {
            fabric.Image.fromURL(textData, (img) => {
              img.set({
                left: 0,
                top: 0,
                crossOrigin: "anonymous",
              });
              img.scaleToHeight(100);
              img.scaleToWidth(100);
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.fire("object:modified");
              canvas.renderAll();
            }, {
              crossorigin: "anonymous",
            });
            return;
          }

          if (isJSONObjectString(textData)) {
            const obj = JSON.parse(textData);
            const validTypes = [
              "rect",
              "circle",
              "line",
              "path",
              "polygon",
              "polyline",
              "textbox",
              "group",
            ];
            if (!validTypes.includes(obj.type)) {
              return;
            }

            fabric.util.enlivenObjects([obj], (objects) => {
              objects.forEach((o) => {
                o.set({
                  left: 0,
                  top: 0,
                });
                canvas.add(o);
                o.setCoords();
                canvas.setActiveObject(o);
              });
              canvas.renderAll();
              canvas.fire("object:modified");
            });
            return;
          }
        }
      } catch (err) {
        console.error("클립보드 접근 실패:", err);
        console.log("HTTPS 환경에서만 클립보드 API가 동작합니다.");
      }
    }
  });
}

export { copyPaste };