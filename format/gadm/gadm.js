const fs = require('fs');
const colors = require('colors');



const getShortCoordinates = (coordinates, type, precision = 1) => {
  const divider = precision * 1000;

  const getShortPair = pair => [
    Math.round(pair[0] * divider) / divider,
    Math.round(pair[1] * divider) / divider
  ];

  if (type === 'Polygon') {
    return [coordinates[0].map(pair => getShortPair(pair))];
  } else if (type === 'MultiPolygon') {
    return [coordinates[0].map(item => item.map(pair => getShortPair(pair)))];
  } else {
    const error = new TypeError(` Unexpected geometry type ‘${type}’! `);
    console.error(`${error.message}`.bgRed.white);
  }
}

const fileName = process.argv.slice(2)[0];
fs.readFile(`./format/gadm/tmp/${fileName}.geojson`, 'utf8', (error, geoJson) => {
  if(error) {
    return console.error(`${error}`.bgRed.white);
  }

  const { features } = JSON.parse(geoJson);
  const regions = {};
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    const hasc2 = properties['HASC_2'];

    if (!hasc2) {
      return false;
    }

    const regionName = properties['NAME_1'];

    if (!regions[regionName]) {
      regions[regionName] = [];
    }

    regions[regionName].push({
      id: hasc2,
      type: 'Feature',
      properties: {
        name: properties['NAME_2'],
        type: properties['TYPE_2'],
        'hc-group': 'admin2',
        'hc-key': hasc2.split('.').join('-').toLowerCase(),
        'hc-a2': hasc2.split('.')[2],
      },
      geometry: {
        type,
        coordinates: getShortCoordinates(coordinates, type),
      }
    });
  });

  let number = 0;
  let country = '';
  let isProcessBusy = false;
  const locationsIndex = {
    index: {},
    files: [],
  };

  Object.keys(regions).forEach(key => {
    isProcessBusy = true;

    const geoJson = {
      title: key,
      type: 'FeatureCollection',
      features: regions[key],
    };

    try {
      country = regions[key][0].id.split('.')[0].toLowerCase();
    } catch(ex) {
      const error = new Error(' Missing country code in ‘${key}’ region! ');
      return console.error(`${error.message}`.bgRed.white);
    }

    let regionID = '';
    try {
      regionID = regions[key][0].id.split('.')[1].toLowerCase();;
    } catch(ex) {
      const err = new Error(' Missing region ID in ‘${key}’ region! ');
      return console.error(`${err.message}`.bgRed.white);
    }

    const file = `${country}-${key.replace(/[\']/g, '')}-all`
    const mapKey = `countries/${country}/${country}-${regionID}-all`;
    const map = `Highcharts.maps['${mapKey}'] = ${JSON.stringify(geoJson, null, 2)}`
    const dir = `./maps/${country}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    fs.writeFile(`${dir}/${file}.js`, map, err => {
      isProcessBusy = false;

      if(err) {
        return console.error(`${err}`.bgRed.white);
      }

      number++;
      console.log(` ${country.toUpperCase()} ${key} saved! `.bgGreen.white);
    });

    locationsIndex.index[`${key}, admin2`] = `${mapKey}.js`;
    locationsIndex.files.push(`<script src='maps/${country}/${file}.js'></script>`);
  });

  const interval = setInterval(() => {
    if (!isProcessBusy) {
      fs.writeFile(`./maps/${country}/__locations.json`, JSON.stringify(locationsIndex, null, 2), err => {
        if(err) {
          return console.error(`${err}`.bgRed.white);
        }

        console.log(` List of ${number} locations saved to ‘./maps/${country}/__locations.json’ `.bgMagenta.white);
      });

      clearInterval(interval);
    }
  }, 100);
});
