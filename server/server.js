const express = require('express');
const app = express();

const mapsPath = `${__dirname.split('server')[0]}maps`
app.use(express.static(mapsPath));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
