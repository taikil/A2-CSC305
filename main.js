var canvas;
var gl;

var program;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition = vec4(100.0, 100.0, 100.0, 1.0);
// var lightPosition2 = vec4(0.0, -100.0, 0.0, 1.0);
var lightPosition2 = vec4(0.0, 0.0, 0.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 40.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(0, 0, 10);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0;
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var currentScene = 1;

//Scene 1
var currentRotation = [0, 0, 0];
var bouncingCubePosition = [0, 4, 0];
var bouncyBallVelocity = 0;
var bouncyEnergyLoss = 0.9;
var gravity = 9.8;

var diverColour = vec4(0.639, 0.071, 0.62, 1);

var diverArmRotation = [0, 0, 0];
var diverLegRotation = [0, 0, 0];
var jumpPosition = [0, 0, 0];

var armsUp = false;

var diverVelocity = 0;
var diverRotation = [0, 0, 0];
// var diverPosition = [1, 1, 0];
var diverPosition = [5, 7, 0];
var diverHeadPosition = [0, 1.15, 0];
var diverArmPostion = [0.55, 0.0, 0];
var diverThighPosition = [0.3, -1, 0];
var diverLegCompression = [30, 0, 0];
var cloud1Position = [-1, 4.8, -15];
var cloud2Position = [-3.5, 3.5, -15];
var cloud3Position = [2, 3, -15];

// Scene 2
var fishMovement = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var fishPosition = [-7, 5, -10];
var moving = false;
var tentacleRotation = [0, 0, 0];
var strandRotation = [0, 0, 0];
var diverMovement = [0, 0, 0];
var jellyFishPosition = [0, 0, 0];

var blendTextures = 0;

// For this example we are going to store a few different textures here
var textureArray = [];

// Setting the colour which is needed during illumination of a surface
function setColor(c) {
  ambientProduct = mult(lightAmbient, c);
  diffuseProduct = mult(lightDiffuse, c);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
  if (im.complete) {
    console.log("loaded");
    return true;
  } else {
    console.log("still not loaded!!!!");
    return false;
  }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();
  tex.image.src = filename;
  tex.isTextureReady = false;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
  //Binds a texture to a target. Target is then used in future calls.
  //Targets:
  // TEXTURE_2D           - A two-dimensional texture.
  // TEXTURE_CUBE_MAP     - A cube-mapped texture.
  // TEXTURE_3D           - A three-dimensional texture.
  // TEXTURE_2D_ARRAY     - A two-dimensional array texture.
  gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down

  //texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
  //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
  //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
  //Border: Width of image border. Adds padding.
  //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
  //Type: Data type of the texel data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureObj.image
  );

  //Set texture parameters.
  //texParameteri(GLenum target, GLenum pname, GLint param);
  //pname: Texture parameter to set.
  // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
  // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
  //param: What to set it to.
  //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
  //For the Min Filter:
  //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_NEAREST
  );

  //Generates a set of mipmaps for the texture object.
  /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.GL_REPEAT); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.GL_REPEAT); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log(textureObj.image.src);

  textureObj.isTextureReady = true;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually laoded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
  setTimeout(function () {
    var n = 0;
    for (var i = 0; i < texs.length; i++) {
      console.log(texs[i].image.src);
      n = n + texs[i].isTextureReady;
    }
    wtime = new Date().getTime();
    if (n != texs.length) {
      console.log(wtime + " not ready yet");
      waitForTextures(texs);
    } else {
      console.log("ready to render");
      render(0);
    }
  }, 5);
}

// This will use an array of existing image data to load and set parameters for a texture
// We'll use this function for procedural textures, since there is no async loading to deal with
function loadImageTexture(tex, image) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();

  //Binds a texture to a target. Target is then used in future calls.
  //Targets:
  // TEXTURE_2D           - A two-dimensional texture.
  // TEXTURE_CUBE_MAP     - A cube-mapped texture.
  // TEXTURE_3D           - A three-dimensional texture.
  // TEXTURE_2D_ARRAY     - A two-dimensional array texture.
  gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);

  //texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
  //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
  //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
  //Border: Width of image border. Adds padding.
  //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
  //Type: Data type of the texel data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  //Generates a set of mipmaps for the texture object.
  /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
  gl.generateMipmap(gl.TEXTURE_2D);

  //Set texture parameters.
  //texParameteri(GLenum target, GLenum pname, GLint param);
  //pname: Texture parameter to set.
  // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
  // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
  //param: What to set it to.
  //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
  //For the Min Filter:
  //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);

  tex.isTextureReady = true;
}

// This just calls the appropriate texture loads for this example and puts the textures in an array
function initTexturesForExample() {
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "water.jpg");

  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "water2.avif");

  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "planks.jpg");
}

// Turn texture use on and off
function toggleTextureBlending() {
  blendTextures = (blendTextures + 1) % 2;
  gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), blendTextures);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.5, 0.5, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  setColor(materialDiffuse);

  // Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
  // Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
  Cube.init(program);
  Cylinder.init(20, program);
  Cone.init(20, program);
  Sphere.init(36, program);

  // Matrix uniforms
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  // Lighting Uniforms
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  // Helper function just for this example to load the set of textures
  initTexturesForExample();

  waitForTextures(textureArray);
};

// Sets the modelview and normal matrix in the shaders
function setMV() {
  modelViewMatrix = mult(viewMatrix, modelMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  normalMatrix = inverseTranspose(modelViewMatrix);
  gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  setMV();
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
  setMV();
  Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
  setMV();
  Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
  setMV();
  Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
  setMV();
  Cone.draw();
}

// Draw a Bezier patch
function drawB3(b) {
  setMV();
  b.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
  modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
  modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
  modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
  modelMatrix = MS.pop();
}
function gPopN(n) {
  for (i = 0; i < n; i++) {
    gPop();
  }
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
  MS.push(modelMatrix);
}

function render(timestamp) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  MS = []; // Initialize modeling matrix stack

  // initialize the modeling matrix to identity
  modelMatrix = mat4();

  // set the camera matrix
  viewMatrix = lookAt(eye, at, up);

  // set the projection matrix
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  // set all the matrices
  setAllMatrices();

  if (animFlag) {
    // dt is the change in time or delta time from the last frame to this one
    // in animation typically we have some property or degree of freedom we want to evolve over time
    // For example imagine x is the position of a thing.
    // To get the new position of a thing we do something called integration
    // the simpelst form of this looks like:
    // x_new = x + v*dt
    // That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
    // We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
    dt = (timestamp - prevTime) / 1000.0;
    prevTime = timestamp;
  }

  // We need to bind our textures, ensure the right one is active before we draw
  //Activate a specified "texture unit".
  //Texture units are of form gl.TEXTUREi | where i is an integer.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);

  // Now let's draw a shape animated!
  // You may be wondering where the texture coordinates are!
  // We've modified the object.js to add in support for this attribute array!
  gPush();
  {
    gPop();
    // if (timestamp < 16000) {
    if (timestamp > 160000) {
      scene1();
      console.log(timestamp);
      if (timestamp > 12000 && timestamp < 16000) {
        nextScene(eye);
      }
    }
    // if (timestamp > 16000) {
    eye = vec3(0, 0, 10);
    at = vec3(0, 0, 0);
    lightPosition = lightPosition2;
    currentScene = 2;
    //Fishes
    for (var i = 0; i < 11; i++) {
      var sign;
      i % 2 == 0 ? (sign = 1) : (sign = -1);
      renderFishes(i, sign);
    }
    if (timestamp > 2000) {
      renderDiver();
      animateSwimming(timestamp);
    }
    renderJellyFish(timestamp);
    // }
  }
  gPop();

  if (animFlag) window.requestAnimFrame(render);

  function scene1() {
    renderWater();

    //Diver
    renderDiver();
    renderCloud(cloud1Position);
    renderCloud(cloud2Position);
    renderCloud(cloud3Position);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);

    renderDock();
    if (timestamp > 3000 && timestamp < 8000) {
      moveCamera(eye, timestamp);
    }
    if (timestamp > 8000 && timestamp < 12000) {
      jump();
    }
  }
  // if isLeft, the x coordinate and sway angles are negative
}

function renderJellyFish(timestamp) {
  gPush();
  {
    setColor(vec4(0, 0.788, 1, 1.0));
    gRotate(180, 1, 0, 0);
    gScale(1 + 0.2 * Math.sin(timestamp / 500), 0.5, 1);
    gPush();
    {
      drawSphere();
    }
    gPop();
    for (var i = 1; i <= 36; i++) {
      gPush();
      {
        renderTentacle(-0.6, 0, -0.6, i * 10, timestamp);
      }
      gPop();
    }
  }
  gPop();
}

function renderTentacle(i, j, k, rotation, timestamp) {
  gPush();
  {
    console.log(rotation);
    gRotate(rotation, 0, 1, 0);
    gTranslate(i, j, k);
    // 2.5 degrees * sin(timstamp) -> Translated down the entire kinetic chain equals a sway from -25 to 25 degrees
    tentacleRotation[2] = -2.5 * Math.sin(timestamp / 1000);
    gRotate(tentacleRotation[2], 0, 0, 1);
    gPush();
    {
      // gScale(0.15, 0.3, 0.15);
      gScale(0.075, 0.15, 0.075);
      drawSphere();
    }
    gPop();

    for (i = 0; i < 7; i++) {
      gPush();
      //Sine pattern in the seaweed
      strandRotation[2] = 5 * (Math.sin(timestamp / 500) + 1);
      gRotate(strandRotation[2], 0, 0, 1);
      // Rotate from Base
      gTranslate(0, 0.275, 0);
      gPush();
      {
        gScale(0.075, 0.15, 0.075);
        drawSphere();
      }
      gPop();
    }
    gPopN(7);
  }
  gPop();
}

function renderFishes(i, sign) {
  gPush();
  {
    sign == 1
      ? setColor(vec4(0.2, i / 16.5, 1.0, 1.0))
      : setColor(vec4(1.0, i / 16.5, 0.2, 1.0));
    gTranslate(fishPosition[0] * sign, fishPosition[1] - i, fishPosition[2]);
    fishMovement[i] += dt * (1 + i / 5) * sign;
    gTranslate(fishMovement[i], 0, 0);
    if (i % 2 == 1) {
      gRotate(180, 0, 1, 0);
    }
    if (sign == 1) {
      if (fishPosition[0] + fishMovement[i] > 7) {
        gTranslate(-fishMovement[i], 0, 0);
        fishMovement[i] = 0;
      }
    } else {
      if (fishMovement[i] - fishPosition[0] < -7) {
        gTranslate(-fishMovement[i], 0, 0);
        fishMovement[i] = 0;
      }
    }
    gPush();
    {
      gScale(0.333, 0.1, 0.1);
      drawSphere();
    }
    gPop();
    gPush();
    {
      gTranslate(-0.333, 0, 0);
      gScale(0.1, 0.2, 0.1);
      gRotate(90, 0, 1, 0);
      drawCone();
    }
    gPop();
    gPush();
    {
      setColor(vec4(0.0, 1.0, 1.0, 1.0));
      gTranslate(0.25, 0, 0.1);
      gScale(0.05, 0.05, 0.05);
      drawSphere();
    }
    gPop();
    gPush();
    {
      setColor(vec4(1.0, 1.0, 0.0, 1.0));
      gTranslate(0.25, 0, -0.1);
      gScale(0.05, 0.05, 0.05);
      drawSphere();
    }
    gPop();
  }
  gPop();
}

function nextScene(eye) {
  diverPosition = [5, 7, 0];
  currentScene++;
  if (eye[1] > -15) {
    eye[1] -= dt * 4;
    at[1] -= dt * 4;
  } else {
    console.log("DONE");
  }
}

function moveCamera(eye, timestamp) {
  if (eye[1] < 2) {
    eye[1] += dt * 2;
    cloud1Position[1] -= dt * 2;
    cloud2Position[1] -= dt * 2;
    cloud3Position[1] -= dt * 2;
  } else {
    if (timestamp < 10000) {
      eye[0] = 10 * Math.cos(0.001 * timestamp);
      eye[2] = 10 * Math.sin(0.001 * timestamp);
    } else {
      eye = vec3(0, 2, 10);
    }
  }
}
function renderWater() {
  gPush();
  {
    gTranslate(0, -6, 0);

    // currentRotation[2] = currentRotation[2] + 30 * dt;
    // gRotate(currentRotation[2], 0, 0, 1);
    gPush();
    {
      gScale(25, 2, 25);
      toggleTextureBlending();
      drawCube();
      toggleTextureBlending();
    }
    gPop();

    gTranslate(0, 0, -7.5);
  }
  gPop();
}

function renderCloud(position) {
  gPush();
  {
    setColor(vec4(1.0, 1.0, 1.0, 1.0));
    gTranslate(position[0], position[1], position[2]);
    position[0] += dt * 0.1;
    gScale(0.6, 0.6, 0.6);
    drawSphere();
    gPush();
    {
      gTranslate(1, -0.1, 0);
      gScale(0.8, 0.8, 0.8);
      drawSphere();
    }
    gPop();
    gPush();
    {
      gTranslate(-1, -0.1, 0);
      gScale(0.8, 0.8, 0.8);
      drawSphere();
    }
    gPop();
  }
  gPop();
}

function renderDiver() {
  gPush();
  {
    setColor(diverColour);
    gTranslate(diverPosition[0], diverPosition[1], diverPosition[2]);
    gTranslate(diverMovement[0], diverMovement[1], diverMovement[2]);
    if (currentScene == 1) {
      gRotate(-80, 0, 1, 0);
    }
    gRotate(diverRotation[0], 1, 0, 0);
    gRotate(diverRotation[1], 0, 1, 0);
    gPush();
    {
      gScale(0.4, 0.8, 0.5);
      drawCube();
    }
    gPop();

    renderDiverArms(false);
    renderDiverArms(true);

    //Diver Leg
    renderDiverLeg(false);
    renderDiverLeg(true);

    // Diver Head
    gPush();
    {
      gTranslate(
        diverHeadPosition[0],
        diverHeadPosition[1],
        diverHeadPosition[2]
      );
      gPush();
      {
        gScale(0.333, 0.333, 0.333);
        drawSphere();
      }
      gPop();
    }
    gPop();
  }
  gPop();
}

function animateSwimming(timestamp, moving) {
  // Swimming Arms?
  diverRotation[1] = -80;
  if (diverPosition[1] > 2) {
    moving = true;
    diverRotation[0] = 180;
    diverRotation[2] = 0;
    diverPosition[1] += -(dt ^ 2) / 25;
    diverPosition[0] += -(dt ^ 2) / 100;
  } else {
    moving = false;
    rotateDiver(timestamp);
    diverMovement[0] = 0.3 * Math.sin(timestamp / 1200); // Left and right movement
    diverMovement[1] = 0.3 * Math.sin(timestamp / 1200); // Up and down movement
  }
  if (moving) {
    diverArmRotation[2] = Math.abs(150 * Math.cos(timestamp / 1000));
    diverArmRotation[0] = Math.abs(75 * Math.cos(timestamp / 1000));
  } else {
    diverArmRotation[2] = Math.abs(75 * Math.sin(timestamp / 1000));
    diverArmRotation[0] = Math.abs(75 * Math.cos(timestamp / 1000));
  }
  moving = false;
  diverLegRotation[0] = 15 * Math.sin(0.002 * timestamp); // leg kicking
}

function rotateDiver(timestamp) {
  if (!moving) {
    if (diverRotation[0] > 0) {
      diverRotation[0] -= 2 * Math.abs(Math.cos(timestamp / 1000));
    }
  } else {
    if (diverRotation[0] < 180) {
      diverRotation[0] += 5 * Math.abs(Math.cos(timestamp / 1000));
    }
  }
}

function jump() {
  diverLegCompression[0] = 15;
  if (diverPosition[0] > -3.5) {
    diverPosition[0] -= dt * 3;
    diverRotation[0] += dt * 120;
  }
  if (diverPosition[1] > 2) {
    gravity = -9.8;
  }
  diverVelocity += dt * gravity;
  diverPosition[1] += dt * diverVelocity;
  if (!armsUp) {
    diverArmRotation[2] += dt * 150;
  }
  if (diverArmRotation[2] <= 190) {
    armsUp = false;
  } else {
    armsUp = true;
  }
}

function renderDiverArms(isLeft) {
  gPush();
  {
    if (isLeft) {
      gTranslate(0.55, 0.0, 0);
      gTranslate(0, 0.6, 0);
      gRotate(diverArmRotation[2], 0, 0, 1);
      gRotate(-diverArmRotation[0], 1, 0, 0);
      gTranslate(0, -0.6, 0);
    } else {
      gTranslate(-0.55, 0.0, 0);
      gTranslate(0, 0.6, 0);
      gRotate(-diverArmRotation[2], 0, 0, 1);
      gRotate(-diverArmRotation[0], 1, 0, 0);
      gTranslate(0, -0.6, 0);
    }
    gPush();
    {
      gScale(0.1, 0.6, 0.2);
      drawCube();
    }
    gPop();
  }
  gPop();
}

function renderDiverLeg(isLeft) {
  gPush();
  {
    // Set to left leg position or right leg
    if (isLeft) {
      gTranslate(
        -diverThighPosition[0],
        diverThighPosition[1],
        diverThighPosition[2]
      );
    } else {
      gTranslate(
        diverThighPosition[0],
        diverThighPosition[1],
        diverThighPosition[2]
      );
    }
    // gRotate(45, 1, 0, 0);
    // Rotate legs alternating in a sine pattern
    isLeft
      ? gRotate(-diverLegRotation[0], 1, 0, 0)
      : gRotate(diverLegRotation[0], 1, 0, 0);
    gPush();
    {
      gScale(0.1, 0.5, 0.2);
      drawCube();
    }
    gPop();
    // Diver Shin
    gPush();
    {
      // Rotate from base
      gTranslate(0, -0.375, 0);
      gRotate(diverLegCompression[0], 1, 0, 0);
      // gRotate(0.3 * diverLegRotation[0], 1, 0, 0);
      gTranslate(0, -0.375, 0);
      gScale(0.1, 0.4, 0.2);
      drawCube();
      // Diver Foot
      gPush();
      {
        gTranslate(0, -0.9, 1);
        gScale(1, 0.15, 1.4);
        drawCube();
      }
      gPop();
    }
    gPop();
  }
  gPop();
}

function renderDock() {
  gPush();
  {
    toggleTextureBlending();
    setColor(vec4(0.5, 0, 0.6, 1));
    gPush();
    {
      gTranslate(3, -3.3, 0);
      gRotate(90, 1, 0, 0);
      gScale(1.0, 1.0, 3.0);
      drawCylinder();
    }
    gPop();
    gTranslate(6, -1.5, 0);
    gScale(6.0, 0.3, 3.0);
    drawCube();
    toggleTextureBlending();
  }
  gPop();
}

//Make a bouncy sphere
//   setColor(vec4(1.0, 0.0, 0.5, 1.0));
//   gPush();
//   {
//     //Note simplified velocity and acceleration ehre are just scalars, normally they are vectors in 3D
//     bouncyBallVelocity += gravity * dt; // Update velocity using acceleration
//     bouncingCubePosition[1] += bouncyBallVelocity * dt; // Update position using velocity
//     // Check if ball hits an imaginary plane at y = 0, and also if the velocity is INTO the plane, and if it is moving at all
//     if (bouncingCubePosition[1] < 0 && bouncyBallVelocity < 0) {
//       bouncyBallVelocity = -bouncyEnergyLoss * bouncyBallVelocity; // If so, reflect the velocity back but lose some energy.
//       bouncingCubePosition[1] = 0; // Ball has most likely penetrated surface because we take discrete time steps, move back to cylinder surface
//     }
//     // gTranslate(
//     //   bouncingCubePosition[0],
//     //   bouncingCubePosition[1],
//     //   bouncingCubePosition[2]
//     // ); // Move the ball to its update position
//     // gRotate(-currentRotation[2], 1, 0, 0); // Makes the ball rotate opposite way of cylinder (looks like it is rolling on top if you texture it
//     drawSphere();
//   }
//   gPop();
