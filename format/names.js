const fs = require('fs');
const colors = require('colors');

fs.readFile('./tmp/vn-all.geojson', 'utf8', (error, geoJson) => {
  const data = JSON.parse(geoJson);
  const { features } = data;

  const names = {};
  features.forEach(({ properties }) => {
    if (properties['name']) {
      names[properties['name']] = properties['alt-name'];
    }
    // if (properties['alt-name']) {
    //   properties['name'] = properties['alt-name'];
    // }
  });

  // const edited = {
  //   ...data,
  //   features,
  // }

  // const file = `Highcharts.maps['countries/vn/vn-all'] = ${JSON.stringify(edited)}`
  const file = JSON.stringify(names, null, 2);

  fs.writeFile('./tmp/vn-all.js', file, err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` DONE `.bgMagenta.white);
  });
});
