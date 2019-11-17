
const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const utils = require('./utils');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('tiny'));

const router = express.Router();

app.use(cors());

const pageDoneCheckInterval = 300;
const pageLoadTimeout = 20000;

const port = process.env.PORT || 3000;
let browser = null;

async function initBrowser () {
  browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}



initBrowser();

router.get('/render', async function(req, res) {
  const url = req.query.url;
  const prerenderReadyCheck = String(req.query.prerenderReadyCheck) === 'true';
  let html = '';
  const page = await browser.newPage();
  try {
    if (!prerenderReadyCheck) {
      await page.goto(url, { waitUntil: 'networkidle2' });
      html = await page.evaluate(() => document.documentElement.outerHTML);
    } else {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      let currentTime = 0;
      while (true) {
        let prerenderReady = await page.evaluate(() => window.prerenderReady);
        if (prerenderReady) {
          let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);
          html = bodyHTML;
          break;
        } else {
          if (currentTime > pageLoadTimeout) {
            let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);
            html = bodyHTML;
            break;
          }
          await utils.delay(pageDoneCheckInterval);
          currentTime += pageDoneCheckInterval;
        }
      }
    }
    page.close();
    return res.json({ html });
  } catch (error) {
    console.log(error);
    res.status(500).send(error).end();
  }
});

app.use('/', router);

module.exports = app;

