/**
 * Define actions to manage tip section
 */
function tipPanel() {
  const defaultTips = [
    "Tip: use arrows to move a selected object by 1 pixel!",
    "Tip: Shift + Click to select and modify multiple objects!",
    "Tip: hold Shift when rotating an object for 15° angle jumps!",
    "Tip: hold Shift when drawing a line for 15° angle jumps!",
    "Tip: Ctrl +/-, Ctrl + wheel to zoom in and zoom out!",
  ];

  const _self = this;

  document
    .querySelector(`${this.containerSelector} #footer-bar`)
    .insertAdjacentHTML(
      "afterbegin",
      `
    <div id="tip-container">${
      defaultTips[parseInt(Math.random() * defaultTips.length)]
    }</div>`
    );

  this.hideTip = function () {
    const tipContainer = document.querySelector(
      `${_self.containerSelector} #footer-bar #tip-container`
    );
    if (tipContainer) tipContainer.style.display = "none";
  };

  this.showTip = function () {
    const tipContainer = document.querySelector(
      `${_self.containerSelector} #footer-bar #tip-container`
    );
    if (tipContainer) tipContainer.style.display = "block";
  };

  this.updateTip = function (str) {
    if (typeof str === "string") {
      const tipContainer = document.querySelector(
        `${_self.containerSelector} #footer-bar #tip-container`
      );
      if (tipContainer) tipContainer.innerHTML = str;
    }
  };
}

export { tipPanel };
