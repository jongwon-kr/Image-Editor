// @ts-nocheck
fabric.WeatherFrontLine = fabric.classRegistry.setClass(fabric.Path, {
  type: "weatherFrontLine",
  frontType: "warm",

  initialize: function (element, options) {
    options = options || {};

    this.callSuper("initialize", element, options);

    this._initOpt();
  },

  _initOpt: function () {
    // if (!this.getElement()) return;
  },

  _makePath: function () {
    const centerX = 10;
    const centerY = 10;
    const shapeSize = 1;
    const tangentAngle = 1;
    let sCircle = this._createSemicirclePath(
      centerX,
      centerY,
      shapeSize,
      tangentAngle
    );

    const cc = [
      ["M", 99.93276807375959, 107.73192011521438],
      [
        "C",
        102.95990575804899,
        104.51359478770671,
        108.02285387603693,
        104.3586065800132,
        111.2411792035446,
        107.3857442643026,
      ],
      [
        "C",
        114.45950453105227,
        110.412881948592,
        114.61449273874578,
        115.47583006657995,
        111.58735505445638,
        118.69415539408762,
      ],
    ];
    this.sCircle = sCircle;
    this.triagles = cc;
  },

  _renderWeatherFront: function (ctx, path) {
    const l = -this.pathOffset.x,
      t = -this.pathOffset.y;

    ctx.beginPath();

    for (const command of path) {
      switch (
        command[0] // first letter
      ) {
        case "L": // lineto, absolute
          ctx.lineTo(command[1] + l, command[2] + t);
          break;

        case "M": // moveTo, absolute
          ctx.moveTo(command[1] + l, command[2] + t);
          break;

        case "C": // bezierCurveTo, absolute
          ctx.bezierCurveTo(
            command[1] + l,
            command[2] + t,
            command[3] + l,
            command[4] + t,
            command[5] + l,
            command[6] + t
          );
          break;

        case "Q": // quadraticCurveTo, absolute
          ctx.quadraticCurveTo(
            command[1] + l,
            command[2] + t,
            command[3] + l,
            command[4] + t
          );
          break;

        case "Z":
          ctx.closePath();
          break;
      }
    }
    ctx.stroke();

    this._setFillStyles(ctx, this);
    ctx.fill();
  },

  _render: function (ctx) {
    this._renderPathCommands(ctx);
    this._renderPaintInOrder(ctx);

    this._makePath();
    this._renderWeatherFront(ctx, this.sCircle);
    this._renderWeatherFront(ctx, this.triagles);
  },

  _createSemicirclePath: function (centerX, centerY, shapeSize, tangentAngle) {
    const cosAngle = Math.cos(tangentAngle);
    const sinAngle = Math.sin(tangentAngle);
    const arcStartX = centerX - shapeSize * cosAngle;
    const arcStartY = centerY - shapeSize * sinAngle;
    const arcEndX = centerX + shapeSize * cosAngle;
    const arcEndY = centerY + shapeSize * sinAngle;
    //return [`M${arcStartX},${arcStartY}`, `A${shapeSize},${shapeSize} 0 0 1 ${arcEndX},${arcEndY}`];
    return [
      ["M", 200, 100],
      ["L", 100, 200],
    ];
  },

  _createTrianglePath: function (centerX, centerY, shapeSize, tangentAngle) {
    const cosAngle = Math.cos(tangentAngle);
    const sinAngle = Math.sin(tangentAngle);
    const baseLeftX = centerX - shapeSize * cosAngle;
    const baseLeftY = centerY - shapeSize * sinAngle;
    const baseRightX = centerX + shapeSize * cosAngle;
    const baseRightY = centerY + shapeSize * sinAngle;
    const apexX = centerX + shapeSize * sinAngle;
    const apexY = centerY - shapeSize * cosAngle;
    return `M${baseLeftX},${baseLeftY} L${baseRightX},${baseRightY} L${apexX},${apexY} Z`;
  },
});
