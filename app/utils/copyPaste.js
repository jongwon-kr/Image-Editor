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
          if (
            item.types.includes("image/png") ||
            item.types.includes("image/jpeg")
          ) {
            const blob = await item.getType(item.types[0]);
            const reader = new FileReader();
            reader.onload = (event) => {
              fabric.Image.fromURL(
                event.target.result,
                (img) => {
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
                },
                {
                  crossorigin: "anonymous",
                }
              );
            };
            reader.readAsDataURL(blob);
            return;
          }
        }

        let clonedObjects = [];
        let activeObjects = this.canvas.getActiveObjects();

        activeObjects.forEach((obj) => {
          obj.clone((clone) => {
            this.canvas.add(
              clone.set({
                strokeUniform: true,
                left: obj.aCoords.tl.x + 20,
                top: obj.aCoords.tl.y + 20,
              })
            );

            if (activeObjects.length === 1) {
              this.canvas.setActiveObject(clone);
            }
            clonedObjects.push(clone);
          });
        });

        if (clonedObjects.length > 1) {
          let sel = new fabric.ActiveSelection(clonedObjects, {
            canvas: this.canvas,
          });
          this.canvas.setActiveObject(sel);
        }

        this.canvas.requestRenderAll();
        this.canvas.trigger("object:modified");

      } catch (err) {
        console.error("클립보드 접근 실패:", err);
        console.log("HTTPS 환경에서만 클립보드 API가 동작합니다.");
      }
    }
  });
}

export { copyPaste };
