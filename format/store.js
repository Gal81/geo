const fs = require('fs');
const colors = require('colors');

let store = {
  countries: [],
  locationNames: {},
  locationKeys: {},
};

exports.getLocationName = name => {
  const { locationNames } = store;
  return locationNames[name] || name;
}

exports.getLocationKey = (key, code) => {
  const { locationKeys } = store;
  return locationKeys[key] || code;
}

exports.getCountryCode = feature => store.countries.find(country => country.isoA3 === feature.properties['GID_0']).isoA2.toLowerCase();

exports.getCountryName = code => store.countries.find(country => country.isoA2 === code.toUpperCase()).name;

exports.loadCountries = () => {
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

exports.loadLocationsNames = countryCode => {
  try {
    fs.readFile(`./maps/${countryCode}/__names.json`, 'utf8', (err, data) => {
      if (data) {
        const { admin1 } = JSON.parse(data);
        store = {
          ...store,
          locationNames: admin1 || {},
        };
      }
    });
  } catch(ex) {
    console.error(` ${ex.message} `.bgRed.white);
  }
}

exports.loadLocationsKeys = countryCode => {
  try {
    fs.readFile(`./maps/${countryCode}/__keys.json`, 'utf8', (err, data) => {
      if (data) {
        const { admin2 } = JSON.parse(data);
        store = {
          ...store,
          locationKeys: admin2 || {},
        };
      }
    });
  } catch(ex) {
    console.error(` ${ex.message} `.bgRed.white);
  }
}
