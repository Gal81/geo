### SVG to geoJson
# 1. Data preparing
    https://www.highcharts.com/studies/map-from-svg.htm

# 2. Highmaps Series preparing
    http://jsfiddle.net/Gal81/TUy7x/3893/

# 3. Convert SVG to Geometry
    Add prepared data to ./format/series/tmpSeries.json

# 3.1 Add keys for regions if needed (by hands)

# 4. Change constants in ./format/SVGtoGeoJSON.js
    PARENT_ID = '6325'; // parent's region ID
    COUNTRY_CODE = 'DK';
    REGION_NAME = 'Hovedstaden';

# 5. Run geoJSON formatter
    npm run convert



### GADM geoJson to geoJsons
# 1. Download country's ‘Shapefile’ from
    https://gadm.org/download_country_v3.html

# 2. Convert GADM files to geoJson
    https://mygeodata.cloud/converter/

# 3. Put <filename.geojson> to ./tmp

# 4. Run geoJson splitter
    npm run split <filename[without extension!]>



### Files will be stored into ./maps
