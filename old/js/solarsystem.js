var params = {
  planets: 60,
  speed: 2,
  height: 0
}

function getMat(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: .9,
    emissive: 0x222222,
    shading: THREE.FlatShading
  });
}

var Colors = {
  green: 0x999999,
  blue: 0x777777,
  orange: 0x222222,
  yellow: 0x444444,
}

colorsLength = Object.keys(Colors).length;

function getRandomColor() {
  var colIndx = Math.floor(Math.random() * colorsLength);
  var colorStr = Object.keys(Colors)[colIndx];
  return Colors[colorStr];
}

var scene, renderer, camera, saturn, light;

var WIDTH = window.innerWidth,
  HEIGHT = window.innerHeight;

var controls;

// initialise the world

function initWorld() {
  //
  // THE SCENE
  // 
  scene = new THREE.Scene();

  //
  // THE CAMERA
  //

  // Perspective or Orthographic
  // Field of view : I use 75, play with it
  // Aspect ratio : width / height of the screen
  // near and far plane : I usually set them at .1 and 2000
  /*
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  */
  camera = new THREE.PerspectiveCamera(750, WIDTH / HEIGHT, .1, 20000);
  camera.position.z = 2200;
  camera.position.y = 700;

  //
  // THE RENDERER
  //
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  // Make the renderer use the #world div to render le scene
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  //
  // LIGHT
  //
  ambientLight = new THREE.AmbientLight(0x888888, 2);
  scene.add(ambientLight);

  light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(200, 100, 200);
  light.castShadow = true;
  light.shadow.camera.left = -400;
  light.shadow.camera.right = 400;
  light.shadow.camera.top = 400;
  light.shadow.camera.bottom = -400;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 4000;
  light.shadow.mapSize.width = 4048;
  light.shadow.mapSize.height = 4048;


  scene.add(light);

  //
  // CONTROLS
  // used to rotate around the scene with the mouse
  // you can drag to rotate, scroll to zoom
  //
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  controls.rotateSpeed = 0.25;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = 0.9;
  controls.minDistance = 1000;
  controls.maxDistance = 5000;
  controls.maxPolarAngle = 2*Math.PI/3;
  controls.minPolarAngle = Math.PI/3;

  //
  // HANDLE SCREEN RESIZE
  //
  window.addEventListener('resize', handleWindowResize, false);

  //
  // CREATE THE OBJECT
  //
  solarSystem = new SolarSystem();
  scene.add(solarSystem.mesh);

  // START THE LOOP
  loop();

}

var SolarSystem = function () {
  // - a mesh for the sun
  // - a mesh for the ring
  // - a mesh that holds the sun and the ring
  var planetGeom = new THREE.TetrahedronGeometry(150, 4);

  var noise = 5;
  for (var i = 0; i < planetGeom.vertices.length; i++) {
    var v = planetGeom.vertices[i];
    v.x += -noise / 2 + Math.random() * noise;
    v.y += -noise / 2 + Math.random() * noise;
    v.z += -noise / 2 + Math.random() * noise;
  }

  var matPlanet = getMat(Colors.yellow);


  this.sun = new THREE.Mesh(planetGeom, matPlanet);

  this.orbits = new THREE.Mesh();
  this.nPlanets = 0;

  this.updatePlanetsCount();

  this.mesh = new THREE.Object3D();
  this.mesh.add(this.sun);
  this.mesh.add(this.orbits);

  this.sun.castShadow = true;
  this.sun.receiveShadow = true;

  this.updatePlanetsRotation();
}

SolarSystem.prototype.updatePlanetsCount = function () {


  if (this.nPlanets < params.planets) {

    for (var i = this.nPlanets; i < params.planets; i++) {
      var p = new Planet();
      p.mesh.rotation.x = Math.random() * Math.PI;
      p.mesh.rotation.y = Math.random() * Math.PI;
      p.mesh.position.y = -2 + Math.random() * 4;
      this.orbits.add(p.mesh);
    }
  } else {

    while (this.nPlanets > params.planets) {
      var m = this.orbits.children[this.nPlanets - 1];
      this.orbits.remove(m);
      m.userData.po = null;
      this.nPlanets--;
    }
  }
  this.nPlanets = params.planets;

  this.angleStep = Math.PI * 2 / this.nPlanets;
  this.updatePlanetsDefiniton();
}

SolarSystem.prototype.updatePlanetsDefiniton = function () {

  for (var i = 0; i < this.nPlanets; i++) {
    var m = this.orbits.children[i];
    var s = Math.random() * (5, 1) + 1;
    m.scale.set(s, s, s);

    // set a random distance
    m.userData.distance = 100 * (i + 1) + 150;

    // give a unique angle to each particle
    // m.userData.angle = this.angleStep*i;
    m.userData.angle = Math.random() * (360 - 0) + 0;
    // set a speed proportionally to the distance
    m.userData.angularSpeed = params.speed / (m.userData.distance * 2);
    // m.userData.angularSpeed = 0.01;
  }
}

// Update particles position
SolarSystem.prototype.updatePlanetsRotation = function () {

  // increase the rotation of each particle
  // and update its position

  for (var i = 0; i < this.nPlanets; i++) {
    var m = this.orbits.children[i];
    // increase the rotation angle around the planet
    m.userData.angle += m.userData.angularSpeed;

    // calculate the new position
    var posX = Math.cos(m.userData.angle) * m.userData.distance;
    var posZ = Math.sin(m.userData.angle) * m.userData.distance;
    m.position.x = posX + this.sun.position.x;
    m.position.z = posZ + this.sun.position.z;
    m.position.y = this.sun.position.y;

    //*
    // add a local rotation to the particle
    // m.rotation.x += Math.random()*.05;
    m.rotation.y += .03;
    // m.rotation.z += Math.random()*.05;
    //*/
  }
}

var Planet = function () {
  // Size of the planet, make it random
  var s = 1;

  var geom = new THREE.TetrahedronGeometry(20, 2);

  var noise = 2;
  for (var i = 0; i < geom.vertices.length; i++) {
    var v = geom.vertices[i];
    v.x += -noise / 2 + Math.random() * noise;
    v.y += -noise / 2 + Math.random() * noise;
    v.z += -noise / 2 + Math.random() * noise;
  }

  // color of the particle, make it random and get a material
  var color = getRandomColor();
  var mat = getMat(color);

  // create the mesh of the particle
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.receiveShadow = true;
  this.mesh.castShadow = true;
  this.mesh.userData.po = this;
}

function loop() {

  controls.update();

  solarSystem.sun.position.y = params.height;
  solarSystem.sun.rotation.z -= .003;
  solarSystem.sun.rotation.y += .003;

  solarSystem.updatePlanetsRotation()
  //  
  // RENDER !
  //
  renderer.render(scene, camera);

  //
  // REQUEST A NEW FRAME
  //
  requestAnimationFrame(loop);
}

function handleWindowResize() {
  // Recalculate Width and Height as they had changed
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // Update the renderer and the camera
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(WIDTH * window.devicePixelRatio, HEIGHT * window.devicePixelRatio);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

initWorld();
