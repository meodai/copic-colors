const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const https = require('https');
const {titleCase} = require('title-case');
const PaletteExtractor = require("./palette-extractor.js");
const officialColors = require('./colors');

const {
  getSync
} = require('@andreekeberg/imagedata');

const allColorsURL = 'https://copic.jp/en/color/';

async function downloadImage(url, filename) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(filename);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filename);
        console.log(`Download Completed for ${filename}`);
      });
    });
  });
}

async function extractColorFromFile(filename) {
  return new Promise((resolve) => {
    const paletteExtractor = new PaletteExtractor();
    const imgData = getSync(filename);
    const extractedColors = paletteExtractor.processImageData(imgData.data, 1);
    resolve(extractedColors[0]);
  });
}

// clear images folder
fs.readdirSync(path.join(__dirname, '..', 'images')).forEach(file => {
  fs.unlinkSync(path.join(__dirname, '..', 'images', file));
});

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  
  const page = await browser.newPage();
  await page.goto(allColorsURL);
  const colorList = await page.evaluate(_ => {
    const colorList = [];
    const colorTable = document.querySelector('.sec_contents_product .col8_2');
    const colorItems = colorTable.querySelectorAll('a');

    for (let i = 0; i < colorItems.length; i++) {
      const $color = colorItems[i];
      const link = $color.href;
      const name = $color.querySelector('p').textContent;
      const number = $color.querySelector('h2').textContent;
      const imgURL = $color.querySelector('img').src;

      // download image

      colorList.push({
        name, link, number, imgURL
      });

    }
    return colorList;
  });

  // download images
  for (const color of colorList) {
    const imgFileName = `${color.number}.jpg`; // You can customize the filename
    const imgPath = path.join(__dirname, '..', 'images', imgFileName);
    await downloadImage(color.imgURL, imgPath);
    color.extractedColor = await extractColorFromFile(imgPath);
    color.fileName = imgFileName;
  }

  colorList.forEach(c => {
    const officialColor = officialColors.find(oc => oc.number === c.number);
    if (officialColor) {
      c.hex = officialColor.hex;
    } else {
      console.log(`No official color found for ${c.number}`);
    }
    //c.colorFamily = c.number.match(/([A-Z]+)/)[1];
  });

  // data sanitization
  colorList.sort((a, b) => {
    if (a.number < b.number) {
      return -1;
    }
    if (a.number > b.number) {
      return 1;
    }
    return 0;
  }).forEach(c => {
    c.name = titleCase(c.name);
    // extract color family
    const extFam = c.number.match(/[A-Z]+/);
    const family = extFam ? extFam : 'A';
    c.family = family;
    
    //c.hex = c.hex.toLowerCase();
  });

  console.log(colorList)

  await browser.close();

  // update color count in readme.md
  // gets SVG template
  let svgTpl = fs.readFileSync(
    './readme.md',
    'utf8'
  ).toString();

  svgTpl = svgTpl.replace(/\(\*{2}(\d+)\*{2}\)/gm, `(**${colorList.length}**)`);

  fs.writeFileSync(
    './readme.md',
    svgTpl
  );

  // create a csv file with the colors
  const csv = 'name, link, number, extractedColor, hex, fileName\n' + colorList.map(c => `${c.name},${c.link},${c.number},${c.extractedColor},${c.hex || ''},${c.fileName}`).join('\n');
  
  fs.writeFileSync('./colors.csv', csv);
  fs.writeFileSync('./colors.min.json', JSON.stringify(colorList));
  fs.writeFileSync('./colors.json', JSON.stringify(colorList, null, 2));
})();