const axios = require('axios');

const params = {
  market: 14, // 1 = stock market, 14 = stock market
  em: 17445, // 3 = Apple stock (AAPL), 17445 = RTS Index
  code: 'RTSI',
  df: 1, // start date (day)
  mf: 0, // start date (month)
  yf: 2021, // start date (year)
  dt: 31, // end date (day)
  mt: 11, // end date (month)
  yt: 2021, // end date (year)
  p: 8, // data format (8 = candlestick bars)
  e: '.csv', // data file extension
  cn: 'AAPL', // contract name
  dtf: 1, // date format (1 = YYYYMMDD)
  tmf: 3, // time format (3 = hours, minutes, seconds)
  MSOR: 1, // output data ordering (1 = ascending)
  mstimever: 0, // use server time (0 = local time)
  sep: 1, // data separator (1 = comma)
  sep2: 1, // decimal separator (1 = dot)
  at: 1, // add header to output (1 = yes)
};



axios.get('https://export.finam.ru/export9.out', { params })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.log(error);
  });
