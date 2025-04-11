// api/orderbook.js

import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://api.binance.com/api/v3/depth', {
      params: { symbol: 'BTCUSDT', limit: 1000 }
    });

    const bidPrice = parseFloat(data.bids[0][0]);
    const askPrice = parseFloat(data.asks[0][0]);
    const midPrice = (bidPrice + askPrice) / 2;

    const getTotal = (arr, minPct, maxPct) => {
      return arr.reduce((total, [price, qty]) => {
        const p = parseFloat(price);
        const q = parseFloat(qty);
        const pctDiff = Math.abs(p - midPrice) / midPrice * 100;
        return (pctDiff >= minPct && pctDiff < maxPct) ? total + q : total;
      }, 0);
    };

    const bids = {
      "0-2.5%": getTotal(data.bids, 0, 2.5),
      "2.5-5%": getTotal(data.bids, 2.5, 5),
      "5-10%": getTotal(data.bids, 5, 10)
    };

    const asks = {
      "0-2.5%": getTotal(data.asks, 0, 2.5),
      "2.5-5%": getTotal(data.asks, 2.5, 5),
      "5-10%": getTotal(data.asks, 5, 10)
    };

    res.status(200).json({ bids, asks, midPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching order book' });
  }
}