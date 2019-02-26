var camera, controls, scene, renderer, container = document.getElementById('container'), raycaster, mouse;
var object_recipes = {
  plot: {
    geometry: new THREE.BoxGeometry(10, 10, 10),
    color: 0xffffff,
    topcolor: 0xffb200
  },
  seed: {
    geometry: new THREE.SphereGeometry(5, 4, 2),
    color: 0x7af442
  },
  bottle: {
    geometry: new THREE.ConeGeometry(5, 10, 3),
    color: 0xffffff,
    opacity: 0.5
  },
  sprout: {
    geometry: new THREE.BoxGeometry(10, 1, 10),
    color: 0x7af442
  }
};
var plantable = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
var element_properties = {
  sprout:1,
  seedling:1,
  blooming:2,
  ripe:3,
  wilting:1,
  decaying:0,

  mercury: { //the base
    state: 0, //static
    repulsion: 1
  },
  venus: {
    state: 1,
    repulsion: 0
  },
  earth: { //living creature matter
    state: 1, //because humans are basically made of 30 earth
    repulsion: -1
  },
  mars: {
    state: 0,
    repulsion: -1
  },
  jupiter: {
    state: -1,
    repulsion: 1
  },
  saturn: {
    state: -1, //turns back time
    repulsion: 0
  },
  uranus: {
    state: 0,
    repulsion: 0
  },
  neptune: {
    state: 1, //underwater creatures
    repulsion: -1
  }
};
var removable = ['sprout', 'seedling', 'blooming', 'ripe', 'wilting', 'decaying'];
var growing_plants = [];
var static, master, INTERSECTED, obj_selected, interactable, prev_place;
var tooltip = document.getElementById('tooltip');
var spawner;
container.onmousemove = move;
container.onclick = click;

function begin_game() {
  document.getElementById('container').style.display = 'block'; document.getElementById('intro').style.display = 'none';

  init();
  animate();
}

function init() {
  var container_width = container.offsetWidth;
  var container_height = container.offsetHeight;

  scene = new THREE.Scene();
  static = [];
  interactable = [];
  master = [];

  renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
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
    top: new THREE.DirectionalLight(0xfff9bf, 0.8),
    front: new THREE.DirectionalLight(0xfff9bf, 0.6),
    back: new THREE.DirectionalLight(0xfff9bf, 0.2),
    left: new THREE.DirectionalLight(0xfff9bf, 0.4),
    right: new THREE.DirectionalLight(0xfff9bf, 0.4),
    bottom: new THREE.DirectionalLight(0xfff9bf, 0.2),
    ambient: new THREE.AmbientLight(0xfff9bf, 0.2),
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
  scene.add(light.ambient);
  light.bottom.position.set(0, -1, 0);
  scene.add(light.bottom);

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
  brewer.position.set(40, 10, -10);
  brewer.name = 'brewer';
  scene.add(brewer);
  interactable.push(brewer);
  master.push(brewer);

  var bottle_geometry = object_recipes.bottle.geometry;
  var bottle_button = new THREE.Mesh(bottle_geometry, new THREE.MeshLambertMaterial( {color: 0xffffff }));
  bottle_button.position.set(40, -10, 40);
  bottle_button.name = 'bottle spawner';
  bottle_button.rotation.x = 90 * Math.PI / 2;
  scene.add(bottle_button);
  interactable.push(bottle_button);
  master.push(bottle_button);

  var spawner_geometry = new THREE.CubeGeometry(10, 3, 10);
  spawner = new THREE.Mesh(spawner_geometry, new THREE.MeshLambertMaterial( {color: 0xffffff}));
  spawner.position.set(40, 10, 40);
  spawner.name = 'spawner/disposal';
  scene.add(spawner);
  interactable.push(spawner);
  master.push(spawner);

  //drawing
  for (var i=0; i<3; i++) {
    create('plot', 0, 10, (10*i) + -40);
  }
  create('mercury_seed');
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
    intersects = intersects.concat(raycaster.intersectObjects(master));
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
    container.style.cursor = 'pointer'
  } else {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    INTERSECTED = null;

    tooltip.textContent = '';
    container.style.cursor = 'initial'
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
      obj_selected = INTERSECTED;

      if (obj_selected.name.split(' ')[1] == 'spawner') {
        create(obj_selected.name.split(' ')[0]);

        obj_selected = null;
      }

      //harvesting
      if (growing_plants.includes(obj_selected.name.split(' ')[1])) {
        growing_plants = arrayRemove(growing_plants, obj_selected)
      }

      //getting prev place
      for (var i=0; i<Object.keys(master).length; i++) {
        if (
          getCenterPoint(obj_selected).x == getCenterPoint(master[Object.keys(master)[i]]).x &&
          getCenterPoint(obj_selected).z == getCenterPoint(master[Object.keys(master)[i]]).z &&
          getCenterPoint(obj_selected).y == getCenterPoint(master[Object.keys(master)[i]]).y+10
        ) {
          prev_place = master[Object.keys(master)[i]];
          break
        }
      }

    }
  } else {
    var place = INTERSECTED;
    var occupying_obj = null;
    var occupied = false, mesh_above_obj = null, plant_above_obj = null;

    //getting object occupying space above place
    for (var i=0; i<Object.keys(master).length; i++) {
      if (
        getCenterPoint(place).x == getCenterPoint(master[Object.keys(master)[i]]).x &&
        getCenterPoint(place).z == getCenterPoint(master[Object.keys(master)[i]]).z &&
        getCenterPoint(place).y+10 == getCenterPoint(master[Object.keys(master)[i]]).y
      ) {
        occupied = true;
        occupying_obj = master[Object.keys(master)[i]];
        break
      }
    }

    //relationships
    if (place.name == 'spawner/disposal') {
      if (removable.includes(obj_selected.name.split(' ')[1])) {
        removeObject(obj_selected);
      }
    }
    if (place.name == 'plot') { //no replanting
      if (removable.includes(obj_selected.name.split(' ')[1]) || (occupying_obj && removable.includes(occupying_obj.name.split(' ')[1]))) {
        occupied = true;
      }
      //planting
      if (plantable.includes(obj_selected.name.split(' ')[0]) && obj_selected.name.split(' ')[1] == 'seed' && !occupied) {
        create(obj_selected.name.split(' ')[0]+'_sprout', place.position.x, place.position.y+10, place.position.z);
        removeObject(obj_selected);
      }
    }

    //harvesting
    if (removable.includes(obj_selected.name.split(' ')[1])) {
      growing_plants = arrayRemove(growing_plants, obj_selected);
    }
    //seeds
    if (obj_selected.name.split(' ')[2] == '+' && prev_place != place && place != obj_selected && place.name != 'plot') {
      obj_selected.name = arrayRemove(arrayRemove(obj_selected.name.split(' '), '+'), 'seed').toString().replace(',', ' ');
      create(obj_selected.name.split(' ')[0]+'_seed')
    }

    if (obj_selected.name == 'plot') {
      //get mesh above plot
      //if mesh is plant, then move with it
      for (var i=0; i<growing_plants.length; i++) {
        if (
          getCenterPoint(growing_plants[i]).x == getCenterPoint(obj_selected).x &&
          getCenterPoint(growing_plants[i]).z == getCenterPoint(obj_selected).z &&
          getCenterPoint(growing_plants[i]).y == getCenterPoint(obj_selected).y+10
        ) {
          mesh_above_obj = growing_plants[i]
        }
      }
    }

    //placement
    if (!occupied && place != obj_selected && obj_selected != occupying_obj) {
      placeOn(obj_selected, place);

      if (mesh_above_obj) {
        placeOn(mesh_above_obj, obj_selected);
      }
    }
    obj_selected = null;
  }
}

function create(object, x, y, z) {
  var x = x || spawner.position.x;
  var y = y || spawner.position.y+10;
  var z = z || spawner.position.z;
  var obj;

  if (object.includes('_')) {
    obj = object.split('_')[1];
  } else { obj = object }

  var geometry = object_recipes[obj].geometry;
  if (obj == 'sprout') {var geometry = new THREE.BoxGeometry(10, 1, 10)}
  var creation = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: object_recipes[obj].color, vertexColors: THREE.FaceColors, wireframe: false} ));
  if ('topcolor' in object_recipes[obj]) {
    creation.geometry.faces[5].color.setHex( object_recipes[obj].topcolor );
    creation.geometry.faces[4].color.setHex( object_recipes[obj].topcolor );
  }
  if (obj == 'bottle') {
    creation.material.transparent = true;
    creation.material.opacity = object_recipes[obj].opacity;
    creation.rotation.x = 90 * Math.PI / 2;
  }

  creation.position.set(x, y, z);
  creation.name = object.replace('_', ' ');
  scene.add(creation);
  interactable.push(creation);
  master.push(creation);

  //plant
  if (obj == 'sprout') {
    growing_plants.push(creation);
  }
}
function arrayRemove(arr, value) {

   return arr.filter(function(ele){
       return ele != value;
   });

}
function removeObject(obj) {
  scene.remove(obj);

  if (static.includes(obj)) { static = arrayRemove(static, obj) }
  if (interactable.includes(obj)) { interactable = arrayRemove(interactable, obj) }
  if (growing_plants.includes(obj)) { growing_plants = arrayRemove(growing_plants, obj) }
  if (master.includes(obj)) { master = arrayRemove(master, obj) }
}
function addHeight(mesh, y){
  //https://stackoverflow.com/questions/40933735/three-js-cube-geometry-how-to-update-parameters
  var scaleFactorY = mesh.geometry.parameters.height + y / mesh.geometry.parameters.height;
  mesh.geometry.parameters.height += y;
  mesh.scale.set( 1, scaleFactorY, 1 );
}
function getCenterPoint(mesh) {
  // https://stackoverflow.com/questions/38305408/threejs-get-center-of-object
    mesh.geometry.computeBoundingBox();
    center = mesh.geometry.boundingBox.getCenter( new THREE.Vector3() );
    mesh.localToWorld( center );
    return center;
}
function placeOn(mesh, place) {
  mesh.position.set(getCenterPoint(place).x, getCenterPoint(place).y+10, getCenterPoint(place).z);
}
