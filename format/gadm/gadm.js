const fs = require('fs');

function getShortCoordinates(coordinates, type, precision = 1) {
  const divider = precision * 10;

  const getShortPair = pair => [
    Math.round(pair[0] * divider) / divider,
    Math.round(pair[1] * divider) / divider
  ];

  if (type === 'Polygon') {
    return [coordinates[0].map(pair => getShortPair(pair))];
  } else if (type === 'MultiPolygon') {
    return [coordinates[0].map(item => item.map(pair => getShortPair(pair)))];
  } else {
    const error = new TypeError(`..... Unexpected geometry type ‘${type}’! .....`);
    console.error(error.message);
  }
}

fs.readFile('./format/gadm/tmp/tmp.geojson', 'utf8', function(err, geoJson) {
  if(err) {
    return console.log(err);
  }

  const { features } = JSON.parse(geoJson);
  const regions = {};
  features.forEach(feature => {
    const { properties, geometry: { type, coordinates } } = feature;
    const regionName = properties['NAME_1'];
    const hasc2 = properties['HASC_2'];

    if (!hasc2) {
      return false;
    }
    console.log(hasc2);

    if (!regions[regionName]) {
      regions[regionName] = [];
    }

    regions[regionName].push({
      id: hasc2,
      type: 'Feature',
      properties: {
        name: properties['NAME_2'],
        type: properties['TYPE_2'],
        'hc-group': 'admin2',
        'hc-key': hasc2.split('.').join('-').toLowerCase(),
        'hc-a2': hasc2.split('.')[2],
      },
      geometry: {
        type,
        coordinates: getShortCoordinates(coordinates, type),
      }
    });
  });

  fs.writeFile(`./format/gadm/tmp/test.js`, JSON.stringify(regions),
    function(errr) {
      if(errr) {
        return console.log(errr);
      }

    console.log("::: GeoJSON saved! :::");
  });
});
