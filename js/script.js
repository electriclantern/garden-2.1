var camera, controls, scene, renderer, master, container = document.getElementById('container'), plane, raycaster, mouse;
var recipes = {
  cube: {
    geometry: new THREE.CubeGeometry(10, 10, 10),
    material: new THREE.MeshLambertMaterial( {color: 0xeeeeee})
  }
};
var selectables = [];
var INTERSECTED, obj_selected;
container.onmousemove = move;
container.onclick = click;

init();
animate();

function init() {
  var container_width = container.offsetWidth;
  var container_height = container.offsetHeight;

  scene = new THREE.Scene();
  master = new THREE.Group();
  scene.add(master);

  renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
  //TODO: renderer.setPixelRatio(window.devicePixelRatio/3);
  renderer.setSize(container_width, container_height);
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  camera = new THREE.PerspectiveCamera(45, container_width / container_height, 1, 1000);
  camera.position.z = 500;

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

  // drawing
  var plane_geometry = new THREE.CubeGeometry(90, 10, 90);
  var plane_material = new THREE.MeshLambertMaterial( {color: 0xa6ef6e} );
  plane = new THREE.Mesh(plane_geometry, plane_material);
  scene.add(plane);

  for (var i=0; i<9; i++) {
    create('cube', 0, 10, (10*i) + -40);
  }

  //isometric
  controls.startingRotation(45 * Math.PI / 180, 25 * Math.PI / 180);
}

function animate() {
	requestAnimationFrame(animate);
  controls.update();

  if (obj_selected) {
    obj_selected.material.emissive.setHex( 0xf4425f );
  }
  else {
    for (var i=0; i<master.children.length; i++) {
      master.children[i].material.emissive.setHex( null )
    }
  }

  render();
}
function render() {
  raycaster.setFromCamera( mouse, camera );

  intersects = raycaster.intersectObjects(master.children);

  //https://threejs.org/examples/webgl_interactive_cubes.html
  if (intersects.length > 0) {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

		INTERSECTED = intersects[ 0 ].object;
		INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
		INTERSECTED.material.emissive.setHex( 0xf4425f );
  } else {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    INTERSECTED = null;
  }

  renderer.render( scene, camera );
}

//TODO: arrow key pan

function move(e) {
  event.preventDefault();

  //https://stackoverflow.com/a/44059588/9375514
  var rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
  mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;
}

function click() {
  if (obj_selected) {
    obj_selected = null;
  }
  else {
    if (INTERSECTED != null) {
      obj_selected = INTERSECTED;

      //create phantom that moves across grid

    }
  }
}

function create(object, x, y, z) {
  var geometry = recipes[object].geometry;
  var creation = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ));
  creation.position.set(x, y, z);
  master.add(creation);
}
