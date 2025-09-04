import { generateUniqueId } from "../utils/drawingUtils.ts";
import { Shapes } from "../models/DrawingToolsData.ts";

/**
 * 도형 그리기
 */
("use strict");

const categories = [];
let favorites = JSON.parse(localStorage.getItem("wgc-favorites")) || [];

function saveFavorites() {
  localStorage.setItem("wgc-favorites", JSON.stringify(favorites));
}

function getItemId(item) {
  if (typeof item === "string") return item;
  return item.src || item.svg;
}

async function loadStampsData() {
  if (categories.length > 0) return;
  try {
    const response = await fetch("/ias/js/wgc/json/stamps.json");
    const data = await response.json();
    const wResponse = await fetch("/ias/js/wgc/json/weatherIcon.json");
    const wIcon = await wResponse.json();

    categories.push({ name: "일기도 기호", values: data["일기도 기호"] });
    categories.push({ name: "한반도", values: data["한반도"] });
    categories.push({ name: "날씨 아이콘", values: wIcon });
    categories.push({ name: "날씨 기호", values: data["날씨 기호"] });
    categories.push({ name: "화살표", values: data["도형 기호"] });
    categories.push({ name: "기본 도형", values: Shapes });
    categories.push({ name: "기타", values: data["기타"] });
  } catch (error) {
    console.error("Failed to load JSON data:", error);
  }
}

function shapes() {
  const _self = this;
  const allItems = categories.flatMap((cat) => cat.values);

  const mainPanel = document.querySelector(
    `${this.containerSelector} .main-panel`
  );
  if (!mainPanel) return;

  const oldPanel = document.getElementById("shapes-panel");
  if (oldPanel) oldPanel.remove();

  mainPanel.insertAdjacentHTML(
    "beforeend",
    `
      <div class="toolpanel" id="shapes-panel">
          <div class="content">
              <p class="title">도형 그리기</p>
              <div class="shapes-filter-bar">
                  <button class="filter-btn" data-filter="all">전체</button>
                  <button class="filter-btn" data-filter="favorites">즐겨찾기</button>
                  <select class="category-select"></select>
              </div>
              <div class="shapes-grid"></div>
          </div>
      </div>
    `
  );

  const grid = document.querySelector(".toolpanel#shapes-panel .shapes-grid");
  const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
  const favBtn = document.querySelector('.filter-btn[data-filter="favorites"]');
  const categorySelect = document.querySelector(".category-select");

  categorySelect.innerHTML = `<option value="none">카테고리</option>`;
  categories.forEach((cat) => {
    categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });

  const renderShapes = (items) => {
    grid.innerHTML = "";
    if (items.length === 0) {
      grid.innerHTML = `<p>등록된 아이콘이 없습니다.</p>`;
      return;
    }
    items.forEach((item) => {
      const button = document.createElement("div");
      button.classList.add("button");
      if (categories.find((c) => c.name === "한반도")?.values.includes(item)) {
        button.classList.add("korea");
      }

      const itemId = getItemId(item);
      const isFavorited = favorites.includes(itemId);
      const favoriteBtn = document.createElement("div");
      favoriteBtn.className = `favorite-toggle ${
        isFavorited ? "favorited" : ""
      }`;
      favoriteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"></path></svg>`;

      favoriteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (favorites.includes(itemId)) {
          favorites = favorites.filter((id) => id !== itemId);
          favoriteBtn.classList.remove("favorited");
        } else {
          favorites.push(itemId);
          favoriteBtn.classList.add("favorited");
        }
        saveFavorites();

        if (favBtn.classList.contains("active")) {
          updateGrid();
        }
      });
      button.appendChild(favoriteBtn);

      if (typeof item === "string" || (item && item.svg)) {
        const svgContent = item.svg || item;
        button.insertAdjacentHTML("beforeend", svgContent);
        button.addEventListener("click", async function () {
          try {
            const parsed = await fabric.loadSVGFromString(svgContent);
            const obj = fabric.util.groupSVGElements(
              parsed.objects,
              parsed.options
            );
            obj.scaleToWidth(100);
            obj.scaleToHeight(100);

            const vpt = _self.canvas.viewportTransform;
            const zoom = vpt[0];
            const canvasWidth = _self.canvas.width / zoom;
            const canvasHeight = _self.canvas.height / zoom;
            const startX = 50 - vpt[4] / zoom;
            const startY = 50 - vpt[5] / zoom;

            obj.set({
              id: generateUniqueId(),
              left: startX,
              top: startY,
              ...(item.desc && { desc: item.desc }),
            });
            _self.canvas.add(obj);
            _self.canvas.fire("object:modified");
            _self.canvas.renderAll();
          } catch (error) {
            console.error("Failed to add SVG shape:", error);
          }
        });
      } else if (item.src) {
        const img = document.createElement("img");
        img.src = item.src;
        button.appendChild(img);
        button.addEventListener("click", async function () {
          try {
            const imgObj = await fabric.FabricImage.fromURL(item.src);
            imgObj.scaleToWidth(100);
            imgObj.scaleToHeight(100);

            const vpt = _self.canvas.viewportTransform;
            const zoom = vpt[0];
            const canvasWidth = _self.canvas.width / zoom;
            const canvasHeight = _self.canvas.height / zoom;
            const startX = 50 - vpt[4] / zoom;
            const startY = 50 - vpt[5] / zoom;

            imgObj.set({
              id: generateUniqueId(),
              left: startX,
              top: startY,
              ...(item.desc && { desc: item.desc }),
            });

            _self.canvas.add(imgObj);
            _self.canvas.fire("object:modified");
            _self.canvas.renderAll();
          } catch (error) {
            console.error("Failed to add image:", error);
          }
        });
      }
      grid.appendChild(button);
    });
  };

  const updateGrid = () => {
    const activeFilter =
      document.querySelector(".filter-btn.active")?.dataset.filter;
    const selectedCategory = categorySelect.value;

    if (activeFilter === "all") {
      renderShapes(allItems);
    } else if (activeFilter === "favorites") {
      const favoriteItems = allItems.filter((item) =>
        favorites.includes(getItemId(item))
      );
      renderShapes(favoriteItems);
    } else if (selectedCategory !== "none") {
      const category = categories.find((c) => c.name === selectedCategory);
      if (category) {
        renderShapes(category.values);
      }
    } else {
      allBtn.classList.add("active");
      renderShapes(allItems);
    }
  };

  allBtn.addEventListener("click", () => {
    favBtn.classList.remove("active");
    allBtn.classList.add("active");
    categorySelect.value = "none";
    updateGrid();
  });

  favBtn.addEventListener("click", () => {
    allBtn.classList.remove("active");
    favBtn.classList.add("active");
    categorySelect.value = "none";
    updateGrid();
  });

  categorySelect.addEventListener("change", () => {
    allBtn.classList.remove("active");
    favBtn.classList.remove("active");
    updateGrid();
  });

  allBtn.click();
}

async function initializeShapes(context) {
  await loadStampsData();
  shapes.call(context);
}

export { shapes, initializeShapes };
