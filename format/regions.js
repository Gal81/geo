const fs = require('fs');
const colors = require('colors');
const store = require('./store');

const save = (country, json) => {
  const countryCode = store.getCountryCodeByName(country);
  if (!countryCode) {
    const error = new Error(` Missed Country Code! `);
    return console.error(` ${error.message} `.bgRed.white);
  }

  const dir = `./maps/${countryCode}`;
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch(ex) {
      return console.error(` ${ex.message} ‘${dir}’ `.bgRed.white);
    }
  }

  fs.writeFile(`${dir}/__regions.json`, JSON.stringify(json, null, 2), err => {
    if (err) {
      return console.error(` ${err} `.bgRed.white);
    }

    console.log(` ${country} regions saved! `.bgBlue.white);
  });
}

const run = countries => {
  const fileName = process.argv.slice(2)[0];
  const country = store.getCountryName(fileName);
  let readQueue = ['admin1', 'admin2'];

  let admin1;
  store.getData(`./tmp/gadm36_${fileName}_1.geojson`, 'utf8')
    .then(json => {
      admin1 = JSON.parse(json);
      readQueue = readQueue.filter(item => item !== 'admin1');
    });

  let admin2;
  store.getData(`./tmp/gadm36_${fileName}_2.geojson`, 'utf8')
    .then(json => {
      admin2 = JSON.parse(json);
      readQueue = readQueue.filter(item => item !== 'admin2');
    });

  const proceed = () => {
    const json = {
      country,
      regions: admin1.features
        .map(region => ({
          id: region.properties['GID_1'],
          name: region.properties['NAME_1'],
          type: region.properties['TYPE_1'],
          subRegions: admin2.features
            .filter(sub => sub.properties['NAME_1'] === region.properties['NAME_1'])
            .map(sub => ({
              id: sub.properties['GID_2'],
              name: sub.properties['NAME_2'],
              type: sub.properties['TYPE_2'],
            })),
      })),
    };

    save(country, json);

    // console.log(json);
    // console.log(admin1.features);
    // console.log(admin2.features);
  }

  const interval = setInterval(() => {
    if (readQueue.length === 0) {
      clearInterval(interval);
      proceed();
    }
  }, 100);
}

store.loadCountries()
  .then(() => run())
  .catch((error) => console.error(` ${error} `.bgRed.white));
