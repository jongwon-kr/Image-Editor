// @ts-nocheck
function testPanel() {
  const _self = this;
  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  if (!mainPanel) {
    console.error("Main panel not found");
    return;
  }

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `<div class="toolpanel" id="test-panel"><div class="content"><p class="title">실험실</p></div></div>`
  );

  const panelContent = document.querySelector(
    `${this.containerSelector} .toolpanel#test-panel .content`
  );

  panelContent.insertAdjacentHTML(
    "beforeend",
    `
      <div>
        <div class="input-container">
          <label>KML 파일 선택</label>
          <select id="kml-file-select" class="kml-select">
            <option value="test1.kml" selected>test1.kml</option>
            <option value="test2.kml">test2.kml</option>
            <option value="test4.kml">test3.kml</option>
            <option value="test3.kml">test4.kml</option>
            <option value="test5.kml">test5.kml</option>
            <option value="test6.kml">test6.kml</option>
            <option value="test7.kml">test7.kml</option>
            <option value="test8.kml">test8.kml</option>
            <option value="test9.kml">test9.kml</option>
            <option value="test10.kml">test10.kml</option>
            <option value="test11.kml">test11.kml</option>
            <option value="test12.kml">test12.kml</option>
          </select>
        </div>
        <div>
          <button id="test-kml-btn" class="btn_b">추가하기</button>
        </div>
      </div>
    `
  );

  const testKmlButton = document.querySelector("#test-kml-btn");
  const kmlSelect = document.querySelector("#kml-file-select");

  if (!testKmlButton || !kmlSelect) {
    console.error("Test KML button or select box not found");
    return;
  }

  testKmlButton.addEventListener("click", async function () {
    if (!_self.canvas) {
      console.error("Fabric.js canvas not initialized");
      return;
    }

    const selectedFile = kmlSelect.value;
    if (!selectedFile) {
      alert("KML 파일을 선택하세요.");
      return;
    }

    try {
      const response = await fetch(`/ias/js/wgc/kml/${selectedFile}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch KML: ${response.statusText}`);
      }
      const kmlText = await response.text();

      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(kmlText, "text/xml");

      const parserError = kmlDom.querySelector("parsererror");
      if (parserError) {
        throw new Error("Invalid KML format");
      }

      const coordinatesNodes = d3
        .select(kmlDom)
        .selectAll("coordinates")
        .nodes();

      if (coordinatesNodes.length === 0) {
        throw new Error("No coordinates found in KML");
      }

      const polygons = coordinatesNodes
        .map((node) => {
          const coordinatesText = node.textContent.trim();
          if (!coordinatesText) {
            console.warn("Empty coordinates found, skipping");
            return null;
          }

          const points = coordinatesText
            .split(/\s+/)
            .map((coord) => {
              const [x, y] = coord.split(",").map(Number);
              if (isNaN(x) || isNaN(y)) {
                console.warn(`Invalid coordinate pair: ${coord}`);
                return null;
              }
              return { x, y };
            })
            .filter((point) => point !== null);

          if (points.length === 0) {
            console.warn("No valid points for polygon, skipping");
            return null;
          }

          return new fabric.Polygon(points, {
            fill: "transparent",
            stroke: "black",
            strokeWidth: 2,
            overlayImage: true,
            strokeUniform: true,
          });
        })
        .filter((polygon) => polygon !== null);

      if (polygons.length === 0) {
        throw new Error("No valid polygons created from KML");
      }

      const group = new fabric.Group(polygons, {
        label: `KML: ${selectedFile}`,
        left: 0,
        top: 0,
        overlayImage: true,
        selectable: true,
      });

      _self.canvas.add(group);
      _self.canvas.renderAll();
    } catch (error) {
      console.error("Error processing KML:", error.message);
    }
  });
}

export { testPanel };
