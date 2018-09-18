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
    const error = new Error(` Missing Country Code! `);
    return console.error(` ${error.message} `.bgRed.white);
  }

  // const regionsList = {};
  const dir = `./maps/${countryCode}`;;
  // let locationKeys = '';

  // try {
  //   fs.readFile(`${dir}/__keys.json`, 'utf8', (err, data) => {
  //     if (data) {
  //       locationKeys = JSON.parse(data);
  //     }
  //   });
  // } catch(ex) {
  //   console.error(` ${ex.message} `.bgRed.white);
  // }

  // const locationKey = (key, code) => {
  //   return locationKeys && locationKeys[key] ? locationKeys[key] : code;
  // }

  const doSave = () => {
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
    const map = `Highcharts.maps['${mapKey}'] = ${minify ? JSON.stringify(geoJson) : JSON.stringify(geoJson, null, 2)};\n`;



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

  setTimeout(() => {
    doSave();
  }, 1000);
}



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
        const id = properties[keys[i]];
        const part = id.split('.');
        return `${part[0].substr(0, 2)}.${part[1]}.${part[2]}`;
      }
    }
  };

  let country = '';
  let countryCode = '';
  const regions = [];
  const { features } = JSON.parse(geoJson);
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    const regionName = properties['NAME_1'];
    const featureID = getFeatureID(properties);

    if (!featureID) {
      const error = new TypeError(` Missed ‘featureID’ for ‘${properties['NAME_2']}’! `);
      console.error(` ${error.message} `.bgRed.white);
      return false;
    }

    const splitted = featureID.split('.');

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
      regions.push({
        id: featureID,
        type: 'Feature',
        properties: {
          name: properties['NAME_1'],
          type: properties['TYPE_1'],
          'hc-group': 'admin1',
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
