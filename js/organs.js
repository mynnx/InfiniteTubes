/* global THREE:false, Stats:false */

var container, stats;
var camera, scene, renderer;
var group;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

loadObjects(init);

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function init(objects) {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 500;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 1, 10000);

  var material = new THREE.MeshNormalMaterial();

  group = new THREE.Group();

  for (var i = 0; i < 1000; i ++) {
    var whichObject = pickRandom(objects);
    var mesh = new THREE.Mesh(whichObject.geometry, material);
    mesh.position.x = Math.random() * 2000 - 1000;
    mesh.position.y = Math.random() * 2000 - 1000;
    mesh.position.z = Math.random() * 2000 - 1000;

    mesh.rotation.x = Math.random() * 2 * Math.PI;
    mesh.rotation.y = Math.random() * 2 * Math.PI;
    mesh.scale.set(whichObject.scale, whichObject.scale, whichObject.scale);

    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();

    group.add(mesh);
  }

  scene.add(group);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  animate();
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) * 10;
  mouseY = (event.clientY - windowHalfY) * 10;
}

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function getGamepadValues() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  if (!gamepads[0]) {
    return null;
  }

  var gamepad = gamepads[0];
  return {
    axes: {
      x: gamepad.axes[0],
      y: gamepad.axes[1],
      z: gamepad.axes[5]
    }
  };
}

function render() {
  var gamepad = getGamepadValues();
  if (gamepad) {
    camera.position.x += ((gamepad.axes.x * window.innerWidth * 5) - camera.position.x) * .005;
    camera.position.y += ((gamepad.axes.y * window.innerHeight * 5) - camera.position.y) * .005;
  } else {
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;
  }
  // console.log(camera.position.x, camera.position.y)

  camera.lookAt(scene.position);

  var time = Date.now() * 0.001;
  var rx = Math.sin(time * 0.7) * 0.5,
    ry = Math.sin(time * 0.3) * 0.5,
    rz = Math.sin(time * 0.2) * 0.5;

  group.rotation.x = rx;
  group.rotation.y = ry;
  group.rotation.z = rz;

  renderer.render(scene, camera);
}

function loadObjects(callback) {
  var objects = [
    {
      name: 'heart',
      url: '3d/heartSimple2.obj',
      scale: 6
    }, {
      name: 'hand',
      url: '3d/handSimple.OBJ',
      scale: 12
    }, {
      name: 'penis',
      url: '3d/penisSimple.OBJ',
      scale: 10
    }, {
      name: 'tooth',
      url: '3d/tooth.obj',
      scale: 15
    }, {
      name: 'vertebrae',
      url: '3d/vertebraeSimple.obj',
      scale: 9
    }, {
      name: 'foot',
      url: '3d/footSimple.obj',
      scale: 8
    }, {
      name: 'brain',
      url: '3d/brainSimple5.obj',
      scale: 2
    }, {
      name: 'cell',
      url: 'img/demo4/3d/blood_cell.obj',
      scale: 30
    },
  ];

  var manager = new THREE.LoadingManager();
  objects.forEach(function (obj, idx) {
    var loader = new THREE.OBJLoader(manager);
    loader.load(obj.url, function(object) {
      objects[idx].object = object;
      objects[idx].geometry = object.children[0].geometry;
    });
  });

  function returnObjects() { callback(objects); }
  manager.onLoad = returnObjects;
}
