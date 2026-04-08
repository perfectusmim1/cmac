const puppeteer = require('puppeteer');

async function getSofascoreId(query) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Intercept requests to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log("Navigating...");
    const url = `https://api.sofascore.com/api/v1/search/events?q=${encodeURIComponent(query)}&page=0`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const content = await page.evaluate(() => document.body.innerText);
    const json = JSON.parse(content);
    if (json.results && json.results.length > 0) {
      console.log("Match Found:", json.results[0].entity.id);
      return json.results[0].entity.id;
    }
  } catch (err) {
    console.error("Puppeteer Error:", err.message);
  } finally {
    await browser.close();
  }
}

getSofascoreId('Göztepe Galatasaray');
