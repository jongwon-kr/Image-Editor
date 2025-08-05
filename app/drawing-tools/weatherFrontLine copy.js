// @ts-nocheck
export class WeatherFrontLine extends fabric.Path {
  static get type() {
    return "weatherFrontLine";
  }

  constructor(path, options = {}) {
    super(path, {
      strokeWidth: 2,
      stroke:
        options.frontType === "warm"
          ? "red"
          : options.frontType === "cold"
          ? "blue"
          : options.frontType === "stationary"
          ? "black"
          : "purple",
      fill: false,
      frontType: options.frontType || "warm",
      pathType: "weatherFront",
      padding: 6,
      selectable: false,
      evented: false,
      strokeUniform: true,
      isReflect: false,
      shapeObjects: [],
      controlPoints: [],
      ...options,
    });
    this.isDrawingFront = false;
    this.isMouseDown = false;
    this.pointer = null;
    this.updatedFront = null;
  }
}

fabric.classRegistry.setClass(WeatherFrontLine);
fabric.classRegistry.setSVGClass(WeatherFrontLine);
