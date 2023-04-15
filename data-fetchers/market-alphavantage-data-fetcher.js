
const axios = require('axios');

const date = '2023-04-04';
const symbol = 'USTNOTE10Y';

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = "BT9W23L8HDFUDP6N";

const getIntradayData = async (symbol, date) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol,
        interval: '1min',
        outputsize: 'full',
        apikey: API_KEY
      }
    });

    const data = response.data['Time Series (1min)'];
    const dateString = new Date(date).toISOString().slice(0, 10);

    const prices = Object.entries(data)
      .filter(([timestamp, values]) => {
        return timestamp.includes(dateString);
      })
      .map(([timestamp, values]) => {
        return {
          timestamp: timestamp,
          price: parseFloat(values['4. close'])
        };
      });

    return prices;
  } catch (error) {
    console.error(error);
  }
};

getIntradayData(symbol, date)
  .then((prices) => {
    console.log(`The intraday prices for ${symbol} on ${date} are:`);
    console.log(prices);
  })
  .catch((error) => {
    console.error(error);
  });
