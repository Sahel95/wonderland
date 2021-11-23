const Web3 = require('web3')

const bonds = require('./constants/bonds')

const connectToProvider = require('./connector')
const {setAsyncInterval, clearAsyncInterval} = require('./asyncInterval')
const bondDiscount = require('./bondDiscount')
const influxWriter = require('./influx/influxWriter')


// TODO: add fortress
setAsyncInterval(async () => {
  console.log('start');
  for (const bond of bonds['Wonderland']){
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    let discount = await bondDiscount(bond, provider, web3)
    
    discount = discount*100
    influxWriter(bond, discount)
  }
  console.log('end');
}, 1000);


