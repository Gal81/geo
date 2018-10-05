const fs = require('fs');
const colors = require('colors');
const util = require('./util');
const store = require('./store');

const getFeatureID = properties => {
  const keys = [
    'HASC_1', // admin 1
    'GID_1',
  ];

  for (var i = 0; i < keys.length; i++) {
    if (properties[keys[i]]) {
      const id = properties[keys[i]].split('.');
      return `${id[0].substr(0, 2)}.${id[1]}`;
    }
  }
};

const save = (regions, country, countryCode, minify = true) => {
  if (!countryCode) {
    const error = new Error(` Missed Country Code! `);
    return console.error(` ${error.message} `.bgRed.white);
  }

  const dir = `./maps/${countryCode}`;

  if (regions.length === 0) {
    console.error(` regions are empty! `.bgRed.white);
    return false;
  }

  const geoJson = {
    title: country,
    type: 'FeatureCollection',
    features: regions,
  };

  const featureKey = `${countryCode}-all`;
  const mapKey = `countries/${countryCode}/${featureKey}`;
  const map = `Highcharts.maps['${mapKey}'] = ${minify ? JSON.stringify(geoJson) : JSON.stringify(geoJson, null, 2)};`;

  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch(ex) {
      return console.error(` ${ex.message} ‘${dir}’ `.bgRed.white);
    }
  }

  fs.writeFile(`${dir}/${countryCode}-all.js`, map, err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` ${country} level “admin1” saved! `.bgBlue.white);
  });
}

const run = () => {
  const fileName = process.argv.slice(2)[0];
  fs.readFile(`./tmp/gadm36_${fileName}.geojson`, 'utf8', (error, geoJson) => {
    if(error) {
      return console.error(` ${error} `.bgRed.white);
    }

    const regions = [];
    const { features } = JSON.parse(geoJson);
    const countryCode = store.getCountryCode(features[0]);
    const country = store.getCountryName(countryCode);

    const proceed = () => {
      features.forEach(feature => {
        const { properties, geometry: { type, coordinates } } = feature;
        const regionName = store.getLocationName(properties['NAME_1']);
        const featureID = getFeatureID(properties);

        if (!featureID) {
          const error = new TypeError(` Missed “featureID” for ‘${regionName}’! `);
          console.error(` ${error.message} `.bgRed.white);
          return false;
        }

        const splitted = featureID.split('.');

        const hcKey = splitted.join('-').toLowerCase();
        const hcA1 = featureID.split('.')[splitted.length - 1];
        const geometry = util.getSimpleGeometry(coordinates, type);
        if (geometry.length !== 0 && geometry[0].length !== 0) {
          regions.push({
            id: featureID,
            type: 'Feature',
            properties: {
              name: regionName,
              type: properties['TYPE_1'],
              'hc-group': 'admin1',
              'hc-key': hcKey,
              'hc-a1': hcA1,
            },
            geometry: {
              type,
              coordinates: geometry,
            }
          });
        }
      });

      save(regions, country, countryCode);
    }

    let readQueue = [];
    const namesExists = store.loadLocationsNames(countryCode);

    if (namesExists) {
      readQueue.push('names');
      namesExists.then(() => {
        readQueue = readQueue.filter(item => item !== 'names');
      });
    }

    const interval = setInterval(() => {
      if (readQueue.length === 0) {
        clearInterval(interval);
        proceed();
      }
    }, 100);

  });
}

store.loadCountries().then(() => run());
