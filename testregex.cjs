const fs = require('fs');
const html = fs.readFileSync('scrapsite.html', 'utf8');

const tab1Start = html.indexOf('id="tab1"');
const tab1End = html.indexOf('</div>', tab1Start + 5000);
const tab1Html = html.substring(tab1Start, tab1End !== -1 ? tab1End : undefined);

const matchRegex = /<a[^>]+data-url="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="name"[^>]*>([^<]+)<\/div>[\s\S]*?<time[^>]*>([^<]+)<\/time>/g;

let match;
const matches = [];

while ((match = matchRegex.exec(tab1Html)) !== null) {
  matches.push({
    url: match[1],
    name: match[2].trim(),
    time: match[3].trim()
  });
}

console.log('Found ' + matches.length + ' matches');
console.log(matches.slice(0, 3));
