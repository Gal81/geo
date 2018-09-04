const fs = require('fs');

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
