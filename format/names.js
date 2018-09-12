const fs = require('fs');
const colors = require('colors');

fs.readFile('./tmp/vn-all.geo.json', 'utf8', (error, geoJson) => {
  const origin = JSON.parse(geoJson);

  fs.readFile('./maps/vn/__names.json', 'utf8', (err, json) => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    const names = JSON.parse(json);
    const { features } = origin;
    features.forEach(({ properties }) => {
      if (properties['alt-name']) {
        const name = names[properties['name']];
        properties['name'] = name;
      }
    });

    const edited = {
      ...origin,
      features,
    }
    const file = `Highcharts.maps['countries/vn/vn-all'] = ${JSON.stringify(edited)}`

    fs.writeFile('./maps/vn/vn-all.js', file, errr => {
      if(errr) {
        return console.error(` ${errr} `.bgRed.white);
      }

      console.log(` DONE `.bgBlue.white);
    });
  });

  // const names = {};
  // if (properties['name']) {
  //   names[properties['name']] = properties['alt-name'];
  // }
  // const file = JSON.stringify(names, null, 2);
});
