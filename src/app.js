const Web3 = require('web3')
const fetch = require('node-fetch');

const connectToProvider = require('./connector')
const {deposit, redeem, claimableRewards} = require('./methods.js')
const rebaseTime = require('./rebaseTime')
const {setAsyncInterval, clearAsyncInterval} = require('./asyncInterval')
const bonds = require('./constants/bonds')
const bondDiscount = require('./bondDiscount')
const influxWriter = require('./influx/influxWriter');
const subscribeToContract = require('./subscribeToContract');
const contractsDetail = require('./constants/contractsDetail');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


setAsyncInterval(async () => {
  const receiptAddress = '0xb92667E34cB6753449ADF464f18ce1833Caf26e0'
  console.log('start');
  const siaBonds = ['Mim', 'MimTime']
  const seconds = rebaseTime()
  if( seconds <= 300){
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    let i = 0
    while (i < 5) {
      var gasPrice = web3.eth.getGasPrice()
      for (const bond of siaBonds){
        if (gasPrice <= 100 * Math.pow(10,9)){
          // redeem(bond, receiptAddress, provider, web3)
        } else {
          const profit = 0
          const roi = 0.095
          const claimableRewards = await claimableRewards(bond, provider, web3)
  
          const redeemData = await bondContract.methods.redeem(receiptAddress, true)
          const gasLimit = await web3.eth.estimateGas({
            "from"      : admin,       
            "nonce"     : web3.utils.toHex(count), 
            "to"        : contractAddress,     
            "data"      : redeemData.encodeABI()
          })
  
          const routerContract = subscribeToContract('Router', provider)
          const gasInTime = routerContract.methods.
          getAmountsOut(gasPrice*gasLimit, contractsDetail['Reserves']['Wavax'], contractsDetail['Reserves']['Time'])
  
          if (claimableRewards*roi - gasInTime > profit ){
            // redeem(bond, receiptAddress, provider, web3)
          }
        }
      }
      await delay(60*1000)
      i++
    }
  }
  console.log('end');
}, 5*60*1000);



