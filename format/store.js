const fs = require('fs');
const colors = require('colors');

let store = {
  countries: [],
  locationNames: {},
  locationKeys: {},
};

const getData = (file, encode) => {
  if (!fs.existsSync(file)) {
    console.log(` File: ‘${file}’ doesn’t exist `.bgMagenta.white);
    return false;
  }

  return new Promise((resolve, reject) =>
    fs.readFile(file, encode, (error, data) => {
      return error ? reject(error) : resolve(data);
    })
  );
}

exports.getData = getData;

exports.getLocationName = name => {
  const { locationNames: { admin1, admin2 } } = store;
  return (admin1 && admin1[name]) || (admin2 && admin2[name]) || name;
}

exports.getLocationKey = (key, code) => {
  const { locationKeys: { admin2 } } = store;
  return (admin2 && admin2[key]) || code;
}

exports.getCountryCode = feature => store.countries.find(country =>
  country.isoA3 === feature.properties['GID_0']).isoA2.toLowerCase();

exports.getCountryCodeByName = name => store.countries.find(country =>
  country.name === name).isoA2.toLowerCase();

exports.getCountryName = code => store.countries.find(country =>
  country.isoA2 === code.toUpperCase() || country.isoA3 === code.toUpperCase()).name;

exports.loadCountries = () => {
  console.log(' Read countries… '.bgBlue.white);

  const promise = getData('./maps/countries.json', 'utf8');
  return promise &&
    promise.then(data => {
      const { countries } = JSON.parse(data);
      return store = {
        ...store,
        countries,
      };
    });
}

exports.loadLocationsNames = countryCode => {
  console.log(' Read names… '.bgBlue.white);

  const promise = getData(`./maps/${countryCode}/__names.json`, 'utf8');
  return promise &&
    promise.then(data => {
      const { admin1, admin2 } = JSON.parse(data);
      return store = {
        ...store,
        locationNames: {
          admin1,
          admin2,
        },
      };
    });
}

exports.loadLocationsKeys = countryCode => {
  console.log(' Read keys… '.bgBlue.white);

  const promise = getData(`./maps/${countryCode}/__keys.json`, 'utf8');
  return promise &&
    promise.then(data => {
      const { admin2 } = JSON.parse(data);
      return store = {
        ...store,
        locationKeys: {
          admin2,
        },
      };
    });
}
