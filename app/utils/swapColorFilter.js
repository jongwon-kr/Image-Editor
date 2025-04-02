fabric.Image.filters.SwapColor = fabric.util.createClass(
  fabric.Image.filters.BaseFilter,
  {
    type: "SwapColor",
    fragmentSource:
      "precision highp float;\n" +
      "uniform sampler2D uTexture;\n" +
      "uniform vec4 colorSource;\n" +
      "uniform vec4 colorDestination;\n" +
      "varying vec2 vTexCoord;\n" +
      "void main() {\n" +
      "vec4 color = texture2D(uTexture, vTexCoord);\n" +
      "vec3 delta = abs(colorSource.rgb - color.rgb);\n" +
      "gl_FragColor = length(delta) < 0.02 ? colorDestination.rgba : color;\n" +
      "}",
    colorSource: "rgb(255, 0, 0)",
    colorDestination: "rgb(0, 255, 0)",
    applyTo2d: function (options) {
      var imageData = options.imageData,
        data = imageData.data,
        i,
        len = data.length,
        source = new fabric.Color(this.colorSource).getSource(),
        destination = new fabric.Color(this.colorDestination).getSource();
      for (i = 0; i < len; i += 4) {
        if (
          data[i] === source[0] &&
          data[i + 1] === source[1] &&
          data[i + 2] === source[2]
        ) {
          data[i] = destination[0];
          data[i + 1] = destination[1];
          data[i + 2] = destination[2];
        }
      }
    },
    getUniformLocations: function (gl, program) {
      return {
        uColorSource: gl.getUniformLocation(program, "colorSource"),
        uColorDestination: gl.getUniformLocation(program, "colorDestination"),
      };
    },
    sendUniformData: function (gl, uniformLocations) {
      var source = new fabric.Color(this.colorSource).getSource(),
        destination = new fabric.Color(this.colorDestination).getSource();
      source[0] /= 255;
      source[1] /= 255;
      source[2] /= 255;
      destination[0] /= 255;
      destination[1] /= 255;
      destination[2] /= 255;
      gl.uniform4fv(uniformLocations.uColorSource, source);
      gl.uniform4fv(uniformLocations.uColorDestination, destination);
    },
    toObject: function () {
      return fabric.util.object.extend(this.callSuper("toObject"), {
        colorSource: this.colorSource,
        colorDestination: this.colorDestination,
      });
    },
  }
);

fabric.Image.filters.SwapColor.fromObject =
  fabric.Image.filters.BaseFilter.fromObject;

export default fabric.Image.filters.SwapColor;
