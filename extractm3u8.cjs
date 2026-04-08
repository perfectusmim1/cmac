const axios = require('axios');

async function test() {
  const url = 'https://main.uxsyplayer0e0c6aba22.click/index.php?id=selcukobs1&priv=1';
  const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
  });

  const html = response.data;
  const match = html.match(/this\.baseStreamUrl\s*=\s*'([^']+)'/);
  if (match) {
    console.log("Base Stream URL:", match[1]);
    console.log("Direct m3u8:", match[1] + "selcukobs1/playlist.m3u8");
  } else {
    console.log("Not found");
  }
}

test();
