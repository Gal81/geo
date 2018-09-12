const fs = require('fs');
const colors = require('colors');

fs.readFile('./tmp/vn-all.geo.json', 'utf8', (error, geoJson) => {
  const origin = JSON.parse(geoJson);
  const { features } = origin;

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
  //   ...origin,
  //   features,
  // }

  // const file = `Highcharts.maps['countries/vn/vn-all'] = ${JSON.stringify(edited)}`
  const file = JSON.stringify(names, null, 2);

  fs.writeFile('./tmp/vn-all.js', file, err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` DONE `.bgBlue.white);
  });
});
