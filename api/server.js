const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

const BINANCE_API_KEY = 'T5CNfmED0YbIVXyWFES3A4pOU3RhzcNP81xP394S8mzPQabzYOWa3JXd6tuji37L';
const BINANCE_SECRET_KEY = 'vgjHDiNo8M4K7czAQ2iMFDO5zPvRiOpt1ZwRkhpGAZnXIQoKBTVEUmpv6YEzQ0RN';

app.use(cors());

function groupDepth(data, side, percentRange) {
  const price = parseFloat(data.lastUpdateId);
  const filtered = (side === 'bids' ? data.bids : data.asks)
    .map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }))
    .filter(entry => {
      const diff = Math.abs(entry.price - price) / price * 100;
      return diff >= percentRange[0] && diff < percentRange[1];
    });

  return filtered.reduce((sum, entry) => sum + entry.qty, 0);
}

app.get('/api/depth', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.binance.com/api/v3/depth', {
      params: { symbol: 'BTCUSDT', limit: 1000 }
    });

    const bidPrice = parseFloat(data.bids[0][0]);
    const askPrice = parseFloat(data.asks[0][0]);
    const midPrice = (bidPrice + askPrice) / 2;

    const getTotal = (arr, minPct, maxPct, isBid) => {
      return arr.reduce((total, [price, qty]) => {
        const p = parseFloat(price);
        const q = parseFloat(qty);
        const pctDiff = Math.abs(p - midPrice) / midPrice * 100;
        return (pctDiff >= minPct && pctDiff < maxPct) ? total + q : total;
      }, 0);
    };

    const labels = ['0-2.5%', '2.5-5%', '5-10%'];
    const datasets = [
      [getTotal(data.bids, 0, 2.5, true)],
      [getTotal(data.bids, 2.5, 5, true)],
      [getTotal(data.bids, 5, 10, true)],
      [getTotal(data.asks, 0, 2.5, false)],
      [getTotal(data.asks, 2.5, 5, false)],
      [getTotal(data.asks, 5, 10, false)]
    ];

    res.json({ labels, datasets });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching order book');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});