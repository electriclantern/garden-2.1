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
var removable = ['sprout', 'seedling', 'blooming', 'ripe', 'wilting', 'decaying'];
var growing_plants = [];
var static, master, INTERSECTED, obj_selected, interactable, prev_place;
var tooltip = document.getElementById('tooltip');
var spawner;
container.onmousemove = move;
container.onclick = click;

init();
animate();

var growth_timer = setInterval(grow, 3000);

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
  create('mercury_seed')
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
          (obj_selected.position.y-10 == master[Object.keys(master)[i]].position.y) &&
          (obj_selected.position.x == master[Object.keys(master)[i]].position.x) &&
          (obj_selected.position.z == master[Object.keys(master)[i]].position.z)
        ) {
          prev_place = master[Object.keys(master)[i]];
          break
        }
      }

    }
  } else {
    var place = INTERSECTED;
    var occupying_obj;
    var occupied, mesh_above_obj = null;

    //getting object occupying space above place
    for (var i=0; i<Object.keys(master).length; i++) {
      if (
        (place.position.y+10 == master[Object.keys(master)[i]].position.y) &&
        (place.position.x == master[Object.keys(master)[i]].position.x) &&
        (place.position.z == master[Object.keys(master)[i]].position.z)
      ) {
        occupied = true;
        occupying_obj = master[Object.keys(master)[i]];
        break
      }
      else { occupied = false }
    }

    //relationships
    if (place.name == 'spawner/disposal') {
      if (removable.includes(obj_selected.name.split(' ')[1])) {
        removeObject(obj_selected);
      }
    }
    if (place.name == 'plot') { //no replanting
      if (removable.includes(obj_selected.name.split(' ')[1])) {
        occupied = true;
      }
      //planting
      if (plantable.includes(obj_selected.name.split(' ')[0]) && obj_selected.name.split(' ')[1] == 'seed') {
        create(obj_selected.name.split(' ')[0]+'_sprout', place.position.x, place.position.y+10, place.position.z);
        removeObject(obj_selected);
      }
    }

    //harvesting
    if (removable.includes(obj_selected.name.split(' ')[1])) {
      growing_plants = arrayRemove(growing_plants, obj_selected);
    }
    //seeds
    if (obj_selected.name.split(' ')[2] == '+' && prev_place != place && place != obj_selected) {
      obj_selected.name = arrayRemove(arrayRemove(obj_selected.name.split(' '), '+'), 'seed').toString().replace(',', ' ');
      create(obj_selected.name.split(' ')[0]+'_seed')
    }

    if (obj_selected.name == 'plot') {
      //get mesh above plot
      //if mesh is plant, then move with it
      for (var i=0; i<growing_plants.length; i++) {
        if (
          growing_plants[i].position.x == obj_selected.position.x &&
          growing_plants[i].position.y == obj_selected.position.y+10 &&
          growing_plants[i].position.z == obj_selected.position.z
) {
          mesh_above_obj = growing_plants[i]
        }
      }
    }

    //placement
    if (!occupied && place != obj_selected && obj_selected != occupying_obj) {
      obj_selected.position.set(place.position.x, place.position.y+10, place.position.z)

      if (mesh_above_obj) {
        mesh_above_obj.position.set(obj_selected.position.x, obj_selected.position.y+10, obj_selected.position.z)
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

function grow() {
  for (var i=0; i<growing_plants.length; i++) {
    let plant_height = growing_plants[i].geometry.parameters.height;

    if (plant_height <= 10) {addHeight(growing_plants[i], 0.5)}

    if (plant_height > 10) {
      growing_plants[i].material.color.setHex(0xb2b2b2);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' decaying'
    }
    else if (plant_height > 8) {
      growing_plants[i].material.color.setHex(0xc08bd6);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' wilting'
    }
    else if (plant_height > 4) {
      growing_plants[i].material.color.setHex(0xd30ad3);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' ripe + seed'
    }
    else if (plant_height > 2) {
      growing_plants[i].material.color.setHex(0xf767d7);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' blooming'
    }
    else if (plant_height > 1) {
      growing_plants[i].material.color.setHex(0x4bc910);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' seedling'
    }
    else {
      growing_plants[i].material.color.setHex(0x7af442);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' sprout'
    }
  }
}
