import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://www.sofascore.com/football/match/paris-saint-germain-liverpool/UsUH#id:15632083', { waitUntil: 'networkidle2' });
  
  const html = await page.content();
  console.log("has stats?", html.includes('match.statistics'));
  console.log("has lineups?", html.includes('match.lineups'));
  console.log("has match.attackMomentum?", html.includes('match.attackMomentum'));
  console.log("has list?", html.match(/sofa-widget.*?data-widget="([^"]+)"/g));

  await browser.close();
})();
