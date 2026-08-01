const https = require('https');
https.get('https://www.pexels.com/search/motorcycle/', { headers: {'User-Agent': 'Mozilla/5.0'} }, res => {
  let data = '';
  res.on('data', c => data+=c);
  res.on('end', () => {
    try {
      const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      if(match) {
        const json = JSON.parse(match[1]);
        const photos = json.props.pageProps.initialState.search.photos;
        const urls = photos.map(p => p.images.large);
        console.log(urls.join('\n'));
      } else {
        console.log('No NEXT_DATA found');
      }
    } catch(e) { console.log(e); }
  });
});
