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
    npm run admin1 || admin2 <filename[without ‘gadm36_’ prefix & extension]>

## Files will be stored into ./maps
