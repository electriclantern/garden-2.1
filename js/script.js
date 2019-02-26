var growth_timer = setInterval(grow, 3000);
function grow() {

  for (var i=0; i<growing_plants.length; i++) {
    var plant_height = growing_plants[i].geometry.parameters.height;

    if (plant_height <= 10) {addHeight(growing_plants[i], 0.5)}

    if (plant_height > 10) {
      growing_plants[i].material.color.setHex(0xb2b2b2);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' decaying'
    }
    else if (plant_height > 8) {
      growing_plants[i].material.color.setHex(0xc08bd6);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' wilting'
    }
    else if (plant_height > 5) {
      growing_plants[i].material.color.setHex(0xd30ad3);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' ripe + seed'
    }
    else if (plant_height > 3) {
      growing_plants[i].material.color.setHex(0xf767d7);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' blooming'
    }
    else if (plant_height > 2) {
      growing_plants[i].material.color.setHex(0x4bc910);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' seedling'
    }
    else {
      growing_plants[i].material.color.setHex(0x7af442);
      growing_plants[i].name = growing_plants[i].name.split(' ')[0]+' sprout'
    }
  }
}
