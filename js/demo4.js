/* global _:false, THREE:false, Power2:false, cell:false, TweenMax:false */

var ww = window.innerWidth;
var wh = window.innerHeight;
var isMobile = ww < 500;
var WACKY_COLORS = [0xFFFF00, 0x14CCBD, 0xFF4088, 0x364BBD];

function Scene(objects, textures) {

  window.cell = objects.cell.object.children[0];

  this.init(objects);
  this.tunnel = new Tunnel(
    this.scene,
    textures
  );

  this.handleEvents();

  window.requestAnimationFrame(this.render.bind(this));
}

Scene.prototype.init = function(objects) {
  this.clock = new THREE.Clock();
  this.mouse = {
    position: new THREE.Vector2(ww * 0.5, wh * 0.7),
    ratio: new THREE.Vector2(0, 0),
    target: new THREE.Vector2(ww * 0.5, wh * 0.7)
  };

  this.laserTarget = {
    x: 0.085,
    y: 0.029
  };

  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector('#scene')
  });
  this.renderer.setSize(ww, wh);

  this.camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 100);
  this.camera.rotation.y = Math.PI;
  this.camera.position.z = 0.35;

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.Fog(0x000000, 0.05, 1.6);

  var light = new THREE.HemisphereLight(0xe9eff2, 0x01010f, 1);
  this.scene.add(light);

  // Add a directional light for the bump
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
  this.scene.add(directionalLight);

  this.laserContainer = [];
  this.addParticle();
  this.addBoss(objects.virus.object);
};

Scene.prototype.handleEvents = function() {
  window.addEventListener('resize', this.onResize.bind(this), false);

  document.body.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  document.body.addEventListener('touchmove', this.onMouseMove.bind(this), false);

  document.body.addEventListener('mousedown', this.setMouseDown.bind(this, true), false);
  document.body.addEventListener('mouseup', this.setMouseDown.bind(this, false), false);
};

Scene.prototype.addBoss = function(object) {
  this.boss = new Boss(object);
  this.offset = new THREE.Vector3((Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.025, 0);
  this.boss.percent = 0.1;
  this.scene.add(this.boss.mesh);
};

Scene.prototype.addParticle = function() {
  this.particles = [];
  this.particlesContainer = new THREE.Object3D();
  this.scene.add(this.particlesContainer);
  for (var i = 0; i < (isMobile ? 70 : 150); i++) {
    var particle = new Particle(this.scene);
    this.particles.push(particle);
    this.particlesContainer.add(particle.mesh);
  }
};

Scene.prototype.addLaser = _.throttle(function () {
  var laser = new Laser(this.scene, this.camera);
  this.laserContainer.push(laser);
  this.scene.add(laser.laser);
}, 200, {trailing: false});

Scene.prototype.removeDeadLasers = function() {
  var idx = this.laserContainer.length;
  while(idx--) {
    var laser = this.laserContainer[idx];
    if (laser.active === false) {
      this.scene.remove(laser.laser);
      this.laserContainer.splice(idx, 1);
    }
  }
};

function Tunnel(scene, textures) {
  this.scene = scene;
  this.textures = textures;
  this.speed = 0.5;
  this.currentColor = 0;
  this.currentTexture = 0;
  this.createMesh(textures[0]);
}

Tunnel.prototype.createMesh = function(texture) {
  var points = [];
  var i = 0;
  var geometry = new THREE.Geometry();

  for (i = 0; i < 5; i += 1) {
    points.push(new THREE.Vector3(0, 0, 2.5 * (i / 4)));
  }
  points[4].y = -0.06;

  this.curve = new THREE.CatmullRomCurve3(points);
  this.curve.type = 'catmullrom';

  geometry = new THREE.Geometry();
  geometry.vertices = this.curve.getPoints(70);
  this.splineMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial());

  this.setMaterial(texture);

  this.tubeGeometry = new THREE.TubeGeometry(this.curve, 70, 0.02, 30, false);
  this.tubeGeometry_o = this.tubeGeometry.clone();
  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);

  this.scene.add(this.tubeMesh);
};

Tunnel.prototype.setMaterial = function(texture) {
  this.tubeMaterial = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    map: texture.texture,
    emissiveIntensity: 0.5,
    bumpMap: texture.bump,
    bumpScale: 0.0005
  });

  this.tubeMaterial.map.wrapS = THREE.RepeatWrapping;
  this.tubeMaterial.map.wrapT = THREE.RepeatWrapping;
  this.tubeMaterial.map.repeat.set(10, 6);
  this.tubeMaterial.bumpMap.wrapS = THREE.RepeatWrapping;
  this.tubeMaterial.bumpMap.wrapT = THREE.RepeatWrapping;
  this.tubeMaterial.bumpMap.repeat.set(30, 6);
};

Tunnel.prototype.advanceMaterial = _.throttle(function (shouldSwitch) {
  if (shouldSwitch) {
    var nextTexture = this.textures[this.currentTexture++ % this.textures.length];
    this.setMaterial(nextTexture);
    this.tubeMesh.material = this.tubeMaterial;
  }
}, 500);

Scene.prototype.setMouseDown = function(setTo) {
  this.mouseDown = setTo;
};

Scene.prototype.onResize = function() {
  ww = window.innerWidth;
  wh = window.innerHeight;

  isMobile = ww < 500;

  this.camera.aspect = ww / wh;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(ww, wh);
};

Scene.prototype.onMouseMove = function(e) {
  if (e.type === 'mousemove') {
    this.mouse.target.x = e.clientX;
    this.mouse.target.y = e.clientY;
  } else {
    this.mouse.target.x = e.touches[0].clientX;
    this.mouse.target.y = e.touches[0].clientY;
  }

  this.laserTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
  this.laserTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;

  this.tunnel.mouse.target = this.mouse.target;
};

Scene.prototype.updateCameraPosition = function() {
  this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 30;
  this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 30;

  this.mouse.ratio.x = (this.mouse.position.x / ww);
  this.mouse.ratio.y = (this.mouse.position.y / wh);

  this.camera.rotation.z = ((this.mouse.ratio.x) * 1 - 0.05);
  this.camera.rotation.y = Math.PI - (this.mouse.ratio.x * 0.3 - 0.15);
  this.camera.position.x = ((this.mouse.ratio.x) * 0.044 - 0.025);
  this.camera.position.y = ((this.mouse.ratio.y) * 0.044 - 0.025);

  this.tunnel.mouse = this.mouse;
};

Tunnel.prototype.updateCurve = function() {
  var i = 0;
  var index = 0;
  var vertice_o = null;
  var vertice = null;
  for (i = 0; i < this.tubeGeometry.vertices.length; i += 1) {
    vertice_o = this.tubeGeometry_o.vertices[i];
    vertice = this.tubeGeometry.vertices[i];
    index = Math.floor(i / 30);
    vertice.x += ((vertice_o.x + this.splineMesh.geometry.vertices[index].x) - vertice.x) / 15;
    vertice.y += ((vertice_o.y + this.splineMesh.geometry.vertices[index].y) - vertice.y) / 15;
  }
  this.tubeGeometry.verticesNeedUpdate = true;

  this.curve.points[2].x = 0.6 * (1 - this.mouse.ratio.x) - 0.3;
  this.curve.points[3].x = 0;
  this.curve.points[4].x = 0.6 * (1 - this.mouse.ratio.x) - 0.3;

  this.curve.points[2].y = 0.6 * (1 - this.mouse.ratio.y) - 0.3;
  this.curve.points[3].y = 0;
  this.curve.points[4].y = 0.6 * (1 - this.mouse.ratio.y) - 0.3;

  this.splineMesh.geometry.verticesNeedUpdate = true;
  this.splineMesh.geometry.vertices = this.curve.getPoints(70);
};

Tunnel.prototype.updateMaterialOffset = function() {
  // Update the offset of the material
  this.tubeMaterial.map.offset.x += this.speed / 25;
};

Scene.prototype.updateJoystickValues = function() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  if (!gamepads[0]) {
    return;
  }

  var gamepad = gamepads[0];

  this.tunnel.setSpeed(-1 * gamepad.axes[6] + 1);
  if (gamepad.buttons[0].pressed) {
    this.addLaser();
  }
  if (gamepad.buttons[11].pressed) {
    this.tunnel.updateColor();
  }
  this.debugReload(gamepad.buttons[7].pressed);
  this.tunnel.advanceMaterial(gamepad.buttons[10].pressed);

  // input = [-1, -0.5,   0,      0.5, 1]
  // output = [0, vw / 4, vw / 2, 3vw/4, 1vw];
  this.mouse.target.x = ((gamepads[0].axes[0] + 1) / 2) * ww;
  this.mouse.target.y = ((-1 * gamepads[0].axes[1] + 1) / 2) * wh;

  this.tunnel.mouse = this.mouse;
};

Scene.prototype.debugReload = (function() {
  var hasBeenFalse = false;
  return function(shouldReload) {
    hasBeenFalse = hasBeenFalse || shouldReload === false;
    if (shouldReload && hasBeenFalse) {
      document.location.reload();
    }
  };
})();

Tunnel.prototype.updateColor = _.throttle(function () {
  var availableColors = WACKY_COLORS.map(function (hex) {
    return new THREE.Color(hex);
  });
  var nextColor = availableColors[++this.currentColor % availableColors.length];
  TweenMax.to(this.tubeMaterial.emissive, 1, {
    r: nextColor.r,
    g: nextColor.g,
    b: nextColor.b,
    ease: Power2.easeInOut
  });
}, 1000, {trailing: false});

Tunnel.prototype.setSpeed = function(speed) { this.speed = speed; };

Tunnel.prototype.update = function() {
  this.updateMaterialOffset();
  this.updateCurve();
};

Scene.prototype.updateParticles = function() {
  for (var i = 0; i < this.particles.length; i++) {
    this.particles[i].update(this.tunnel.speed, this.tunnel.curve);
    if (this.particles[i].burst && this.particles[i].percent > 1) {
      this.particlesContainer.remove(this.particles[i].mesh);
      this.particles.splice(i, 1);
      i--;
    }
  }
};

Scene.prototype.addBurstParticle = _.throttle(function () {
  var particle = new Particle(this.scene, true);
  this.particles.push(particle);
  this.particlesContainer.add(particle.mesh);
}, 20);

Scene.prototype.render = function() {
	var dt = this.clock.getDelta();

  this.updateJoystickValues();
  this.updateCameraPosition();

  this.tunnel.update();
  this.updateParticles();
  this.laserContainer.map(function(l) { l.update(dt); });
  this.removeDeadLasers();
  this.boss.update(this.tunnel);

  this.renderer.render(this.scene, this.camera);
  window.requestAnimationFrame(this.render.bind(this));
};

function Particle(scene, burst) {
  var radius = Math.random() * 0.003 + 0.0003;
  var geom = cell.geometry;
  var range = 10;
  var offset = burst ? 200 : 350;
  var saturate = Math.floor(Math.random()*20 + 65);
  var light = burst ? 20 : 56;
  this.color = new THREE.Color('hsl(' + (Math.random() * range + offset) + ','+saturate+'%,'+light+'%)');
  if (burst) {
    this.color = new THREE.Color(WACKY_COLORS[Math.floor(Math.random()*WACKY_COLORS.length)]);
  }
  var mat = new THREE.MeshPhongMaterial({
    color: this.color,
  });

  // Blood cells are slightly different sizes and we also
  // make them slightly bumpy
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.scale.set(radius, radius, radius);
  this.mesh.scale.x += (Math.random()-0.5)*0.001;
  this.mesh.scale.y += (Math.random()-0.5)*0.001;
  this.mesh.scale.z += (Math.random()-0.5)*0.001;
  this.mesh.position.set(0, 0, 1.5);

  this.percent = burst ? 0.2 : Math.random();
  this.burst = burst ? true : false;
  this.offset = new THREE.Vector3((Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.025, 0);
  this.speed = Math.random() * 0.004 + 0.0002;
  if (this.burst) {
    this.speed += 0.003;
    this.mesh.scale.x *= 1.4;
    this.mesh.scale.y *= 1.4;
    this.mesh.scale.z *= 1.4;
  }
  this.rotate = new THREE.Vector3(-Math.random() * 0.1 + 0.01, 0, Math.random() * 0.01);

  this.pos = new THREE.Vector3(0, 0, 0);
}

Particle.prototype.update = function(tunnelSpeed, tunnelCurve) {

  this.percent += this.speed * (this.burst ? 1 : tunnelSpeed);

  this.pos = tunnelCurve.getPoint(1 - (this.percent % 1)).add(this.offset);
  this.mesh.position.x = this.pos.x;
  this.mesh.position.y = this.pos.y;
  this.mesh.position.z = this.pos.z;
  this.mesh.rotation.x += this.rotate.x;
  this.mesh.rotation.y += this.rotate.y;
  this.mesh.rotation.z += this.rotate.z;
};

function Laser(scene, camera) {
  var laserRadius = 0.001;
  var beamLength = laserRadius * 50;

  var laserGeom = new THREE.CylinderGeometry(laserRadius, laserRadius, beamLength, 20);
  laserGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, beamLength / 2, 0));
  laserGeom.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  var laserMat = new THREE.MeshPhongMaterial({
    ambient : 0,
    emissive : WACKY_COLORS[0],
    emissiveIntensity: 0.5,
    color : WACKY_COLORS[0]
  });

  this.active = true;

  this.laser = new THREE.Mesh(laserGeom, laserMat);
  this.laser.position.copy(camera.position);
  this.laser.position.z += 0.02;
}

Laser.prototype.update = function (t) {
  if (this.active) {
    this.laser.position.z += 0.01;
    if (this.laser.position.z > 1) {
      this.active = false;
    }
  }
};

function Boss(object) {
  var radius = Math.random() * 0.003 + 0.0003;
  var geom = object.children[0].geometry;
  var mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(WACKY_COLORS[Math.floor(Math.random()*WACKY_COLORS.length)])
    // shading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geom, mat);
  var scale = radius / 14;
  this.mesh.scale.set(scale, scale, scale);
  this.mesh.position.set(0, 0, 0.55);

  this.offset = new THREE.Vector3(0, 0, 0);
  this.speed = Math.random() * 0.004 + 0.0002;
  this.rotate = new THREE.Vector3(-Math.random() * 0.1 + 0.01, 0, Math.random() * 0.01);

  this.pos = new THREE.Vector3(0, 0, 0);
  return this;
}

// Boss.prototype = Particle.prototype;
Boss.prototype.update = function(tunnel) {
  this.percent += this.speed * (this.burst ? 1 : tunnel.speed);

  this.pos = tunnel.curve.getPoint(1 - (tunnel.speed % 1)).add(this.offset);
  this.mesh.position.x = this.pos.x;
  this.mesh.position.y = this.pos.y;
  this.mesh.position.z = this.pos.z;
};


function init() {
  var textures = null;
  var objects = null;

  function checkDone() {
    if (textures && objects) {
      window.tunnel = new Scene(objects, textures);
    }
  }
  loadTextures(function(ts) { textures = ts; checkDone(); });
  loadObjects(function(os) { objects = os; checkDone(); });
}

function loadObjects(callback) {
  var objects = {
    virus: {
      url: 'img/demo4/3d/virus.obj',
      loaded: false
    },
    cell: {
      url: 'img/demo4/3d/blood_cell.obj',
      loaded: false
    }
  };

  var loader = new THREE.OBJLoader();
  for (var name in objects) {
    (function(name) {
      loader.load(objects[name].url, function(object) {
        objects[name].loaded = true;
        objects[name].object = object;
        if (Object.values(objects).every(function(t) { return t.loaded; })) {
          callback(objects);
        }
      });
    })(name);
  }
}

function loadTextures(callback) {
  var textures = [{
    name: 'microdots',
    texture: 'img/demo1/microdotsPattern.jpg',
    bump: 'img/demo1/microdotsPatternBump.jpg'
  }, {
    name: 'intestinesReal',
    texture: 'img/demo4/intestinesRealPattern.jpg',
    bump: 'img/demo4/intestinesRealBump.jpg'
  }, {
    name: 'intestinesYellow',
    texture: 'img/demo4/intestinesYellowPattern.jpg',
    bump: 'img/demo4/intestinesYellowBump.jpg'
  }, {
    name: 'fatcells1',
    texture: 'img/demo4/fatcells1Pattern.jpg',
    bump: 'img/demo4/fatcells1Bump.jpg'
  }];

  var manager = new THREE.LoadingManager();
  textures.forEach(function (texture, idx) {
    var tLoader = new THREE.TextureLoader(manager);
    tLoader.load(texture.texture, function(t) {
      textures[idx].texture = t;
    });

    var bLoader = new THREE.TextureLoader(manager);
    bLoader.load(texture.bump, function(t) {
      textures[idx].bump = t;
    });
  });

  function returnTextures() { callback(textures); }
  manager.onLoad = returnTextures;
}

window.onload = init;
