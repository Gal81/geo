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
  const regionsList = {};

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
    const map = `Highcharts.maps['${mapKey}'] = ${JSON.stringify(geoJson, null, 2)};\n`;

    maps = `${maps}${map}`;
    regionsList[key] = regionCode;
    number++;

    console.log(` ${country} region ‘${key}’ added... `.bgGreen.white);
  });

  const getIndex = list => {
    const index = {};
    for (key in list) {
      index[`${key}, admin2`] = `countries/${countryCode}/${countryCode}-${list[key]}-all.js`;
    }
    return index;
  }

  const extras = {
    country,
    regions: regionsList,
    index: getIndex(regionsList),
    script: `<script src='maps/${countryCode}/${countryCode}-admin2-all.js'></script>`,
  };



  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch(ex) {
      return console.error(` ${ex.message} ‘${dir}’ `.bgRed.white);
    }
  }

  fs.writeFile(`${dir}/${countryCode}-admin2-all.js`, maps, err => {
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
fs.readFile(`./tmp/${fileName}.json`, 'utf8', (error, geoJson) => {
  if(error) {
    return console.error(` ${error} `.bgRed.white);
  }

  let country = '';
  const regions = {};
  const { features } = JSON.parse(geoJson);
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    const hasc2 = properties['HASC_2'];
    const hasc3 = properties['HASC_3'];
    const gid3 = properties['GID_3'];
    const featureID = hasc2 || hasc3 || gid3;

    // console.log(properties);
    if (!featureID) {
      const error = new TypeError(` Missed ‘HASC_2’ and ‘HASC_3’ and ‘GID_3’ for ‘${properties['NAME_2']}’! `);
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

    const splitted = featureID.split('.');
    const hcKey = splitted.join('-').toLowerCase();
    const hcA2 = featureID.split('.')[splitted.lenght - 1];
    regions[regionName].push({
      id: featureID,
      type: 'Feature',
      properties: {
        name: properties['NAME_3'] ? properties['NAME_3'] : properties['NAME_2'],
        type: properties['TYPE_2'] || properties['TYPE_3'],
        'hc-group': 'admin2',
        'hc-key': hcKey,
        'hc-a2': hcA2,
      },
      geometry: {
        type,
        coordinates: getShortCoordinates(coordinates, type),
      }
    });
  });

  saveRegions(regions, country);
});
