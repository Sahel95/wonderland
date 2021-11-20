const Web3 = require('web3')
const fetch = require('node-fetch');

const connectToProvider = require('./connector')
const {deposit, redeem} = require('./methods.js')
const rebaseTime = require('./rebaseTime')
const {setAsyncInterval, clearAsyncInterval} = require('./asyncInterval')
const bonds = require('./constants/bonds')
const bondDiscount = require('./bondDiscount')
const influxWriter = require('./influx/influxWriter')


setAsyncInterval(async () => {
  console.log('start');
  const siaBonds = ['Mim', 'MimTime']
  const seconds = rebaseTime()
  if( seconds <= 300){
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    var gasPrice = web3.utils.gasPrice()
    if (web3.utils.fromWei(gasPrice,'gwei') <= 25){
      for (const bond of siaBonds){
        await redeem(bond, provider, web3)
      }
    }
  }
  console.log('end');
}, 5*60*1000);



