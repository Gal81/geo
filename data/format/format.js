const fs = require('fs');

// 1. https://www.highcharts.com/studies/map-from-svg.htm
// 2. http://jsfiddle.net/Gal81/TUy7x/3893/
// 3. RAW data from http://svg-to-wkt.linfiniti.com/

fs.readFile('./data/tmp/dataRaw.txt', 'utf8', function(err, raw) {
  if(err) {
    return console.log(err);
  }

  let format = raw.replace('GEOMETRYCOLLECTION(POLYGON((', '')
    .replace(')))', '');

  format = format.split(',')
    .map(function(pair, index) {
      const point = pair.split(' ');
      const tab = '  ';
      return `\n${tab}[${Math.round(point[0] * 10) / 10}, ${Math.round(point[1] * 10) / 10}]`;
    }).toString();


 fs.writeFile('./data/tmp/dataFormatted.txt', `[${format}\n]`,
  function(errr) {
    if(errr) {
      return console.log(errr);
    }

    console.log("::: Geometry saved! :::");
 });
});
