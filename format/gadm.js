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
    console.error(` ${error.message} `.bgRed.white);
  }
}

const saveRegions = (regions, country) => {
  let number = 0;
  let dir = '';
  let maps = '';
  let countryCode = '';
  const regionsCodes = {};

  Object.keys(regions).forEach(key => {
    const region = regions[key];
    const geoJson = {
      title: key,
      type: 'FeatureCollection',
      features: region,
    };

    if (!countryCode) {
      try {
        countryCode = region[0].id.split('.')[0].slice(0, 2).toLowerCase();
      } catch(ex) {
        const error = new Error(` Missing Country Code in ‘${key}’ region! `);
        return console.error(` ${error.message} `.bgRed.white);
      }
    }

    if (!dir) {
      dir = `./maps/${countryCode}`;
    }

    const regionCode = region[0].id.split('.')[1].toLowerCase();
    const featureKey = `${countryCode}-${regionCode}-all`;
    const mapKey = `countries/${countryCode}/${featureKey}`;
    const map = `Highcharts.maps['${mapKey}'] = ${JSON.stringify(geoJson, null, 2)};`;

    maps = `${maps}\n${map}`;
    regionsCodes[key] = regionCode;
    number++;

    console.log(` ${country} region ‘${key}’ added... `.bgGreen.white);
  });

  const extras = {
    country,
    regionsCodes,
    index: {
      [`${country}, admin2`]: `countries/${countryCode}/${countryCode}-regions-all.js`,
    },
    script: `<script src='maps/${countryCode}/${countryCode}-regions-all.js'></script>`,
  };



  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch(ex) {
      return console.error(` ${ex.message} ‘${dir}’ `.bgRed.white);
    }
  }

  fs.writeFile(`${dir}/${countryCode}-regions-all.js`, maps, err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` ${country} with ${number} regions saved! `.bgGreen.white);
  });

  fs.writeFile(`./maps/${countryCode}/__extras.json`, JSON.stringify(extras, null, 2), err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` ${country}’s extras saved to ‘./maps/${countryCode}/__extras.json’ `.bgMagenta.white);
  });
}



const fileName = process.argv.slice(2)[0];
fs.readFile(`./tmp/${fileName}.geojson`, 'utf8', (error, geoJson) => {
  if(error) {
    return console.error(` ${error} `.bgRed.white);
  }

  let country = '';
  const regions = {};
  const { features } = JSON.parse(geoJson);
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    const hasc2 = properties['HASC_2'];
    const gid2 = properties['GID_2'];
    const featureID = hasc2 || gid2;

    // console.log(properties);
    if (!featureID) {
      const error = new TypeError(` Missed ‘HASC_2’ and ‘GID_2’ for ‘${properties['NAME_2']}’! `);
      console.error(` ${error.message} `.bgRed.white);
      return false;
    }

    const regionName = properties['NAME_1'];

    if (!regions[regionName]) {
      regions[regionName] = [];
    }

    if (!country) {
      country = properties['NAME_0'];
    }

    regions[regionName].push({
      id: featureID,
      type: 'Feature',
      properties: {
        name: properties['NAME_2'],
        type: properties['TYPE_2'],
        'hc-group': 'admin2',
        'hc-key': featureID.split('.').join('-').toLowerCase(),
        'hc-a2': featureID.split('.')[2],
      },
      geometry: {
        type,
        coordinates: getShortCoordinates(coordinates, type),
      }
    });
  });

  saveRegions(regions, country);
});
