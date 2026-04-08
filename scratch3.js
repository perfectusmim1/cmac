import axios from 'axios';
(async () => {
  const res = await axios.get('https://www.selcuksportshd0d664c64c3.xyz/');
  const html = res.data;
  const tab1Start = html.indexOf('id="tab1"');
  const tab2Start = html.indexOf('id="tab2"'); // usually the next tab
  console.log("Tab 1 start:", tab1Start, "Tab 2 start:", tab2Start);
  
  const tab1Html = html.substring(tab1Start, tab2Start !== -1 ? tab2Start : html.length);
  const matchRegex = /<a[^>]+data-url="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="name"[^>]*>([^<]+)<\/div>[\s\S]*?<time[^>]*>([^<]+)<\/time>/g;
  let match;
  let count = 0;
  while ((match = matchRegex.exec(tab1Html)) !== null) {
    console.log(match[2].trim());
    count++;
  }
  console.log("Total found in Tab 1:", count);
})();
