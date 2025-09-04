import { getMenuItems, MenuItem } from "./contextMenuConfig.ts";

let openSubmenu: any = null;

const handleCloseMenu = () => {
  removeExistingMenu();
};

function removeExistingMenu() {
  const existingMenu = document.getElementById("context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }
  window.removeEventListener("mousedown", handleCloseMenu);
  window.removeEventListener("keydown", handleCloseMenu);
  openSubmenu = null;
}

function createMenuElement(
  menuItems: MenuItem[],
  pointer: { x: number; y: number }
): void {
  removeExistingMenu();

  const menu = document.createElement("ul");
  menu.id = "context-menu";
  menu.className = "context-menu";
  menu.style.left = `-9999px`;
  menu.style.top = `-9999px`;

  menu.addEventListener("mousedown", (e) => e.stopPropagation());
  menu.addEventListener("click", (e) => e.stopPropagation());

  menuItems.forEach((item) => {
    if (item.isDivider) {
      const divider = document.createElement("li");
      divider.className = "context-menu-divider";
      menu.appendChild(divider);
      return;
    }

    const menuItem = document.createElement("li");
    menuItem.className = "context-menu-item";

    const menuItemTitle = document.createElement("div");
    menuItemTitle.className = "context-menu-title";

    if (item.icon) {
      const iconContainer = document.createElement("div");
      iconContainer.className = "context-menu-icon";
      iconContainer.innerHTML = item.icon;
      menuItemTitle.appendChild(iconContainer);
    } else {
      const spacer = document.createElement("div");
      spacer.className = "context-menu-icon-spacer";
      menuItemTitle.appendChild(spacer);
    }

    const label = document.createElement("span");
    label.className = "context-menu-label";
    label.innerText = item.text;
    menuItemTitle.appendChild(label);

    menuItem.appendChild(menuItemTitle);

    if (item.children && item.children.length > 0) {
      menuItem.classList.add("has-submenu");

      const submenu = document.createElement("ul");
      submenu.className = "context-submenu";

      menuItem.onclick = () => {
        const currentSubmenu = menuItem.querySelector(
          ".context-submenu"
        ) as HTMLElement;
        if (openSubmenu && openSubmenu !== currentSubmenu) {
          openSubmenu.style.display = "none";
        }
        if (currentSubmenu.style.display === "block") {
          currentSubmenu.style.display = "none";
          openSubmenu = null;
        } else {
          currentSubmenu.style.display = "block";
          openSubmenu = currentSubmenu;

          const menuRect = menuItem.getBoundingClientRect();
          const submenuRect = currentSubmenu.getBoundingClientRect();

          currentSubmenu.style.left = "";
          currentSubmenu.style.top = "";

          if (submenuRect.right > window.innerWidth) {
            currentSubmenu.style.left = `-${submenuRect.width}px`;
          }

          if (submenuRect.bottom > window.innerHeight) {
            currentSubmenu.style.top = `-${
              submenuRect.height - menuRect.height
            }px`;
          }
        }
      };

      item.children.forEach((childItem) => {
        const subMenuItem = document.createElement("li");
        subMenuItem.className = "context-menu-item";

        const subMenuItemTitle = document.createElement("div");
        subMenuItemTitle.className = "context-menu-title";

        if (childItem.icon) {
          const iconContainer = document.createElement("div");
          iconContainer.className = "context-menu-icon";
          iconContainer.innerHTML = childItem.icon;
          subMenuItemTitle.appendChild(iconContainer);
        } else {
          const spacer = document.createElement("div");
          spacer.className = "context-menu-icon-spacer";
          subMenuItemTitle.appendChild(spacer);
        }

        const subLabel = document.createElement("span");
        subLabel.className = "context-menu-label";
        subLabel.innerText = childItem.text;
        subMenuItemTitle.appendChild(subLabel);

        subMenuItem.appendChild(subMenuItemTitle);

        if (childItem.shortcut) {
          const subShortcut = document.createElement("span");
          subShortcut.className = "context-menu-shortcut";
          subShortcut.innerText = childItem.shortcut;
          subMenuItem.appendChild(subShortcut);
        }

        subMenuItem.onclick = (e) => {
          e.stopPropagation();
          if (childItem.action) childItem.action();
          removeExistingMenu();
        };
        submenu.appendChild(subMenuItem);
      });
      menuItem.appendChild(submenu);
    } else if (item.shortcut) {
      const shortcut = document.createElement("span");
      shortcut.className = "context-menu-shortcut";
      shortcut.innerText = item.shortcut;
      menuItem.appendChild(shortcut);
    }

    if (!item.children) {
      menuItem.onclick = () => {
        if (item.action) item.action();
        removeExistingMenu();
      };
    }

    menu.appendChild(menuItem);
  });

  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  let x = pointer.x + 1;
  let y = pointer.y + 1;

  if (x + menuRect.width > window.innerWidth) {
    x = pointer.x - menuRect.width - 1;
  }

  if (y + menuRect.height > window.innerHeight) {
    y = pointer.y - menuRect.height - 1;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  setTimeout(() => {
    window.addEventListener("mousedown", handleCloseMenu);
  }, 0);
  setTimeout(() => {
    window.addEventListener("keydown", handleCloseMenu);
  }, 0);
}

interface MenuOptions {
  e: MouseEvent;
  target?: fabric.Object;
}

/**
 * @param {MenuOptions} opt
 * @param {fabric.Canvas} canvas
 */
export function openMenu(opt: MenuOptions, canvas: fabric.Canvas): void {
  const pagePointer = { x: opt.e.pageX, y: opt.e.pageY };
  const canvasPointer = canvas.getPointer(opt.e);
  const target = opt.target ?? null;

  if (target) {
    canvas.setActiveObject(target);
  } else {
    canvas.discardActiveObject();
  }
  canvas.renderAll();

  const menuItems = getMenuItems(target, canvas, canvasPointer);

  if (menuItems.length > 0) {
    createMenuElement(menuItems, pagePointer);
  }
}
