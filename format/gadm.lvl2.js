const fs = require('fs');
const colors = require('colors');
const util = require('./util');
const store = require('./store');

const getFeatureID = properties => {
  const keys = [
    'HASC_2', // admin 2
    'HASC_3', // admin 3
    'GID_2',
    'GID_3',
  ];

  for (var i = 0; i < keys.length; i++) {
    if (properties[keys[i]]) {
      const time = `${new Date().getTime()}`;
      const hash = time.substr(time.length - 2) + Math.round(Math.random(100) * 10);
      const id = properties[keys[i]].split('.');
      return `${id[0].substr(0, 2)}.${id[1]}.${id[2] || hash}`;
    }
  }
};

const saveRegions = (regions, country, countryCode, minify = true) => {
  if (!countryCode) {
    const error = new Error(` Missed Country Code! `);
    return console.error(` ${error.message} `.bgRed.white);
  }

  const regionsList = {};
  const dir = `./maps/${countryCode}`;
  let number = 0;
  let maps = '';

  Object.keys(regions).forEach(key => {
    if (regions.length === 0) {
      console.error(` regions are empty! `.bgRed.white);
      return false;
    }

    const region = regions[key];
    const geoJson = {
      title: key,
      type: 'FeatureCollection',
      features: region,
    };

    const regionCode = region[0].id.split('.')[1].toLowerCase();
    const featureKey = `${countryCode}-${store.getLocationKey(key, regionCode)}-all`;
    const mapKey = `countries/${countryCode}/${featureKey}`;
    const map = `Highcharts.maps['${mapKey}'] = ${minify ? JSON.stringify(geoJson) : JSON.stringify(geoJson, null, 2)};\n`;

    maps = `${maps}${map}`;
    regionsList[key] = regionCode;
    number++;

    console.log(` ${country} region ‘${key}’ added... `.bgGreen.white);
  });

  const getIndex = list => {
    const index = {};
    for (key in list) {
      index[`${key}, admin2`] = `countries/${countryCode}/${countryCode}-${store.getLocationKey(key, list[key])}-all.js`;
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

    console.log(` ${country} with ${number} regions saved! `.bgBlue.white);
  });

  fs.writeFile(`./maps/${countryCode}/__extras.json`, JSON.stringify(extras, null, 2), err => {
    if(err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` ${country}’s extras saved to ‘./maps/${countryCode}/__extras.json’ `.bgMagenta.white);
  });
}

const run = () => {
  const fileName = process.argv.slice(2)[0];
  fs.readFile(`./tmp/${fileName}.geojson`, 'utf8', (error, geoJson) => {
    if(error) {
      return console.error(` ${error} `.bgRed.white);
    }

    const regions = {};
    const { features } = JSON.parse(geoJson);
    const countryCode = store.getCountryCode(features[0]);
    const country = store.getCountryName(countryCode);

    const prepareRegions = () => {
      features.forEach(feature => {
        const { properties, geometry: { type, coordinates } } = feature;
        // const regionName = properties['NAME_2'] || properties['NAME_1'];
        const regionName = store.getLocationName(properties['NAME_1']);
        const featureID = getFeatureID(properties);

        if (!featureID) {
          const error = new TypeError(` Missed ‘featureID’ for ‘${properties['NAME_2']}’! `);
          console.error(` ${error.message} `.bgRed.white);
          return false;
        }

        const splitted = featureID.split('.');

        if (!regions[regionName]) {
          regions[regionName] = [];
        }

        const hcKey = splitted.join('-').toLowerCase();
        const hcA2 = featureID.split('.')[splitted.length - 1];
        const geometry = util.getSimpleGeometry(coordinates, type);
        if (geometry.length !== 0 && geometry[0].length !== 0) {
          regions[regionName].push({
            id: featureID,
            type: 'Feature',
            properties: {
              name: store.getLocationName(properties['NAME_3'] || properties['NAME_2']),
              type: properties['TYPE_2'] || properties['TYPE_3'] || properties['TYPE_4'],
              'hc-group': 'admin2',
              'hc-key': hcKey,
              'hc-a2': hcA2,
            },
            geometry: {
              type,
              coordinates: geometry,
            }
          });
        }
      });
    }

    store.loadLocationsNames(countryCode);
    store.loadLocationsKeys(countryCode);
    setTimeout(() => {
      prepareRegions();
      saveRegions(regions, country, countryCode);
    }, 1000);
  });
}

store.loadCountries();
store.loadLocationsKeys();
setTimeout(() => {
  run();
}, 1000);
