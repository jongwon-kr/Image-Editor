declare const html2canvas: (
  element: HTMLElement,
  options?: any
) => Promise<HTMLCanvasElement>;

let hexValueEl: HTMLParagraphElement | null = null;
let onSelectCallback: ((color: string) => void) | null = null;
let colorPreviewElement: HTMLDivElement | null = null;
let isPicking: boolean = false;

let canvasOverlay: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let overlayRect: DOMRect | null = null;
let previewCanvas: HTMLCanvasElement | null = null;
let previewCtx: CanvasRenderingContext2D | null = null;

function initializeElements() {
  hexValueEl = document.getElementById("hexValue") as HTMLParagraphElement;
}

function updateColorPreview(
  x: number,
  y: number,
  zoomCtx: CanvasRenderingContext2D
) {
  if (!colorPreviewElement) {
    colorPreviewElement = document.createElement("div");
    colorPreviewElement.style.position = "absolute";
    colorPreviewElement.style.width = "60px";
    colorPreviewElement.style.height = "60px";
    colorPreviewElement.style.border = "3px solid #fff";
    colorPreviewElement.style.borderRadius = "50%";
    colorPreviewElement.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    colorPreviewElement.style.zIndex = "10001";
    colorPreviewElement.style.pointerEvents = "none";
    colorPreviewElement.style.overflow = "hidden";
    colorPreviewElement.style.background = "#080808ff";

    previewCanvas = document.createElement("canvas");
    previewCanvas.width = 60;
    previewCanvas.height = 60;
    previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
    if (previewCtx) {
      previewCtx.imageSmoothingEnabled = false;
    }

    colorPreviewElement.appendChild(previewCanvas);
    document.body.appendChild(colorPreviewElement);

    const crosshair = document.createElement("div");
    crosshair.style.position = "absolute";
    crosshair.style.top = "50%";
    crosshair.style.left = "50%";
    crosshair.style.width = "10px";
    crosshair.style.height = "10px";
    crosshair.style.border = "1px solid rgba(0, 0, 0, 0.5)";
    crosshair.style.transform = "translate(-50%, -50%)";
    crosshair.style.boxSizing = "border-box";
    colorPreviewElement.appendChild(crosshair);
  }

  if (previewCtx && zoomCtx) {
    const zoomFactor = 10;
    const sourceSize = 12;
    const destSize = 60;

    previewCtx.clearRect(0, 0, destSize, destSize);
    previewCtx.drawImage(
      zoomCtx.canvas,
      x - sourceSize / 2,
      y - sourceSize / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      destSize,
      destSize
    );
  }

  colorPreviewElement.style.left = `${x - 33}px`;
  colorPreviewElement.style.top = `${y - 33}px`;
}

function sampleColor(event: MouseEvent): void {
  if (!ctx || !isPicking || !overlayRect) return;

  const canvasX = event.clientX - overlayRect.left;
  const canvasY = event.clientY - overlayRect.top;

  if (
    canvasX < 0 ||
    canvasY < 0 ||
    canvasX >= overlayRect.width ||
    canvasY >= overlayRect.height
  ) {
    return;
  }

  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  const [r, g, b] = pixel;
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  if (hexValueEl) {
    hexValueEl.textContent = hexColor;
  }
  updateColorPreview(canvasX, canvasY, ctx);
}

function stopPicker(isCancelled: boolean = false): void {
  if (!isPicking) return;
  isPicking = false;

  document.body.style.cursor = "default";

  window.removeEventListener("keydown", handleKeyDown);
  if (canvasOverlay) {
    canvasOverlay.removeEventListener("mousemove", sampleColor);
    canvasOverlay.removeEventListener("click", handleLeftClick);
    canvasOverlay.removeEventListener("contextmenu", handleRightClick);
    canvasOverlay.remove();
    canvasOverlay = null;
    ctx = null;
    overlayRect = null;
  }

  if (colorPreviewElement) {
    colorPreviewElement.remove();
    colorPreviewElement = null;
    previewCanvas = null;
    previewCtx = null;
  }

  if (
    !isCancelled &&
    onSelectCallback &&
    hexValueEl &&
    hexValueEl.textContent
  ) {
    onSelectCallback(hexValueEl.textContent);
  }
}

function handleLeftClick(): void {
  stopPicker(false);
}

function handleRightClick(event: MouseEvent): void {
  event.preventDefault();
  stopPicker(true);
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    stopPicker(true);
  }
}

export async function startPicker(
  onSelect: (color: string) => void
): Promise<void> {
  if (isPicking) return;

  initializeElements();
  onSelectCallback = onSelect;

  try {
    const container = document.getElementById(
      "image-editor-container"
    ) as HTMLElement;

    setTimeout(async () => {
      try {
        const rect = container.getBoundingClientRect();
        overlayRect = rect;

        const canvas = await html2canvas(document.body, {
          useCORS: true,
          logging: false,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });

        isPicking = true;
        canvasOverlay = canvas;
        ctx = canvasOverlay.getContext("2d", { willReadFrequently: true });

        canvasOverlay.style.position = "fixed";
        canvasOverlay.style.top = `${rect.top}px`;
        canvasOverlay.style.left = `${rect.left}px`;
        canvasOverlay.style.width = `${rect.width}px`;
        canvasOverlay.style.height = `${rect.height}px`;
        canvasOverlay.style.zIndex = "10000";
        canvasOverlay.style.cursor = "crosshair";

        document.body.appendChild(canvasOverlay);

        canvasOverlay.addEventListener("mousemove", sampleColor);
        canvasOverlay.addEventListener("click", handleLeftClick, {
          once: true,
        });
        canvasOverlay.addEventListener("contextmenu", handleRightClick);
        window.addEventListener("keydown", handleKeyDown);
      } catch (err) {
        console.error("html2canvas 캡처 중 오류:", err);
        stopPicker(true);
      }
    }, 10);
  } catch (err) {
    console.error("스포이트 기능 준비 중 오류:", err);
    stopPicker(true);
  }
}
