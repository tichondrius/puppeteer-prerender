const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('tiny'));

const router = express.Router();

app.use(cors());

const pageDoneCheckInterval = 300;
const pageLoadTimeout = 20000;

var port = process.env.PORT || 3000;

async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}


router.get('/url', async function(req, res) {
  const url = req.query.url;
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    let bodyHTML = await page.evaluate(() => document.documentElement.innerHTML);
    let currentTime = 0;

    while (true) {
      let prerenderReady = await page.evaluate(() => window.prerenderReady);
      if (prerenderReady) {
        let bodyHTML = await page.evaluate(() => document.documentElement.innerHTML);
        return res.json({ html: bodyHTML })
      } else {
        if (currentTime > pageLoadTimeout) {
          let bodyHTML = await page.evaluate(() => document.documentElement.innerHTML);
          return res.json({ html: bodyHTML });
        }
        await delay(pageDoneCheckInterval);
        currentTime += pageDoneCheckInterval;
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
  
});

app.use('/', router);

app.listen(port);
console.log('Server running on port ' + port);

