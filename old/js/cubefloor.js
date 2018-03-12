
var Detector = { canvas: !!window.CanvasRenderingContext2D, webgl: function () { try { var e = document.createElement("canvas"); return !!window.WebGLRenderingContext && (e.getContext("webgl") || e.getContext("experimental-webgl")) } catch (t) { return false } }(), workers: !!window.Worker, fileapi: window.File && window.FileReader && window.FileList && window.Blob, getWebGLErrorMessage: function () { var e = document.createElement("div"); e.id = "webgl-error-message"; e.style.fontFamily = "monospace"; e.style.fontSize = "13px"; e.style.fontWeight = "normal"; e.style.textAlign = "center"; e.style.background = "#fff"; e.style.color = "#000"; e.style.padding = "1.5em"; e.style.width = "400px"; e.style.margin = "5em auto 0"; if (!this.webgl) { e.innerHTML = window.WebGLRenderingContext ? ['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n") : ['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n") } return e }, addGetWebGLMessage: function (e) { var t, n, r; e = e || {}; t = e.parent !== undefined ? e.parent : document.body; n = e.id !== undefined ? e.id : "oldie"; r = Detector.getWebGLErrorMessage(); r.id = n; t.appendChild(r) } };

if (!Detector.webgl) Detector.addGetWebGLMessage();

/* -- */
var debug, _width, _height, PI, Utils, CUBE_SIZE, GRID, TOTAL_CUBES, WALL_SIZE, HALF_WALL_SIZE,
    MAIN_COLOR, SECONDARY_COLOR, cubes, renderer, camera, scene, group, controls;

var composer, renderPass, pass1, pass2, pass3;

var mouse, raycaster;
var textureLoader = new THREE.TextureLoader();
var selectionTexture = textureLoader.load( "textures/selectionTexture.png" );
var spriteMaterial = new THREE.SpriteMaterial( { map: selectionTexture, color: 0x000000 } );

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

renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
camera = new THREE.PerspectiveCamera(45, (_width / _height), 0.1, 10000)
controls = new THREE.OrbitControls(camera);
controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.rotateSpeed = 0.1;
controls.enableZoom = true;
controls.enablePan = false;
controls.zoomSpeed = 0.9;
controls.minDistance = 500;
controls.maxDistance = 1200;
controls.maxPolarAngle = PI / 2 - 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = -0.1;
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
setupCamera(0, 500, 1000)
setupBox(group)
setupFloor(group)
setupCubes(group)
setupLights(group)
setupText(group)
//group.position.y = 50
group.rotation.set(-90 * (PI / 180), 0, -45 * (PI / 180))
scene.add(group)
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

document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'touchstart', onDocumentTouchStart, false );


/* -- -- */
function resizeHandler() {

    const canvas = renderer.domElement;

    let pixelRatio = window.devicePixelRatio || 0;

    _width = window.innerWidth;
    _height = window.innerHeight;

    if (canvas.width  != _width || canvas.height != _width) {
        canvas.width  = _width;
        canvas.height = _width;
    }

    camera.aspect = _width / _height;
    camera.updateProjectionMatrix();

    renderer.setSize(_width, _height);
    renderer.setPixelRatio( pixelRatio );
    composer.setSize(_width * pixelRatio, _height * pixelRatio);
    
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
    camera.position.set(x, y, z)
    scene.add(camera)
    controls.update();

}

/* -- TEXT -- */
function setupText(parent) {
    var loader = new THREE.FontLoader();

    loader.load('fonts/SkarpaLt.json', function (font) {

        // TEXT MATERIAL
        var material = new THREE.MeshLambertMaterial({
            color: MAIN_COLOR
        })

        // SMALL TEXT
        // generate geometry
        var textGeo = new THREE.TextGeometry('IN TEN THOUSAND YEARS, MAYBE.', {
            font: font,
            size: 50,
            height: 1,
            curveSegments: 1
        });

        textGeo.computeBoundingBox();
        textGeo.computeVertexNormals();
        textMesh1 = new THREE.Mesh(textGeo, material);
        textMesh1.castShadow = true;
        textMesh1.receiveShadow = true;

        // position text and add to scene
        var centerOffsetX = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
        var centerOffsetY = -0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
        var centerOffsetZ = (textGeo.boundingBox.max.z - textGeo.boundingBox.min.z);
        textMesh1.position.x = -WALL_SIZE - centerOffsetZ;
        textMesh1.position.y = -WALL_SIZE / 2 - centerOffsetZ;
        textMesh1.position.z = -textGeo.boundingBox.max.y;
        textMesh1.rotation.x = Math.PI / 2;
        textMesh1.rotation.y = Math.PI / 2;

        parent.add(textMesh1);

        // animate text up once loaded
        config = {
            ease: Sine.easeOut,
            delay: 1,
            repeat: 0
        }

        config['z'] = 0;

        TweenMax.to(
            textMesh1.position,
            2,
            config
        )

        // LARGE TEXT
        // generate geometry
        var textGeo2 = new THREE.TextGeometry('ITTYM', {
            font: font,
            size: 180,
            height: 50,
            curveSegments: 1
        });

        textGeo2.computeBoundingBox();
        textGeo2.computeVertexNormals();
        textMesh2 = new THREE.Mesh(textGeo2, material);
        textMesh2.castShadow = true;
        textMesh2.receiveShadow = true;

        // position text and add to scene
        var centerOffsetX = -0.5 * (textGeo2.boundingBox.max.x - textGeo2.boundingBox.min.x);
        var centerOffsetY = -0.5 * (textGeo2.boundingBox.max.y - textGeo2.boundingBox.min.y);
        var centerOffsetZ = (textGeo2.boundingBox.max.z - textGeo2.boundingBox.min.z);
        textMesh2.position.x = centerOffsetX;
        textMesh2.position.y = WALL_SIZE / 2 + centerOffsetZ;
        textMesh2.position.z = -textGeo2.boundingBox.max.y;
        textMesh2.rotation.x = Math.PI / 2;

        parent.add(textMesh2);

        // animate text up once loaded
        config = {
            ease: Sine.easeOut,
            delay: 0,
            repeat: 0
        }

        config['z'] = 0;

        TweenMax.to(
            textMesh2.position,
            2,
            config
        )
    });


}
/* -- BOX -- */
function setupBox(parent) {
    
    var i, boxesArray, geometry, material

    boxesArray = []
    geometry = new THREE.BoxGeometry(WALL_SIZE, WALL_SIZE, 0.05)
    geometry.faces[8].color.setHex(SECONDARY_COLOR)
    geometry.faces[9].color.setHex(SECONDARY_COLOR)
    geometry.colorsNeedUpdate = true
    material = new THREE.MeshBasicMaterial({
        color: MAIN_COLOR,
        vertexColors: THREE.FaceColors
    })

    for (i = 0; i < 5; i++) {
        boxesArray.push(new THREE.Mesh(geometry, material))
    }

    // back
    boxesArray[0].position.set(0, HALF_WALL_SIZE, -HALF_WALL_SIZE)
    boxesArray[0].rotation.x = 90 * (PI / 180)

    // right
    boxesArray[1].position.set(HALF_WALL_SIZE, 0, -HALF_WALL_SIZE)
    boxesArray[1].rotation.y = -90 * (PI / 180)

    // front
    boxesArray[2].position.set(0, -HALF_WALL_SIZE, -HALF_WALL_SIZE)
    boxesArray[2].rotation.x = -90 * (PI / 180)

    // left
    boxesArray[3].position.set(-HALF_WALL_SIZE, 0, -HALF_WALL_SIZE)
    boxesArray[3].rotation.y = 90 * (PI / 180)

    // bottom
    boxesArray[4].position.set(0, 0, -WALL_SIZE)

    boxesArray.forEach(function (box) {
        parent.add(box)
    });
}

/* -- FLOOR -- */
function setupFloor(parent) {
    var i, tilesArray, geometry, material

    tilesArray = []
    geometry = new THREE.PlaneBufferGeometry(WALL_SIZE, WALL_SIZE)
    material = new THREE.MeshLambertMaterial({
        color: MAIN_COLOR
    })

    for (i = 0; i < 8; i++) {
        tilesArray.push(new THREE.Mesh(geometry, material))
    }

    tilesArray[0].position.set(-WALL_SIZE, WALL_SIZE, 0)
    tilesArray[1].position.set(0, WALL_SIZE, 0)
    tilesArray[2].position.set(WALL_SIZE, WALL_SIZE, 0)
    tilesArray[3].position.set(-WALL_SIZE, 0, 0)
    tilesArray[4].position.set(WALL_SIZE, 0, 0)
    tilesArray[5].position.set(-WALL_SIZE, -WALL_SIZE, 0)
    tilesArray[6].position.set(0, -WALL_SIZE, 0)
    tilesArray[7].position.set(WALL_SIZE, -WALL_SIZE, 0)

    tilesArray.forEach(function (tile) {
        tile.castShadow = true;
        tile.receiveShadow = true;
        parent.add(tile)
    })
}

/* -- CUBES --*/
function setupCubes(parent) {
    var i, geometry, material, x, y, row, col, minDuration, maxDuration, minDelay, maxDelay, attrOptions, attr, direction, config

    geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, 1)
    
    x = 0
    y = 0
    row = 0
    col = 0
    minDuration = 2
    maxDuration = 5
    minDelay = 0
    maxDelay = 0

    for (i = 0; i < TOTAL_CUBES; i++) {
        material = new THREE.MeshLambertMaterial({ color: MAIN_COLOR })
        cubes.push(new THREE.Mesh(geometry, material))

        if ((i % GRID) === 0) {
            col = 1
            row++
        } else col++

        x = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * col) + (CUBE_SIZE / 2))
        y = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * row) + (CUBE_SIZE / 2))

        cubes[i].position.set(x, y, 0)
    }

    cubes.forEach(function (cube) {
        cube.castShadow = true
        cube.receiveShadow = true

        if (debug) {
            cube.rotation.x = (Math.random() * 10)
        } else {
            config = {
                ease: Elastic.easeInOut,
                delay: 0,
                repeat: -1,
                yoyo: true
            }

            config['z'] = (cube.position.y - cube.position.x) / 3

            TweenMax.to(
                cube.position,
                10,
                config
            )

            config2 = {
                ease: Sine.easeInOut,
                delay: 0,
                repeat: -1,
                yoyo: true
            }

            config2['x'] = 0.3
            config2['y'] = 0.3
            config2['z'] = (cube.position.x - cube.position.y) / 2

            TweenMax.to(
                cube.scale,
                10,
                config2
            )


            configRotation = {
                ease: Back.easeInOut,
                delay: 5,
                repeat: -1,
                yoyo: true
            }

            configRotation['z'] = cube.position.x * Math.PI / 180

            TweenMax.to(
                cube.rotation,
                10,
                configRotation
            )

        }

        parent.add(cube)
    })
}

/* -- LIGHTS -- */
function setupLights(parent) {
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
   


    //sobelPass= new THREE.ShaderPass(THREE.SobelOperatorShader ); 
    //sobelPass.uniforms.resolution.value.x = window.innerWidth;
    //sobelPass.uniforms.resolution.value.y = window.innerHeight; 

    //filmPass = new THREE.ShaderPass(THREE.FilmShader);
    //rgbShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);
    //rgbShiftPass.uniforms["amount"].value = 0.001;

    renderPass.renderToScreen = true;
    //sobelPass.renderToScreen = true;
    //filmPass.renderToScreen = true;
    //rgbShiftPass.renderToScreen = true;

    composer.addPass(renderPass);
    //composer.addPass(sobelPass);
    //composer.addPass(filmPass);
    //composer.addPass(rgbShiftPass);
}

function render() {
    controls.update();
    //renderer.render(scene, camera)
    composer.render();
}



function onDocumentTouchStart( event ) {

    event.preventDefault();

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( cubes );

    if ( intersects.length > 0 ) {

        intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );

        var particle = new THREE.Sprite( spriteMaterial );
        particle.position.copy( intersects[ 0 ].point );
        particle.scale.x = particle.scale.y = 16;
        scene.add( particle );

    }

    /*
    // Parse all the faces
    for ( var i in intersects ) {

        intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );

    }
    */
}