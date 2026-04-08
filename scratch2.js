fetch('https://widgets.sofascore.com/embed/match/15632083/statistics')
  .then(res => console.log('statistics status:', res.status));

fetch('https://widgets.sofascore.com/api/widget/script')
  .then(res => console.log('script status:', res.status));
