// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var Renderer = (function () {
  const GLContext = require('./3d/glcontext.js');
  const MatUtility = require('./3d/math/mat.utility.js');
  const Matrix4f = require('./3d/math/matrix4f.js');
  const Shader = require('./3d/shaders/shader.js');
  const ShaderCompilation = require('./3d/shaders/shader.compilation.status.js');
  const ShaderProgram = require('./3d/shaders/shader.program.js');
  const VertexBuffer = require('./3d/buffer/vertex.buffer.js');

  /**
   * OpenGL rendering context
   * @type {GLContext}
   */
  var renderingContext;

  /**
   * A global variable for the WebGL context
   * @type {object}
   */
  var gl;

  /**
   * last time update render scene is called
   * @type {int}
   */
  var lastUpdateMillis;

  var matUtil;

  var shaderProgram;

  var squareVerticesBuffer;

  var renderSetup;

  var animFrameReqId = 0;

  function RendererClass(renderSetupData) {
    renderSetup = renderSetupData;
    renderingContext = new GLContext(renderSetup.canvasElement);
    gl = renderingContext.gl();
    if (!gl) {
      return;
    }

    matUtil = new MatUtility();
    animFrameReqId = 0;
  };

  var matTransform = function (rotZ) {
    var perspectiveMatrix = matUtil.perspective(45, 640.0 / 480.0, 0.1, 100.0);
    var translationMat = matUtil.translate(0.0, 0.0, -4.0);
    var modelViewMatrix = matUtil.rotateZ(rotZ).x(translationMat);

    var perspectiveMat = shaderProgram.getUniformLocation('uPMatrix');
    shaderProgram.setUniformMatrix4fv(perspectiveMat, new Float32Array(perspectiveMatrix.flatten()));

    var modelViewMat = shaderProgram.getUniformLocation('uMVMatrix');
    shaderProgram.setUniformMatrix4fv(modelViewMat, new Float32Array(modelViewMatrix.flatten()));
  };

  var initShaders = function () {
    shaderProgram = new ShaderProgram(renderingContext);
    var fragmentShader = new Shader(renderingContext, 'x-shader/x-fragment');
    var vertexShader = new Shader(renderingContext, 'x-shader/x-vertex');
    fragmentShader.compile(renderSetup.fragmentShader);
    vertexShader.compile(renderSetup.vertexShader);
    shaderProgram.attachShader(fragmentShader)
      .attachShader(vertexShader)
      .linkProgram()
      .useProgram();

    vertexPositionAttribute = shaderProgram.getAttribLocation('aVertexPosition');
    gl.enableVertexAttribArray(vertexPositionAttribute);
  };

  var initBuffers = function () {
    squareVerticesBuffer = new VertexBuffer(renderingContext);

    // Now create an array of vertices for the square. Note that the Z
    // coordinate is always 0 here.

    var vertices = [
      1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0, -1.0, -1.0, 0.0
    ];

    squareVerticesBuffer.bindBuffer();
    squareVerticesBuffer.writeBuffer(new Float32Array(vertices), gl.STATIC_DRAW);
  };

  var angleZ = 0.0;

  var renderObjects = function (deltaTime) {
    squareVerticesBuffer.bindBuffer();
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    angleZ += deltaTime;
    matTransform(angleZ);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  var initScene = function () {
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
  };

  var updateScene = function (deltaTime) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderObjects(deltaTime);
  };

  var renderScene = function () {
    var currentTimeMillis = performance.now();
    var elapsedTime = (currentTimeMillis - lastUpdateMillis) / 1000.0;
    if (!isNaN(elapsedTime) /* && !gl.isContextLost() */) {
      updateScene(elapsedTime);
    }
    lastUpdateMillis = currentTimeMillis;
  };

  var draw = function () {
    renderScene();
    animFrameReqId = requestAnimationFrame(draw);
  }

  RendererClass.prototype.render = function () {
    if (!gl) {
      return;
    }
    initShaders();
    initBuffers();
    initScene();
    draw();
  };

  RendererClass.prototype.loseContext = function () {
    if (animFrameReqId !== 0) {
      cancelAnimationFrame(animFrameReqId);
    }
  };

  RendererClass.prototype.restoreContext = function () {
    if (!gl.isContextLost) {
      console.log('we are not lost. No restore needed')
      return;
    }
    animFrameReqId = 0;
  
    initShaders();
    initBuffers();
    initScene();
    lastUpdateMillis = performance.now();
    draw();
  };


  RendererClass.prototype.gl = function () {
    return gl;
  };


  return RendererClass;
}());

module.exports = Renderer;
