import { Copy, Cutting, Duplicate, Paste } from "./copyPaste.js";
import {
  alignObject,
  groupObjects,
  removeObjects,
  selectAllObjects,
  ungroupObjects,
} from "./utils.js";
import { ICONS } from "../models/Icons.ts";

interface MenuItem {
  text: string;
  icon?: string;
  action?: () => void;
  shortcut?: string;
  isDivider?: boolean;
  children?: MenuItem[];
}

export function getMenuItems(
  target: fabric.Object | null,
  canvas: fabric.Canvas,
  canvasPointer: { x: number; y: number }
): MenuItem[] {
  let menuItems: MenuItem[] = [];

  if (target) {
    // --- 객체가 선택되었을 때의 공통 메뉴 ---
    const commonMenuItems: MenuItem[] = [
      {
        text: "복사",
        icon: ICONS.copy,
        action: () => {
          Copy(canvas);
        },
        shortcut: "Ctrl+C",
      },
      {
        text: "복제",
        icon: ICONS.clone,
        action: async () => {
          Duplicate(canvas);
        },
        shortcut: "Ctrl+D",
      },
      {
        text: "잘라내기",
        icon: ICONS.cut,
        action: () => {
          Cutting(canvas);
        },
        shortcut: "Ctrl+X",
      },
      { isDivider: true, text: "" },
      {
        text: "레이어",
        icon: ICONS.layer,
        children: [
          {
            text: "앞으로 가져오기",
            icon: ICONS.bringForward,
            action: () => {
              if (target.type === "activeselection") {
                target._objects.forEach((obj: any) => {
                  canvas.bringObjectForward(obj);
                });
              } else {
                canvas.bringObjectForward(target);
              }
              canvas.fire("object:modified");
              canvas.renderAll();
            },
          },
          {
            text: "뒤로 보내기",
            icon: ICONS.sendBackwards,
            action: () => {
              if (target.type === "activeselection") {
                target._objects.forEach((obj: any) => {
                  canvas.sendObjectBackwards(obj);
                });
              } else {
                canvas.sendObjectBackwards(target);
              }
              canvas.fire("object:modified");
              canvas.renderAll();
            },
          },
          {
            text: "맨 앞으로 가져오기",
            icon: ICONS.bringToFront,
            action: () => {
              if (target.type === "activeselection") {
                target._objects.forEach((obj: any) => {
                  canvas.bringObjectToFront(obj);
                });
              } else {
                canvas.bringObjectToFront(target);
              }
              canvas.fire("object:modified");
              canvas.renderAll();
            },
          },
          {
            text: "맨 뒤로 보내기",
            icon: ICONS.sendToBack,
            action: () => {
              if (target.type === "activeselection") {
                target._objects.forEach((obj: any) => {
                  canvas.sendObjectToBack(obj);
                });
              } else {
                canvas.sendObjectToBack(target);
              }
              canvas.fire("object:modified");
              canvas.renderAll();
            },
          },
        ],
      },
      {
        text: "정렬",
        icon: ICONS.align,
        children: [
          {
            text: "좌측 정렬",
            icon: ICONS.alignLeft,
            action: () => alignObject(canvas, target, "left"),
          },
          {
            text: "수평 중앙 정렬",
            icon: ICONS.alignCenterH,
            action: () => alignObject(canvas, target, "center-h"),
          },
          {
            text: "우측 정렬",
            icon: ICONS.alignRight,
            action: () => alignObject(canvas, target, "right"),
          },
          {
            text: "상단 정렬",
            icon: ICONS.alignTop,
            action: () => alignObject(canvas, target, "top"),
          },
          {
            text: "수직 중앙 정렬",
            icon: ICONS.alignCenterV,
            action: () => alignObject(canvas, target, "center-v"),
          },
          {
            text: "하단 정렬",
            icon: ICONS.alignBottom,
            action: () => alignObject(canvas, target, "bottom"),
          },
        ],
      },
      {
        text: "뒤집기",
        icon: ICONS.flip,
        children: [
          {
            text: "상하 뒤집기",
            icon: ICONS.flipVertical,
            action: () => {
              target.set("flipY", !target.flipY);
              canvas.fire("object:modified");
              if (target.type !== "activeselection") {
                canvas.discardActiveObject();
                canvas.setActiveObject(target);
              }
              canvas.renderAll();
            },
          },
          {
            text: "좌우 뒤집기",
            icon: ICONS.flipHorizontal,
            action: () => {
              target.set("flipX", !target.flipX);
              canvas.fire("object:modified");
              if (target.type !== "activeselection") {
                canvas.discardActiveObject();
                canvas.setActiveObject(target);
              }
              canvas.renderAll();
            },
          },
        ],
      },
      { isDivider: true, text: "" },
      {
        text: "삭제",
        icon: ICONS.delete,
        action: () => removeObjects(canvas),
        shortcut: "Del",
      },
    ];

    menuItems.push(...commonMenuItems);

    let typeSpecificMenuItems: MenuItem[] = [];

    switch (target.type) {
      case "textbox":
        // --- 여기에 'textbox' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "path":
        // --- 여기에 'path' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "image":
        // --- 여기에 'image' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "polygon":
        // --- 여기에 'polygon' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "circle":
        // --- 여기에 'circle' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "ellipse":
        // --- 여기에 'ellipse' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "triangle":
        // --- 여기에 'triangle' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "rect":
        // --- 여기에 'rect' 타입 전용 메뉴 아이템 추가 ---
        break;
      case "curvedline":
        // --- 여기에 'curvedline' 타입 전용 메뉴 아이템 추가 ---
        if ((target as any).isEditing) {
          typeSpecificMenuItems.push({
            text: "편집 모드 해제",
            icon: ICONS.exit,
            action: () => (target as any).exitEditMode(),
          });
        } else {
          typeSpecificMenuItems.push({
            text: "편집 모드",
            icon: ICONS.edit,
            action: () => (target as any).enterEditMode(),
          });
        }
        break;
      case "arrow":
        // --- 여기에 'arrow' 타입 전용 메뉴 아이템 추가 ---
        if ((target as any).isEditing) {
          typeSpecificMenuItems.push({
            text: "편집 모드 해제",
            icon: ICONS.exit,
            action: () => (target as any).exitEditMode(),
          });
        } else {
          typeSpecificMenuItems.push({
            text: "편집 모드",
            icon: ICONS.edit,
            action: () => (target as any).enterEditMode(),
          });
        }
        break;
      case "polypath":
        const polyPathEditMenu: MenuItem = {
          text: "점 편집",
          icon: ICONS.dotEdit,
          children: [
            {
              text: "점 추가",
              icon: ICONS.add,
              action: () => (target as any).addPoint(canvasPointer),
            },
            {
              text: "점 삭제",
              icon: ICONS.remove,
              action: () => (target as any).removePoint(canvasPointer),
            },
          ],
        };
        if ((target as any).isEditing) {
          typeSpecificMenuItems.push(polyPathEditMenu);
          typeSpecificMenuItems.push({
            text: "스무딩 하기",
            icon: ICONS.smoothing,
            action: () => (target as any).smoothing(),
          });
          typeSpecificMenuItems.push({
            text: "편집 모드 해제",
            icon: ICONS.exit,
            action: () => (target as any).exitEditMode(),
          });
        } else {
          typeSpecificMenuItems.push({
            text: "편집 모드",
            icon: ICONS.edit,
            action: () => (target as any).enterEditMode(),
          });
          if ((target as any).isSmoothing) {
            typeSpecificMenuItems.push({
              text: "직선으로 변경",
              icon: ICONS.noBezier,
              action: () => (target as any).toggleSmoothing(),
            });
          } else {
            typeSpecificMenuItems.push({
              text: "곡선으로 변경",
              icon: ICONS.bezier,
              action: () => (target as any).toggleSmoothing(),
            });
          }
        }
        break;
      case "weatherfrontline":
        // --- 여기에 'weatherfrontline' 타입 전용 메뉴 아이템 추가 ---
        const weatherFrontLineEditMenu: MenuItem = {
          text: "점 편집",
          icon: ICONS.dotEdit,
          children: [
            {
              text: "점 추가",
              icon: ICONS.add,
              action: () => (target as any).addPoint(canvasPointer),
            },
            {
              text: "점 삭제",
              icon: ICONS.remove,
              action: () => (target as any).removePoint(canvasPointer),
            },
          ],
        };
        if ((target as any).isEditing) {
          typeSpecificMenuItems.push(weatherFrontLineEditMenu);
          typeSpecificMenuItems.push({
            text: "스무딩 하기",
            icon: ICONS.smoothing,
            action: () => (target as any).smoothing(),
          });
          typeSpecificMenuItems.push({
            text: "편집 모드 해제",
            icon: ICONS.exit,
            action: () => (target as any).exitEditMode(),
          });
        } else {
          typeSpecificMenuItems.push({
            text: "편집 모드",
            icon: ICONS.edit,
            action: () => (target as any).enterEditMode(),
          });
          if ((target as any).isSmoothing) {
            typeSpecificMenuItems.push({
              text: "직선으로 변경",
              icon: ICONS.noBezier,
              action: () => (target as any).toggleSmoothing(),
            });
          } else {
            typeSpecificMenuItems.push({
              text: "곡선으로 변경",
              icon: ICONS.bezier,
              action: () => (target as any).toggleSmoothing(),
            });
          }
        }
        break;
      case "group":
        typeSpecificMenuItems.push({
          text: "그룹 해제",
          icon: ICONS.ungroup,
          action: () => ungroupObjects(canvas),
        });
        break;
      case "activeselection":
        typeSpecificMenuItems.push({
          text: "그룹 만들기",
          icon: ICONS.group,
          action: () => groupObjects(canvas),
        });
        break;
      default:
        break;
    }

    if (typeSpecificMenuItems.length > 0) {
      menuItems.unshift({ isDivider: true, text: "" });
      menuItems.unshift(...typeSpecificMenuItems);
    }
  } else {
    // --- 객체 선택이 안되었을 경우 ---
    menuItems = [
      {
        text: "모든 객체 선택",
        icon: ICONS.selectAll,
        action: () => selectAllObjects(canvas),
        shortcut: "Ctrl+A",
      },
      {
        text: "붙여넣기",
        icon: ICONS.paste,
        action: () => {
          Paste(canvas, undefined, canvasPointer.x, canvasPointer.y);
        },
        shortcut: "Ctrl+V",
      },
    ];
  }

  return menuItems;
}
