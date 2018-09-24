### ‘GADM’ geoJson to ‘highmaps’ geoJson
# 1. Download country's ‘Shapefile’ from
    https://gadm.org/download_country_v3.html

# 2. Convert GADM files to geoJson
    https://mapshaper.org/
    https://mygeodata.cloud/converter/

    https://qgis.org/en/site/
## With coordinates reference system ‘Europe_Albers_Equal_Area_Conic’ for Europe

# 3. Put <filename.json> to ./tmp

# 4. Run geoJson formatter
    npm run admin1 || admin2 <filename[without extension!]>

## Files will be stored into ./maps



## SVG to geoJson
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

# 5. Run geoJson formatter
    npm run convert
