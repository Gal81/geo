const fs = require('fs');
const colors = require('colors');
const simplify = require('simplify-js');

const TOLERANCE = 5;
const TRIM_AREA = 1000;

const getPolygonArea = polygon => {
  let i = 0;
  const multiply = polygon.reduce((memo, xy) => {
    i += 1;
    if (polygon[i]) {
      return [...memo, [xy[0] * polygon[i][1], xy[1] * polygon[i][0]]];
    }
    return memo;
  }, []);

  const sum = multiply.reduce((memo, item) => [memo[0] + item[0], memo[1] + item[1]], [0, 0]);

  return Math.abs((sum[0] - sum[1]) / 2);
}

const getSimpleGeometry = (coordinates, type) => {
  const cut = 100;
  const getShortXY = pair => [
    // pair[0] * cut,
    // pair[1] * cut,
    Math.round(pair[0] * cut) / cut,
    Math.round(pair[1] * cut) / cut,
  ];

  const getPointXY = point => ({ x: point[0] / cut, y: point[1] / cut });
  const getPointArray = point => [point.x, point.y];

  if (type === 'Polygon') {
    const simple = simplify(coordinates[0].map(point => getPointXY(point)), TOLERANCE, true);
    return [simple.map(point => getPointArray(point)).map(point => getShortXY(point))];
  } else if (type === 'MultiPolygon') {
    return [coordinates.reduce((memo, item) => {
      const simple = simplify(item[0].map(point => getPointXY(point)), TOLERANCE, true);
      const polygon = simple.map(point => getPointArray(point)).map(point => getShortXY(point));

      if (getPolygonArea(polygon) > TRIM_AREA) {
        // console.log(getPolygonArea(polygon));
        return [...memo, polygon];
      }

      return memo;
    }, [])];
  } else {
    const error = new TypeError(` Unexpected geometry type ‘${type}’! `);
    console.error(` ${error.message} `.bgRed.white);
  }
}



const saveRegions = (regions, country, countryCode, minify = true) => {
  if (!countryCode) {
    const error = new Error(` Missing Country Code in! `);
    return console.error(` ${error.message} `.bgRed.white);
  }

  const regionsList = {};
  const dir = `./maps/${countryCode}`;;
  let number = 0;
  let maps = '';
  let locationKeys = '';

  try {
    fs.readFile(`${dir}/__keys.json`, 'utf8', (err, data) => {
      if (data) {
        locationKeys = JSON.parse(data);
      }
    });
  } catch(ex) {
    console.error(` ${ex.message} `.bgRed.white);
  }

  const locationKey = (key, code) => {
    return locationKeys && locationKeys[key] ? locationKeys[key] : code;
  }

  const doSave = () => {
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
      const featureKey = `${countryCode}-${locationKey(key, regionCode)}-all`;
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
        index[`${key}, admin2`] = `countries/${countryCode}/${countryCode}-${locationKey(key, list[key])}-all.js`;
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

  setTimeout(() => {
    doSave();
  }, 1000);
}



const fileName = process.argv.slice(2)[0];
fs.readFile(`./tmp/${fileName}.geojson`, 'utf8', (error, geoJson) => {
  if(error) {
    return console.error(` ${error} `.bgRed.white);
  }

  let country = '';
  let countryCode = '';
  const regions = {};
  const { features } = JSON.parse(geoJson);
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    // const regionName = properties['NAME_2'] || properties['NAME_1'];
    const regionName = properties['NAME_1'];
    const hasc2 = properties['HASC_2'];
    const hasc3 = properties['HASC_3'];
    const gid2 = properties['GID_2'];
    const gid3 = properties['GID_3'];
    const featureID = hasc3 || hasc2 || gid3 || gid2;

    if (!featureID) {
      const error = new TypeError(` Missed ‘featureID’ for ‘${properties['NAME_2']}’! `);
      console.error(` ${error.message} `.bgRed.white);
      return false;
    }

    const splitted = featureID.split('.');

    if (!regions[regionName]) {
      regions[regionName] = [];
    }

    if (!country) {
      country = properties['NAME_0'];
    }

    if (!countryCode) {
      countryCode = splitted[0].slice(0, 2).toLowerCase();
    }

    const hcKey = splitted.join('-').toLowerCase();
    const hcA2 = featureID.split('.')[splitted.lenght - 1];
    const geometry = getSimpleGeometry(coordinates, type);
    if (geometry.length !== 0 && geometry[0].length !== 0) {
      regions[regionName].push({
        id: featureID,
        type: 'Feature',
        properties: {
          name: properties['NAME_3'] ? properties['NAME_3'] : properties['NAME_2'],
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

  saveRegions(regions, country, countryCode);
});
