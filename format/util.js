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

exports.getSimpleGeometry = (coordinates, type) => {
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
