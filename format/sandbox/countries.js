const fs = require('fs');
const colors = require('colors');

// input: './maps/tmp.json'
// output: './maps/output.json'
fs.readFile('./maps/tmp.json', 'utf8', (error, tmp) => {
  if (error) {
    return console.error(` ${error} `.bgRed.white);
  }

  const origin = JSON.parse(tmp);
  const file = {
    countries: Object
      .keys(origin)
      .sort()
      .map(key => ({
        name: origin[key],
        isoA2: key,
        isoA3: '',
      }))
    };

  fs.writeFile('./maps/output.json', JSON.stringify(file, null, 2), errr => {
    if (errr) {
      return console.error(` ${errr} `.bgRed.white);
    }

    console.log(` DONE `.bgBlue.white);
  });
});
