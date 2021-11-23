const Web3 = require('web3')
const fetch = require('node-fetch');

const connectToProvider = require('./connector')
const {deposit, redeem, claimableRewards} = require('./methods.js')
const {setAsyncInterval, clearAsyncInterval} = require('./asyncInterval')
const bonds = require('./constants/bonds')
const bondDiscount = require('./bondDiscount')
const influxWriter = require('./influx/influxWriter');
const subscribeToContract = require('./subscribeToContract');
const contractsDetail = require('./constants/contractsDetail');



setAsyncInterval(async () => {}, 5*60*1000);



