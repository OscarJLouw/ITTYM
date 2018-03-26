var Detector = { canvas: !!window.CanvasRenderingContext2D, webgl: function () { try { var e = document.createElement("canvas"); return !!window.WebGLRenderingContext && (e.getContext("webgl") || e.getContext("experimental-webgl")) } catch (t) { return false } }(), workers: !!window.Worker, fileapi: window.File && window.FileReader && window.FileList && window.Blob, getWebGLErrorMessage: function () { var e = document.createElement("div"); e.id = "webgl-error-message"; e.style.fontFamily = "monospace"; e.style.fontSize = "13px"; e.style.fontWeight = "normal"; e.style.textAlign = "center"; e.style.background = "#fff"; e.style.color = "#000"; e.style.padding = "1.5em"; e.style.width = "400px"; e.style.margin = "5em auto 0"; if (!this.webgl) { e.innerHTML = window.WebGLRenderingContext ? ['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n") : ['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n") } return e }, addGetWebGLMessage: function (e) { var t, n, r; e = e || {}; t = e.parent !== undefined ? e.parent : document.body; n = e.id !== undefined ? e.id : "oldie"; r = Detector.getWebGLErrorMessage(); r.id = n; t.appendChild(r) } };

if (!Detector.webgl) Detector.addGetWebGLMessage();

/* -- */
var debug, _width, _height, PI, Utils, CUBE_SIZE, GRID, TOTAL_CUBES, WALL_SIZE, HALF_WALL_SIZE,
    MAIN_COLOR, SECONDARY_COLOR, cubes, renderer, camera, scene, group, controls;

var composer, renderPass, pass1, pass2, pass3;

var clickTimer = null;

var mouse, raycaster, INTERSECTED;
var textureLoader = new THREE.TextureLoader();

var numPlanets = 9;    // 35 atm

var iconTextures = [
    textureLoader.load("textures/icon1.png"),
    textureLoader.load("textures/icon2.png"),
    textureLoader.load("textures/icon3.png"),
    textureLoader.load("textures/icon4.png"),
    textureLoader.load("textures/icon5.png"),
    textureLoader.load("textures/icon6.png"),
    textureLoader.load("textures/icon7.png"),
    textureLoader.load("textures/icon8.png"),
    textureLoader.load("textures/icon9.png")
];

var videoList = [
    203757114,
    215880646,
    86855268,
    72167244,
    22525981,
    12318402,
    7500745,
    141935073,
    164429908
];

if (Hls.isSupported()) {
    var hls = new Hls();
}
var loadedVideo = false;

var draggedPastMinDistance = false;
var draggedDistance = 0;
var dragging = false;

var cameraTargetTransform = new THREE.Vector3(0,0,0);
var cameraTargetTransformPrev = new THREE.Vector3(0,0,0);
var cameraTarget;

var doubleTap = false;

var projector = new THREE.Projector();

debug = false
_width = window.innerWidth
_height = window.innerHeight
PI = Math.PI

CUBE_SIZE = 100 /* width, height */
GRID = 7 /* cols, rows */
TOTAL_CUBES = (GRID * GRID)
WALL_SIZE = (GRID * CUBE_SIZE)
HALF_WALL_SIZE = (WALL_SIZE / 2)
MAIN_COLOR = 0xFFFFFF
SECONDARY_COLOR = 0x222222
cubes = []

var planetColors = [
    0x333333, //grey
    0x993333, //ruddy
    0xAA8239, //tan
    0x2D4671, //blue
    0x599532, //green
    0x267257 //bluegreen
];

var planetGeometries = [];
var iconSprites  = [];
var planetObjects = [];
renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
camera = new THREE.PerspectiveCamera(45, (_width / _height), 0.1, 30000)

var clock = new THREE.Clock();

var controlMaxDistance = 15000;

controls = new THREE.TrackballControls(camera);
controls.rotateSpeed = 1.5;
controls.zoomSpeed = 0.7;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = true;
controls.staticMoving = false;
controls.dynamicDampingFactor = 0.15;
controls.minDistance = 200;
controls.maxDistance = controlMaxDistance;
controls.maxPolarAngle = PI / 2 - 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = -0.1;

/*
controls = new THREE.OrbitControls(camera);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.1;
controls.enableZoom = true;
controls.enablePan = false;
controls.zoomSpeed = 2;
controls.minDistance = 500;
controls.maxDistance = 5000;
//controls.maxPolarAngle = PI / 2 - 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = -0.1;
*/

scene = new THREE.Scene();
group = new THREE.Object3D();

mouse = new THREE.Vector2();
raycaster = new THREE.Raycaster();

composer = new THREE.EffectComposer(renderer);
renderPass = new THREE.RenderPass(scene, camera);

Utils = {
    randomInRange: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

/* -- -- */
setupCamera(0, 0, 2000);
setupLights(group);
setupStar(group);
setupPlanets(group);


var outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);

scene.add(group);
setupRenderer(document.body)

/* -- -- */
if (debug) render()
else TweenLite.ticker.addEventListener("tick", render);
window.addEventListener('resize', resizeHandler, false);
//window.addEventListener('orientationchange', resizeHandler, false);

// stop autorotate after the first interaction
controls.addEventListener('start', function () {
    controls.autoRotate = false;
});

document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);
document.addEventListener('touchstart', onDocumentTouchStart, false);
document.addEventListener('touchend', onDocumentTouchEnd, false);
document.addEventListener('touchcancel', onDocumentTouchCancel, false);


document.addEventListener("keydown", onDocumentKeyDown, false);

var player;

function onDocumentKeyDown(event) {
    var keyCode = event.which;
    switch(keyCode)
    {
        case 27:
            console.log("ESC");
            closeVideo();
        break;
        default:
        break;
    }
}


/* -- -- */
function resizeHandler() {

    const canvas = renderer.domElement;

    let pixelRatio = window.devicePixelRatio || 0;

    _width = window.innerWidth;
    _height = window.innerHeight;

    if (canvas.width != _width || canvas.height != _width) {
        canvas.width = _width;
        canvas.height = _width;
    }

    camera.aspect = _width / _height;
    camera.updateProjectionMatrix();

    renderer.setSize(_width, _height);
    renderer.setPixelRatio(pixelRatio);
    composer.setSize(_width * pixelRatio, _height * pixelRatio);
    outlinePass.resolution = new THREE.Vector2(_width * pixelRatio, _height * pixelRatio);
    controls.handleResize();
    /*
    let pixelRatio = window.devicePixelRatio || 0;
    _width = window.innerWidth * pixelRatio;
    _height = window.innerHeight * pixelRatio;

    renderer.setSize(_width, _height);
    composer.setSize(_width, _height);
    camera.aspect = _width / _height;*/


}

/* -- CAMERA -- */
function setupCamera(x, y, z) {
    camera.position.set(x, y, z);
    resetCameraTarget();
    scene.add(camera);

}

function resetCameraTarget(){
    cameraTargetTransform.set(0,0,0);
}

function setupStar(parent) {
    var starColor = (function () {
        var colors = [0x000000, 0x000000, 0x000000, 0x000000];
        //var colors = [0xFFFF00, 0x559999, 0xFF6339, 0xFFFFFF];
        return colors[Math.floor(Math.random() * colors.length)];
    })(),
        star = new THREE.Mesh(
            new THREE.IcosahedronGeometry(30, 1),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
            })
        ),
        glows = [];

    star.castShadow = false;
    scene.add(star);

    for (var i = 1, scale = 1.1, scale = 1.1, scale = 1.1; i < 5; i++) {
        var starGlow = new THREE.Mesh(
            new THREE.IcosahedronGeometry(30, 1),
            new THREE.MeshBasicMaterial({
                color: starColor,
                transparent: true,
                opacity: 0.5,
                depthWrite: false
            })
        );
        starGlow.castShadow = false;
        scale += 0.4 + Math.random() * .5;
        starGlow.scale.set(scale, scale, scale);
        starGlow.origScale = {
            x: scale,
            y: scale,
            z: scale
        };
        glows.push(starGlow);
        scene.add(starGlow);
    }
}

function shuffleArrays()
{
    videoList = shuffle(videoList);
    iconTextures = shuffle(iconTextures);
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}
  

function setupPlanets(parent) {
    shuffleArrays();
    
    var planetShapes = [
        "SphereGeometry",
        "ConeGeometry",
        //"TorusGeometry",
        "TorusKnotGeometry",
        "TetrahedronGeometry",
        "IcosahedronGeometry",
        "DodecahedronGeometry"
    ];

    var rotationAxes = ['x', 'y', 'z'];

    for (var p = 0, radii = 0; p < numPlanets; p++) {

        var type = Math.floor(Math.random() * planetColors.length);
        var size = THREE.Math.clamp(THREE.Math.randInt(10, 30) + 10 * Math.sin(p / 7), 20, 100);

        var planetShape = Math.floor(Math.random() * planetShapes.length);

        var geometry;
        var material = new THREE.MeshLambertMaterial({ color: planetColors[type] });

        var detail = Math.random() > .6 ? 1 : 0;

        var rotationDuration = THREE.Math.randInt(5, 50); // in seconds

        var rotationAxis = rotationAxes[Math.floor(Math.random() * rotationAxes.length)];


        var planet = new THREE.Object3D();
        var planetWithOrbit = new THREE.Object3D();

        var orbitRadius = Math.random() * 50 + 200 + radii;
        var orbitSpeed = THREE.Math.randFloat(50 + p * 5, 200 + p * 5);
        //planet.position.set(planet.orbitRadius, 0, 0);


        
        
        switch (planetShapes[planetShape]) {
            case "SphereGeometry":
                geometry = new THREE.SphereGeometry(size, THREE.Math.randInt(3, 10), THREE.Math.randInt(2, 10));
                break;
            case "ConeGeometry":
                geometry = new THREE.ConeGeometry(size, THREE.Math.randInt(2 * size / 3, size), THREE.Math.randInt(3, 8));
                break;
            case "TorusGeometry":
                geometry = new THREE.TorusGeometry(size, THREE.Math.randInt(size / 4, size), THREE.Math.randInt(3, 10), THREE.Math.randInt(3, 10));
                break;
            case "TorusKnotGeometry":
                var pValues = [1, 2, 4, 5, 7, 8, 10, 11];
                geometry = new THREE.TorusKnotGeometry(size, THREE.Math.randInt(size / 3, size / 2), 64, THREE.Math.randInt(3, 8),
                    pValues[THREE.Math.randInt(0, pValues.length)],
                    3);
                break;
            case "TetrahedronGeometry":
                geometry = new THREE.TetrahedronGeometry(size, THREE.Math.randInt(0, 3));
                break;
            case "IcosahedronGeometry":
                geometry = new THREE.IcosahedronGeometry(size, detail);
                break;
            case "DodecahedronGeometry":
                geometry = new THREE.DodecahedronGeometry(size, detail);
                break;
            default:
                geometry = new THREE.IcosahedronGeometry(size, detail);
                break;
        }

        planet.size = size;

        geometry.computeFlatVertexNormals()

        planetGeom = new THREE.Mesh(geometry, material);

        planetGeom.castShadow = true;
        planetGeom.receiveShadow = true;

        planetGeom.position.set(orbitRadius, 0, 0);



        planet.add(planetGeom);

        var spriteMaterial = new THREE.SpriteMaterial({ map: iconTextures[p], color: 0xffffff });
        var iconSprite = new THREE.Sprite(spriteMaterial);
        //iconSprite.position.set(orbitRadius,50,0);
        //particle.position.set(0,1,0);
        iconSprite.scale.x = iconSprite.scale.y = 30;
        //planet.add(iconSprite);
        iconSprite.size = size;
        
        

        planetGeometries.push(planetGeom);
        iconSprite.index = planetGeometries.length;
        iconSprites.push(iconSprite);



        scene.add(iconSprite);
        
        configRotation = {
            ease: Power0.easeNone,
            delay: 0,
            repeat: -1
        }

        configRotation[rotationAxis] = (Math.random() > .6 ? 1 : -1) * 2 * Math.PI;

        TweenMax.to(
            planetGeom.rotation,
            rotationDuration,
            configRotation
        )

        // ATMOSPHERE

        planet.planetIndex = p;
        planetGeom.planetIndex = p;
        iconSprite.planetIndex = p;

        if (type > 1 && Math.random() > 0.5) {
            var atmoGeom = new THREE.Mesh(geometry.clone().scale(1.2, 1.2, 1.2),
                new THREE.MeshLambertMaterial({
                    color: planetColors[3],
                    flatShading: true,
                    transparent: true,
                    opacity: 0.3,
                    depthWrite: false
                })
            );
            atmoGeom.receiveShadow = false;
            atmoGeom.castShadow = false;
            planet.add(atmoGeom);
            TweenMax.to(
                atmoGeom.rotation,
                rotationDuration,
                configRotation
            )


            atmoGeom.planetIndex = p;
            atmoGeom.position.set(orbitRadius, 0, 0);

        }

        radii = orbitRadius + size;


        var orbitInitialRotation = new THREE.Vector3(THREE.Math.degToRad(Math.random() * 180), THREE.Math.degToRad(Math.random() * 180), THREE.Math.degToRad(Math.random() * 180));

        //planet.rotation = orbitInitialRotation;
        //planet.rotation.x = orbitInitialRotation.x;
        //planet.rotation.y = orbitInitialRotation.y;
        //planet.rotation.z = orbitInitialRotation.z;

        configOrbit = {
            ease: Power0.easeNone,
            delay: 0,
            repeat: -1
        }

        configOrbit['y'] = 2 * Math.PI;

        TweenMax.to(
            planet.rotation,
            orbitSpeed,
            configOrbit
        )

        //parent.add(planet);
        planetObjects.push(planet);

        var vertexCount = 90;
        var circleGeom = new THREE.CircleGeometry(orbitRadius, vertexCount);
        var orbitGeom = new THREE.Geometry();

        for(var i = 1; i<=vertexCount; i++)
        {
            orbitGeom.vertices.push( circleGeom.vertices[i] );
        }
        orbitGeom.vertices.push(orbitGeom.vertices[0]);
        
        //orbitGeom.vertices.shift();

        var orbit = new THREE.Line(
            orbitGeom,
            new THREE.MeshBasicMaterial({
                color: planetColors[type],
                transparent: true,
                opacity: .3,
                side: THREE.BackSide
            })
        );

        
        //orbit.geometry.vertices.push( orbit.geometry.vertices[0].clone() ); 
        

        //orbit.rotation.x = orbitInitialRotation.x;
        //orbit.rotation.y = orbitInitialRotation.y;
        //orbit.rotation.z = orbitInitialRotation.z;

        orbit.rotation.x = THREE.Math.degToRad(90);
        //orbit.rotation.x = THREE.Math.degToRad(Math.random() * 180);
        //orbit.rotation.y = THREE.Math.degToRad(Math.random() * 180);
        //orbit.rotation.z = THREE.Math.degToRad(Math.random() * 180);
        //parent.add(orbit);

        

        planetWithOrbit.add(planet);
        planetWithOrbit.add(orbit);

        planetWithOrbit.rotation.x = THREE.Math.degToRad(Math.random() * 180);
        planetWithOrbit.rotation.y = THREE.Math.degToRad(Math.random() * 180);
        planetWithOrbit.rotation.z = THREE.Math.degToRad(Math.random() * 180);

        parent.add(planetWithOrbit);
    }
}

/* -- LIGHTS -- */
function setupLights(parent) {
    var pointLight = new THREE.PointLight(0xffffff, 2, 10000);

    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = false;
    //pointLight.shadow.mapSize.width = 2048;
    //pointLight.shadow.mapSize.height = 2048;
    //pointLight.shadow.camera.near = 1;
    //pointLight.shadow.camera.far = 5000;
    //pointLight.shadow.bias = - 0.005;


    parent.add(pointLight);

    //ambient_light = new THREE.AmbientLight(0xffffff, 0.5)
    //parent.add(ambient_light);
    /*
    var light2 = new THREE.AmbientLight(0x090909);
    parent.add(light2);
    */

    /*
    var light, soft_light, ambient_light;

    light = new THREE.DirectionalLight(0xffffff, 0.5);
    soft_light = new THREE.DirectionalLight(0xffffff, 0.5);
    ambient_light = new THREE.AmbientLight(0xffffff, 0.5)

    light.position.set(-WALL_SIZE, -WALL_SIZE, CUBE_SIZE * GRID);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    //light.shadow.bias = -0.001;
    light.shadow.camera.left = -1000; // or whatever value works for the scale of your scene
    light.shadow.camera.right = 1000;
    light.shadow.camera.top = 1000;
    light.shadow.camera.bottom = -1000;

    soft_light.position.set(WALL_SIZE, WALL_SIZE, CUBE_SIZE * GRID);

    parent.add(light).add(soft_light).add(ambient_light);
    */
	/*
	var shadowCameraHelper = new THREE.CameraHelper(light.shadow.camera);
	shadowCameraHelper.visible = true;
	parent.add(shadowCameraHelper)
	*/
}

/* -- RENDERER -- */
function setupRenderer(parent) {

    parent.appendChild(renderer.domElement);

    resizeHandler();

    //renderer.setSize(_width, _height);
    //composer.setSize(_width * pixelRatio, _height * pixelRatio);
    renderer.setClearColor(MAIN_COLOR, 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;



    /*
    sobelPass= new THREE.ShaderPass(THREE.SobelOperatorShader ); 
    sobelPass.uniforms.resolution.value.x = window.innerWidth;
    sobelPass.uniforms.resolution.value.y = window.innerHeight; 
    */

    filmPass = new THREE.ShaderPass(THREE.FilmShader);
    filmPass.uniforms["time"].value = 0.8;
    filmPass.uniforms["nIntensity"].value = 0.3;
    filmPass.uniforms["sIntensity"].value = 0.3;
    filmPass.uniforms["grayscale"].value = false;

    rgbShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);
    rgbShiftPass.uniforms["amount"].value = 0.001;

    /*
    outlinePass.visibleEdgeColor = new THREE.Color( 0, 1, 0 );
    outlinePass.hiddenEdgeColor = new THREE.Color( 0, 1, 0 );
	outlinePass.edgeThickness = 100.0;
    outlinePass.edgeStrength = 100.0;
    */

    //renderPass.renderToScreen = true;
    //sobelPass.renderToScreen = true;
    //filmPass.renderToScreen = true;
    rgbShiftPass.renderToScreen = true;

    composer.addPass(renderPass);
    //composer.addPass(outlinePass);
    //composer.addPass(sobelPass);
    composer.addPass(filmPass);
    composer.addPass(rgbShiftPass);
}


window.addEventListener('mousemove', onTouchMove);
window.addEventListener('touchmove', onTouchMove);

function onTouchMove(event) {
    var x, y;
    if (event.changedTouches) {
        x = event.changedTouches[0].pageX;
        y = event.changedTouches[0].pageY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = - (y / window.innerHeight) * 2 + 1;
    //checkIntersection();
}

function addSelectedObject(object) {
    selectedObjects = [];
    selectedObjects.push(object);
}

function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(planetGeometries, true);
    if (intersects.length > 0) {
        // if the closest object intersected is not the currently stored intersection object
        if (intersects[0].object != INTERSECTED) {
            // restore previous intersection object (if it exists) to its original color
            if (INTERSECTED)
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            // store reference to closest object as current intersection object
            INTERSECTED = intersects[0].object;
            // store color of closest object (for later restoration)
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            // set a new color for closest object
            INTERSECTED.material.emissive.setHex(0x00ffff);
        }
    }
    else // there are no intersections
    {
        // restore previous intersection object (if it exists) to its original color
        if (INTERSECTED)
            INTERSECTED.material.emissive.setHex(0x000000);
        // remove previous intersection object reference
        //     by setting current intersection object to "nothing"
        INTERSECTED = null;
    }
}


function render() {
    //checkIntersection();
    
    if (cameraTarget) {
        if(!loadedVideo)
            playVideo(cameraTarget.planetIndex);
        //controls.noZoom = true;
        //controls.minDistance = 200;
        //controls.maxDistance = 200;

        var vector = new THREE.Vector3();

        cameraTargetTransform.copy(vector.setFromMatrixPosition(cameraTarget.matrixWorld));
        
        
        //camera.position.lerp(cameraTargetTransform, clock.getDelta());
        //camera.position.add(cameraTargetTransformPrev.sub(cameraTargetTransform));

        var pan = new THREE.Vector3(0,0,0);
        pan.subVectors( cameraTargetTransform, cameraTargetTransformPrev );

        var length = new THREE.Vector3(0,0,0);
        length.subVectors(controls.object.position, cameraTargetTransform);

        //console.log(length.length());

        if(length.length () < 450)
        {
            controls.object.position.add( pan );
            controls.target.add( pan );
            //cameraTargetTransform.add( pan );
            //cameraTargetTransformPrev.add( pan );
        }

        //controls.target.add( pan );
       

        //controls.object.position.add(cameraTargetTransformPrev.sub(cameraTargetTransform));

        controls.minDistance = THREE.Math.lerp(controls.minDistance, 200, 0.05);
        controls.maxDistance = THREE.Math.lerp(controls.maxDistance, 400, 0.05);

        //console.log("Min distance: " + controls.minDistance);
        //console.log("Max distance: " + controls.maxDistance);
        //controls.target.add(cameraTargetTransform.sub(cameraTargetTransformPrev))
        //camera.position.add(cameraTargetTransformPrev.sub(cameraTargetTransform));
        //camera.position.copy( cameraTarget.position );
        //camera.position.copy( new THREE.Vector3(0,100,0) );
    }

    // put icons above each planet
    for(var i = 0; i<iconSprites.length; i++)
    {
        var targetPosition = new THREE.Vector3();
        targetPosition = targetPosition.setFromMatrixPosition( planetGeometries[i].matrixWorld );

        var eyeDistance = targetPosition.distanceTo(camera.position);


        
        targetPosition.add(camera.up.clone().multiplyScalar(eyeDistance/80).clampLength(40 + iconSprites[i].size * 3, 150));
        iconSprites[i].position.set(targetPosition.x, targetPosition.y, targetPosition.z);//.add(new THREE.Vector3(10,10,10)));
        iconSprites[i].scale.x = iconSprites[i].scale.y = THREE.Math.clamp(eyeDistance/80, 40, 300);


        /*
        //var width = 640, height = 480;
        var widthHalf = _width / 2, heightHalf = _height / 2;

        var vector = new THREE.Vector3();
        
        projector.projectVector( vector.setFromMatrixPosition( planetGeometries[i].matrixWorld ), camera );

        vector.x = ( vector.x * widthHalf ) + widthHalf;
        vector.y = - ( vector.y * heightHalf ) + heightHalf;

        if(vector.sub(new THREE.Vector3(widthHalf, heightHalf, 0)).length() > widthHalf/3)
        {
            //iconSprites[i].scale.multiplyScalar(0.9);
            //iconSprites[i].material.opacity = 0.5;
        } else {
            //console.log(vector.length());
            //iconSprites[i].scale.multiplyScalar(1.2);
            //iconSprites[i].material.opacity = 1;
        }
        */
    }
    //console.log("Pre: " + controls.object.up.x);
    controls.target.lerp(cameraTargetTransform, clock.getDelta()*5);
    
    

    controls.update(clock.getDelta());
    //renderer.render(scene, camera)
    filmPass.uniforms["time"].value += Math.random();
    if(filmPass.uniforms["time"].value > 1)
        filmPass.uniforms["time"].value = Math.random();
    composer.render(clock.getDelta());

    cameraTargetTransformPrev.copy(cameraTargetTransform);
    doubleTap = false;
    //console.log("Post: " + controls.object.up.x);
}



function onDocumentTouchStart(event) {

    event.preventDefault();

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseUp(event);

}

function onDocumentTouchEnd(event) {

    event.preventDefault();

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    //onDocumentMouseUp(event);

}

function onDocumentTouchCancel(event) {

    event.preventDefault();

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseUp(event);

}

function onDocumentMouseDown(event) {

    

    /*
    // Parse all the faces
    for ( var i in intersects ) {

        intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );

    }
    */
}


function onDocumentMouseUp(event) {
    if (clickTimer == null) {
        clickTimer = setTimeout(function () {
            clickTimer = null;

        }, 300)
    } else {
        clearTimeout(clickTimer);
        clickTimer = null;
        doubleTap = true;

    }

    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(planetObjects, true);
    var intersects2 = raycaster.intersectObjects(iconSprites, false);

    if (intersects.length > 0) {
        controls.minDistance = 200;
        controls.maxDistance = controlMaxDistance;
        //intersects[0].object.material.color.setHex(Math.random() * 0xffffff);


        /*

        var vector = new THREE.Vector3().copy(intersects[0].point);
        intersects[0].object.worldToLocal(vector);
        
        
        var particle = new THREE.Sprite(spriteMaterial);
        particle.position.copy(vector);
        particle.scale.x = particle.scale.y = 5;
        intersects[0].object.add(particle);
        */

        cameraTarget = intersects[0].object;

        

        //controls.target.set(intersects[0].object.position);
        //controls.target.copy(intersects[0].point);
        //camera.position.copy(intersects[0].point);
    } else if(intersects2.length > 0)
    {
        controls.minDistance = 200;
        controls.maxDistance = controlMaxDistance;

        cameraTarget = intersects2[0].object;
        //cameraTarget = planetObjects[intersects2[0].object.index];

    } else if(cameraTarget && doubleTap)
    {
        closeVideo();
        //controls.reset();
        controls.minDistance = 500;
        controls.maxDistance = controlMaxDistance;
        cameraTargetTransform = new THREE.Vector3(0,0,0);
        cameraTargetTransformPrev = new THREE.Vector3(0,0,0);
        //controls.object.position.set( cameraTargetTransform );
        //controls.target.copy( cameraTargetTransform );
        cameraTarget = null;
        //camera.position.set(0, 0, 2000);
        //resetCameraTarget();
        
    }
}

function RandomRangeExcept(min, max, except) {
    do {
        var number = THREE.Math.randInt(min, max);
    } while (number == except);
    return number;
}


function playVideo(videoIndex)
{
    /*
    var video = document.querySelector('#player');
    var videoContainer = document.querySelector('#playerContainer');

    videoContainer.style.display = "block";
    video.style.display = "block";

    poster="";

    if (Hls.isSupported()) {
        hls.loadSource("./streams/birst/boredomisragespreadthin.m3u8");

        //hls.loadSource('//storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd');
        //hls.loadSource('https://content.jwplatform.com/manifests/vM7nH0Kl.m3u8');

        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED,function() {
        });
    }
    
    plyr.setup(video);
    loadedVideo = true;
    */
   /*
   var videoContainer = document.querySelector('#playerContainer');

    videoContainer.style.display = "block";

   var options = {
        id: 198639196,
        loop: false
    };

    var player = new Vimeo.Player('video-player', options);

    //player.setVolume(0);

    player.on('play', function() {
        console.log('played the video!');
    });
    */

   var videoContainer = document.querySelector('#playerContainer');

   videoContainer.style.display = "block";

   //var iframe = document.querySelector('iframe');
   var options = {
       id: videoList[videoIndex],
       autoplay: true,
       byline: false,
       color: '#ffffff',
       playsinline: false,
       title: false,
       background: false
    };

   player = new Vimeo.Player('playerContainer', options);

   player.setColor('#ffffff');

   player.loadVideo(videoList[videoIndex]);
   
   //console.log(videoIndex);
   loadedVideo = true;

}

function closeVideo()
{
    controls.minDistance = 500;
    controls.maxDistance = controlMaxDistance;
    cameraTargetTransform = new THREE.Vector3(0,0,0);
    cameraTargetTransformPrev = new THREE.Vector3(0,0,0);
    cameraTarget = null;

    player.unload();
    /*
    if (Hls.isSupported()) {
        hls.stopLoad();
        hls.detachMedia();
    }
    */
    //var video = document.querySelector('#player');
    var videoContainer = document.querySelector('#playerContainer');

    videoContainer.style.display = "none";
    //video.style.display = "none";
    loadedVideo = false;
}