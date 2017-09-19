var ww = window.innerWidth;
var wh = window.innerHeight;
var isMobile = ww < 500;

function Tunnel(cell, textures) {
  
  window.cell = cell.children[0];
  
  this.init();
  this.createMesh(textures);

  this.handleEvents();

  window.requestAnimationFrame(this.render.bind(this));
}

Tunnel.prototype.init = function() {

  this.speed = 1;
  this.prevTime = 0;

  this.mouse = {
    position: new THREE.Vector2(ww * 0.5, wh * 0.7),
    ratio: new THREE.Vector2(0, 0),
    target: new THREE.Vector2(ww * 0.5, wh * 0.7)
  };

  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector("#scene")
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
  this.scene.add( directionalLight );

  this.addParticle();
};

Tunnel.prototype.addParticle = function() {
  this.particles = [];
  this.particlesContainer = new THREE.Object3D();
  this.scene.add(this.particlesContainer);
  for (var i = 0; i < (isMobile ? 70 : 150); i++) {
    var particle = new Particle(this.scene);
    this.particles.push(particle);
    this.particlesContainer.add(particle.mesh);
  }
};

Tunnel.prototype.createMesh = function(textures) {
  var points = [];
  var i = 0;
  var geometry = new THREE.Geometry();

  this.scene.remove(this.tubeMesh)

  for (i = 0; i < 5; i += 1) {
    points.push(new THREE.Vector3(0, 0, 2.5 * (i / 4)));
  }
  points[4].y = -0.06;

  this.curve = new THREE.CatmullRomCurve3(points);
  this.curve.type = "catmullrom";

  geometry = new THREE.Geometry();
  geometry.vertices = this.curve.getPoints(70);
  this.splineMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial());

  this.tubeMaterial = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    map: textures.stone.texture,
    bumpMap: textures.stoneBump.texture,
    bumpScale: 0.0003
  });

  this.tubeMaterial.map.wrapS = THREE.RepeatWrapping;
  this.tubeMaterial.map.wrapT = THREE.RepeatWrapping;
  this.tubeMaterial.map.repeat.set(10, 6);
  this.tubeMaterial.bumpMap.wrapS = THREE.RepeatWrapping;
  this.tubeMaterial.bumpMap.wrapT = THREE.RepeatWrapping;
  this.tubeMaterial.bumpMap.repeat.set(30, 6);

  this.tubeGeometry = new THREE.TubeGeometry(this.curve, 70, 0.02, 30, false);
  this.tubeGeometry_o = this.tubeGeometry.clone();
  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);

  this.scene.add(this.tubeMesh);

};

Tunnel.prototype.handleEvents = function() {
  window.addEventListener('resize', this.onResize.bind(this), false);

  document.body.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  document.body.addEventListener('touchmove', this.onMouseMove.bind(this), false);

  document.body.addEventListener('touchstart', this.onMouseDown.bind(this), false);
  document.body.addEventListener('mousedown', this.onMouseDown.bind(this), false);

  document.body.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  document.body.addEventListener('mouseleave', this.onMouseUp.bind(this), false);
  document.body.addEventListener('touchend', this.onMouseUp.bind(this), false);
  window.addEventListener('mouseout', this.onMouseUp.bind(this), false);
};

Tunnel.prototype.onMouseDown = function() {
  this.mousedown = true;
  TweenMax.to(this.scene.fog.color, 0.6, {
    r: 1,
    g: 1,
    b: 1
  });
  TweenMax.to(this.tubeMaterial.color, 0.6, {
    r: 0,
    g: 0,
    b: 0
  });
  TweenMax.to(this, 1.5, {
    speed: 0.1,
    ease: Power2.easeInOut
  });
};
Tunnel.prototype.onMouseUp = function() {
  this.mousedown = false;
  TweenMax.to(this.scene.fog.color, 0.6, {
    r: 0,
    g: 0,
    b: 0
  });
  TweenMax.to(this.tubeMaterial.color, 0.6, {
    r: 0.47,
    g: 0.06,
    b: 0
  });
  TweenMax.to(this, 0.6, {
    speed: 1,
    ease: Power2.easeIn
  });
};

Tunnel.prototype.onResize = function() {
  ww = window.innerWidth;
  wh = window.innerHeight;

  isMobile = ww < 500;

  this.camera.aspect = ww / wh;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(ww, wh);
};

Tunnel.prototype.onMouseMove = function(e) {
  if (e.type === "mousemove") {
    this.mouse.target.x = e.clientX;
    this.mouse.target.y = e.clientY;
  } else {
    this.mouse.target.x = e.touches[0].clientX;
    this.mouse.target.y = e.touches[0].clientY;
  }
};

Tunnel.prototype.updateCameraPosition = function() {
  this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 30;
  this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 30;

  this.mouse.ratio.x = (this.mouse.position.x / ww);
  this.mouse.ratio.y = (this.mouse.position.y / wh);

  this.camera.rotation.z = ((this.mouse.ratio.x) * 1 - 0.05);
  this.camera.rotation.y = Math.PI - (this.mouse.ratio.x * 0.3 - 0.15);
  this.camera.position.x = ((this.mouse.ratio.x) * 0.044 - 0.025);
  this.camera.position.y = ((this.mouse.ratio.y) * 0.044 - 0.025);
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
  console.log(this.speed, this.speed / 100);
  this.tubeMaterial.map.offset.x += this.speed / 25;
};

Tunnel.prototype.updateJoystickValues = function() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  if (!gamepads.length) {
    return;
  }


  var gamepad = gamepads[0];

  this.speed = (-1 * gamepad.axes[6] + 1);
  if (gamepad.buttons[0].pressed) {
    this.mousedown = true;
  } else {
    this.mousedown = false;
  }

  // input = [-1, -0.5,   0,      0.5, 1]
  // output = [0, vw / 4, vw / 2, 3vw/4, 1vw];
  this.mouse.target.x = ((gamepads[0].axes[0] + 1) / 2) * ww;
  this.mouse.target.y = ((-1 * gamepads[0].axes[1] + 1) / 2) * wh;
}

Tunnel.prototype.render = function(time) {

  this.updateJoystickValues();

  this.updateMaterialOffset();

  this.updateCameraPosition();

  this.updateCurve();

  for (var i = 0; i < this.particles.length; i++) {
    this.particles[i].update(this);
    if (this.particles[i].burst && this.particles[i].percent > 1) {
      this.particlesContainer.remove(this.particles[i].mesh);
      this.particles.splice(i, 1);
      i--;
    }
  }

  // When mouse down, add a lot of shapes
  if (this.mousedown) {
    if (time - this.prevTime > 20) {
      this.prevTime = time;
      var particle = new Particle(this.scene, true)
      this.particles.push(particle);
      this.particlesContainer.add(particle.mesh);
      if (!isMobile) {
        particle = new Particle(this.scene, true)
        this.particles.push(particle);
        this.particlesContainer.add(particle.mesh);

        particle = new Particle(this.scene, true)
        this.particles.push(particle);
        this.particlesContainer.add(particle.mesh);
      }
    }
  }

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
  this.color = new THREE.Color("hsl(" + (Math.random() * range + offset) + ","+saturate+"%,"+light+"%)");
  if (burst) {
    var colorPalette = [0x9effb8, 0x89aee1, 0xd46ce7, 0xe9f259, 0x7cf4d3];
    this.color = new THREE.Color(colorPalette[Math.floor(Math.random()*colorPalette.length)]);
  }
  var mat = new THREE.MeshPhongMaterial({
    color: this.color,
    // shading: THREE.FlatShading
  });
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
};

Particle.prototype.update = function(tunnel) {

  this.percent += this.speed * (this.burst ? 1 : tunnel.speed);

  this.pos = tunnel.curve.getPoint(1 - (this.percent % 1)).add(this.offset);
  this.mesh.position.x = this.pos.x;
  this.mesh.position.y = this.pos.y;
  this.mesh.position.z = this.pos.z;
  this.mesh.rotation.x += this.rotate.x;
  this.mesh.rotation.y += this.rotate.y;
  this.mesh.rotation.z += this.rotate.z;
};

function init() {
  var textures = null;
  var objects = null;

  function checkDone() {
    if (textures && objects) {
      window.tunnel = new Tunnel(objects, textures);
    }
  }
  loadTextures(function(ts) { textures = ts; checkDone(); });
  loadObjects(function(os) { objects = os; checkDone(); });
}

function loadObjects(callback) {
  var loader = new THREE.OBJLoader();
  loader.load(
    'img/demo4/blood_cell.obj',
    callback
  );
}

function loadTextures(callback) {
  var textures = {
    "stone": {
      url: "img/demo1/stonePattern.jpg",
      loaded: false
    },
    "stoneBump": {
      url: "img/demo1/stonePatternBump.jpg",
      loaded: false
    }
  };

  var loader = new THREE.TextureLoader();
  loader.crossOrigin = "Anonymous";
  // Load all textures
  for (var name in textures) {
    (function(name) {
      loader.load(textures[name].url, function(texture) {
        textures[name].loaded = true;
        textures[name].texture = texture;
        if (Object.values(textures).every(function(t) { return t.loaded })) {
          callback(textures);
        }
      });
    })(name);
  }
}

window.onload = init;
