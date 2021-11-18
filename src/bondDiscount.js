const Web3 = require('web3');
const fetch = require('node-fetch');

const subscribeToContract = require('./subscribeToContract')
const connectToProvider = require('./connector')



const getTokenPrice = async (tokenName) => {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2,olympus,magic-internet-money&vs_currencies=usd'
    const response = await fetch(url)
    const body = await response.json()
    const prices = {
        AVAX: body["avalanche-2"].usd,
        MIM: body["magic-internet-money"].usd,
        OHM: body["olympus"].usd
      }
    return prices[tokenName]

  } catch (error) {
    console.log('getTokenPrice',error);
  }
};



const bonddDiscount = async (bond, /*provider*/) => {
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    let bondDiscount
    const bondContract = await subscribeToContract(bond, provider, 'Bonds')

    // getMarketPrice
    const mimTimeContract = await subscribeToContract('MimTime', provider,'Reserves')
    const reserves = await mimTimeContract.methods.getReserves().call()
    let marketPrice = reserves[0] / reserves[1]

    const mimPrice = await getTokenPrice("MIM");
    marketPrice = (marketPrice / Math.pow(10, 9)) * mimPrice;


    try {
        bondPrice = await bondContract.methods.bondPriceInUSD().call()
  
        if (bond === 'avax_time') {
            console.log('trr');
          const avaxPrice = getTokenPrice("AVAX");
          bondPrice = bondPrice * avaxPrice;
        }
        bondDiscount = (marketPrice * Math.pow(10, 18) - bondPrice) / bondPrice;
      } catch (e) {
        console.log("error getting bondPriceInUSD", e);
      }
    return bondDiscount
}



bonddDiscount('Mim')
// getTokenPrice('MIM')
