/**
 * 도움말 패널
 */
function tipPanel() {
  const defaultTips = [
    "Tip: 방향키를 사용하여 선택한 객체를 1픽셀만큼 이동합니다",
    "Tip: Shift를 누르고 클릭하여 여러 개체를 선택하고 수정합니다",
    "Tip: Shift를 누르고 각도 조절을 하면 15°씩 조절할 수 있습니다.",
    "Tip: Ctrl +/-, Ctrl + 마우스 휠로 확대 및 축소가 가능합니다.",
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
