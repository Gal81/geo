#1. Data preparing
    https://www.highcharts.com/studies/map-from-svg.htm

#2. Highmaps Series preparing
    http://jsfiddle.net/Gal81/TUy7x/3893/

#3. Convert SVG to Geometry
    Add prepared data to ./format/tmp/dataSeries.json

#3.1 Add keys for regions if needed (by hands)

#4. Change parameters in ./format/geoJSON.js
    PARENT_ID = '6325'; // parent's region ID
    COUNTRY_CODE = 'DK';
    REGION_NAME = 'Hovedstaden';

# 5. Run geoJSON formatter
    npm run geo
