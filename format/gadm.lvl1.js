const fs = require('fs');
const colors = require('colors');
const util = require('./util');

let store = {
  countries: [],
<<<<<<< HEAD
  locationNames: [],
=======
  locationNames: {},
>>>>>>> feature/admin2
};

const getLocationName = name => {
  const { locationNames } = store;
<<<<<<< HEAD
  return locationNames && locationNames[name] ? locationNames[name] : name;
=======
  return locationNames[name] || name;
>>>>>>> feature/admin2
}

const getCountryCode = feature => store.countries.find(country => country.isoA3 === feature.properties['GID_0']).isoA2.toLowerCase();
const getCountryName = code => store.countries.find(country => country.isoA2 === code.toUpperCase()).name;

const loadCountries = () => {
  try {
    fs.readFile('./maps/countries.json', 'utf8', (err, data) => {
      if (data) {
        const { countries } = JSON.parse(data);
        store = {
          ...store,
          countries,
        };
      }
    });
  } catch(ex) {
    console.error(` ${ex.message} `.bgRed.white);
  }
}

const loadLocationsNames = countryCode => {
  try {
    fs.readFile(`./maps/${countryCode}/__names.json`, 'utf8', (err, data) => {
      if (data) {
        const { admin1 } = JSON.parse(data);
        store = {
          ...store,
<<<<<<< HEAD
          locationNames: admin1,
=======
          locationNames: admin1 || {},
>>>>>>> feature/admin2
        };
      }
    });
  } catch(ex) {
    console.error(` ${ex.message} `.bgRed.white);
  }
}

const saveRegions = (regions, country, countryCode, minify = true) => {
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

    console.log(` ${country} level ‘admin1’ saved! `.bgBlue.white);
  });
}

const run = () => {
  const fileName = process.argv.slice(2)[0];
  fs.readFile(`./tmp/${fileName}.geojson`, 'utf8', (error, geoJson) => {
    if(error) {
      return console.error(` ${error} `.bgRed.white);
    }

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

    const regions = [];
    const { features } = JSON.parse(geoJson);
    const countryCode = getCountryCode(features[0]);
    const country = getCountryName(countryCode);

    const prepareRegions = () => {
      features.forEach(feature => {
        const { properties, geometry: { type, coordinates } } = feature;
<<<<<<< HEAD
        const regionName = properties['NAME_1'];
=======
        const regionName = getLocationName(properties['NAME_1']);
>>>>>>> feature/admin2
        const featureID = getFeatureID(properties);

        if (!featureID) {
          const error = new TypeError(` Missed ‘featureID’ for ‘${regionName}’! `);
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
<<<<<<< HEAD
              name: getLocationName(regionName),
=======
              name: regionName,
>>>>>>> feature/admin2
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
    }

    loadLocationsNames(countryCode);
    setTimeout(() => {
      prepareRegions();
      saveRegions(regions, country, countryCode);
    }, 1000);
  });
}

loadCountries();
setTimeout(() => {
  run();
}, 1000);
