const axios = require('axios');

async function searchSofascore(query) {
  try {
    const res = await axios.get(`https://www.sofascore.com/tr/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      }
    });
    console.log(res.data.substring(0, 500));
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

searchSofascore("Göztepe Galatasaray");
