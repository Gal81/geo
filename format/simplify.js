const simplify = require('simplify-js');

const TOLERANCE = 5;

const polygon = [
  [12.453, 55.665],
  [12.453, 55.665],
  [12.456, 55.665],
  [12.455, 55.657],
  [12.46, 55.648],
  [12.438, 55.646],
  [12.453, 55.665],
];


const simple = simplify(polygon.map(point => ({ x: point[0] * 1000, y: point[1] * 1000 })), TOLERANCE);

console.log('POLYGON: ', polygon.length);
console.log('SIMPLE', simple.length);
console.log(simple);
