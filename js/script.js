var camera, controls, scene, renderer, container = document.getElementById('container'), raycaster, mouse;
var object_recipes = {
  plot: {
    geometry: new THREE.BoxGeometry(10, 10, 10),
    color: 0xffffff,
    topcolor: 0xffb200
  },
  seed: {
    geometry: new THREE.SphereGeometry(5, 4, 2),
    color: 0x7af442,
  },
  potion: {
    geometry: new THREE.ConeGeometry(5, 10, 3),
    color: 0xffffff,
    opacity: 0.5,
  }
};
var static, master, INTERSECTED, obj_selected, interactable;
var tooltip = document.getElementById('tooltip');
container.onmousemove = move;
container.onclick = click;

init();
animate();

function init() {
  var container_width = container.offsetWidth;
  var container_height = container.offsetHeight;

  scene = new THREE.Scene();
  static = [];
  interactable = [];
  master = [];

  renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
  //TODO: renderer.setPixelRatio(window.devicePixelRatio/1.5);
  renderer.setSize(container_width, container_height);
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  camera = new THREE.PerspectiveCamera(45, container_width / container_height, 1, 1000);
  camera.position.z = 250;

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = false;
  controls.minDistance = 100;
  controls.maxDistance = 700;
  controls.maxPolarAngle = Math.PI / 2;

  var light = {
    top: new THREE.DirectionalLight(0xdee7f4, 1.0),
    front: new THREE.DirectionalLight(0xdee7f4, 0.8),
    back: new THREE.DirectionalLight(0xdee7f4, 0.4),
    left: new THREE.DirectionalLight(0xdee7f4, 0.6),
    right: new THREE.DirectionalLight(0xdee7f4, 0.6),
  }
  scene.add(light.top);
  light.front.position.set(0, 0, 1);
  scene.add(light.front);
  light.back.position.set(0, 0, -1);
  scene.add(light.back);
  light.left.position.set(-1, 0, 0);
  scene.add(light.left);
  light.right.position.set(1, 0, 0);
  scene.add(light.right);

  //isometric
  controls.startingRotation(45 * Math.PI / 180, 25 * Math.PI / 180);

  //ground
  var plane_geometry = new THREE.CubeGeometry(10, 10, 10);
  for (var i=0, x=0, z=0; i<81; i++) {
    plane = new THREE.Mesh(plane_geometry, new THREE.MeshLambertMaterial( {color: 0x94e557} ));
    plane.position.set(40 - 10*x, 0, 10*z - 40);
    if (plane.position.z > 40) {
      x++;
      z = 0;
      plane.position.set(40 - 10*x, 0, 10*z - 40);
    }
    scene.add(plane);
    static.push(plane);
    master.push(plane);
    z++;
  }

  var brewer_geometry = new THREE.CylinderGeometry(5, 5, 10, 6);
  var brewer = new THREE.Mesh(brewer_geometry, new THREE.MeshLambertMaterial( {color: 0xe85c5c} ));
  brewer.position.set(10, 10, 10);
  brewer.name = 'brewer';
  scene.add(brewer);
  interactable.push(brewer);
  master.push(brewer);

  //drawing
  for (var i=0; i<3; i++) {
    create('plot', 0, 10, (10*i) + -40);
  }
  create('seed', 0, 10, 0)
}
function animate() {
	requestAnimationFrame(animate);
  controls.update();

  if (obj_selected) {
    obj_selected.material.emissive.setHex( 0xf4425f );
  }
  else {
    for (var i=0; i<master.length; i++) {
      if ( master[i].isMesh ) {
        master[i].material.emissive.setHex(null)
      }
    }
  }

  render();
}
function render() {
  raycaster.setFromCamera(mouse, camera);

  intersects = [];
  if (obj_selected) {
    intersects = intersects.concat(raycaster.intersectObjects(master))
  }
  else {
    intersects = intersects.concat(raycaster.intersectObjects(interactable))
  }

  //https://threejs.org/examples/webgl_interactive_cubes.html
  if (Object.keys(intersects).length > 0) {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

		INTERSECTED = intersects[Object.keys(intersects)[0]].object;
		INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
		INTERSECTED.material.emissive.setHex( 0xf4425f );

    tooltip.textContent = INTERSECTED.name;
  } else {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    INTERSECTED = null;

    tooltip.textContent = '';
  }

  renderer.render(scene, camera);
}

function move(e) {
  event.preventDefault();

  //https://stackoverflow.com/a/44059588/9375514
  var rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ( (event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = - ( (event.clientY - rect.top) / rect.height) * 2 + 1;
}
function click() {
  if (!obj_selected) {
    if (INTERSECTED != null) {
      obj_selected = INTERSECTED
    }
  } else {
    var place = INTERSECTED;
    var occupying_obj;
    var occupied;

    //getting object occupying space above place
    for (var i=0; i<Object.keys(interactable).length; i++) {
      if (
        (place.position.y+10 == interactable[Object.keys(interactable)[i]].position.y) &&
        (place.position.x == interactable[Object.keys(interactable)[i]].position.x) &&
        (place.position.z == interactable[Object.keys(interactable)[i]].position.z)
      ) {
        occupied = true;
        occupying_obj = interactable[Object.keys(interactable)[i]];
        break
      }
      else { occupied = false }
    }

    // if () {} if obj_selected has a relationship with place

    //placement
    if (!occupied && place != obj_selected && obj_selected != occupying_obj) {
      obj_selected.position.set(place.position.x, place.position.y+10, place.position.z)
    }
    obj_selected = null;
  }
}

function create(object, x, y, z) {
  var geometry = object_recipes[object].geometry;
  var creation = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: object_recipes[object].color, vertexColors: THREE.FaceColors, wireframe: false} ));
  if ('topcolor' in object_recipes[object]) {
    creation.geometry.faces[5].color.setHex( object_recipes[object].topcolor );
    creation.geometry.faces[4].color.setHex( object_recipes[object].topcolor );
  }
  if (object == 'potion') {
    creation.material.transparent = true;
    creation.material.opacity = object_recipes[object].opacity;
    creation.rotation.x = 90 * Math.PI / 2;
  }
  creation.position.set(x, y, z);
  creation.name = object;
  scene.add(creation);
  interactable.push(creation);
  master.push(creation);
}
