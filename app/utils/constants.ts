export const defaultBrushSettings = {
  color: "white",
  size: 8,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: any) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
};

// 화살표 머리 스타일
export enum ArrowHeadStyle {
  "NoHead",
  "Head",
  "FilledHead",
}

// 화살표 타입
export enum ArrowType {
  "SharpArrow",
  "CurvedArrow",
  "ElbowArrow",
}

// 날씨전선 타입
export enum WeatherFrontLineType {
  "WARM",
  "COLD",
  "STATIONARY",
  "OCCLUDED",
}

// 날씨전선 선 색상
export const WeatherFrontLineColor = {
  [WeatherFrontLineType.WARM]: { lineColor: "red" },
  [WeatherFrontLineType.COLD]: { lineColor: "blue" },
  [WeatherFrontLineType.STATIONARY]: { lineColor: "black" },
  [WeatherFrontLineType.OCCLUDED]: { lineColor: "purple" },
};

export interface shapeProps {
  rounded?: boolean;
  endArrowHeadStyle: ArrowHeadStyle;
  startArrowHeadStyle: ArrowHeadStyle;
  fill?: string;
  stroke?: string;
}

//@ts-expect-error
export const defaultShapeSettings: Partial<fabric.FabricObjectProps> &
  shapeProps = {
  evented: false,
  selectable: false,
  originX: "center",
  originY: "center",
  stroke: "black",
  strokeWidth: 2,
  opacity: 1,
  rounded: true,
  endArrowHeadStyle: ArrowHeadStyle.FilledHead,
  startArrowHeadStyle: ArrowHeadStyle.FilledHead,
  cornerStyle: "circle",
  strokeLineCap: "round",
  padding: 4,
};

export const borderSectionTypeList: string[] = [
  "textbox",
  "path",
  "image",
  "polygon",
  "circle",
  "ellipse",
  "triangle",
  "rect",
  "curvedline",
  "arrow",
  "polypath",
];
