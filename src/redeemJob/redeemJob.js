const Web3 = require('web3')

const connectToProvider = require('../connector')
const {redeem, pendingPayoutFor} = require('../methods.js')
const subscribeToContract = require('../subscribeToContract');

const contracts = require('../constants/contractsDetail');
const bonds = require('../constants/bonds')

// TO DO : formule
const rewardYeild = {
  Wonderland : 0.006169,
  Fortress: 0.014833
}


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const redeemJob = async function(ohmFork){
  console.log('start');
  const receiptAddress = '0xb92667E34cB6753449ADF464f18ce1833Caf26e0'
  const contractsDetail = contracts[ohmFork]
  let route, index, i = 0, isRedeemed = {}, redeemBonds = bonds[ohmFork]

  for (const item of redeemBonds){
    isRedeemed[item] = false
  }  
  
  const provider = connectToProvider()
  const web3 = new Web3(provider)
  const [admin, _] = await web3.eth.getAccounts()

    while (i < 5) {
    try {
      for (const bond of redeemBonds){
        var gasUnitPrice = await web3.eth.getGasPrice()
        if (isRedeemed[bond] === false){
          console.log('1 bond ::::::::::::::::::::::::::::::', bond);
          
          const reward = rewardYeild[ohmFork]
          const claimableRewards = await pendingPayoutFor(ohmFork, bond, receiptAddress, web3)
          console.log('2 claimableRewards', claimableRewards);
          console.log('3 gasUnitPrice', gasUnitPrice);
          if (claimableRewards>0){
            
            const bondContract = await subscribeToContract(bond, web3, 'Bonds', ohmFork)
            const redeemData = await bondContract.methods.redeem(receiptAddress, true)
            var count = await web3.eth.getTransactionCount(admin)
            const gasLimit = await web3.eth.estimateGas({
              "from"      : admin,       
              "nonce"     : web3.utils.toHex(count), 
              "to"        : contractsDetail['Bonds'][bond]['address'],     
              "data"      : redeemData.encodeABI()
            })
            console.log('4 gasLimit', gasLimit);

            let gasPrice = gasLimit * gasUnitPrice
            console.log('5 gasPrice', gasPrice);
            gasPrice = web3.utils.toBN(gasPrice)
            
            const routerContract = await subscribeToContract('Router', web3)
            if (ohmFork === 'Wonderland'){
                route = [contractsDetail['Reserves']['Wavax']['address'], contractsDetail['Reserves']['Time']['address']]
                index = 1
            } else if (ohmFork === 'Fortress') {
                route = [contractsDetail['Reserves']['Wavax']['address'], contractsDetail['Reserves']['Mim']['address'], contractsDetail['Reserves']['Fort']['address']]
                index = 2
            }
            
            let gasPriceInCurrency = await routerContract.methods.getAmountsOut(gasPrice,route).call()
            console.log('6 gasPriceInCurrency', gasPriceInCurrency[index]);

            if (claimableRewards*reward - gasPriceInCurrency[index] > 0 ){
              // redeem(ohmFork, bond, admin, receiptAddress, web3, web3)
              console.log('claim');
              isRedeemed[bond] = true
              console.log('7', isRedeemed);
            }else{
              console.log('NO claim');
            }
          } else {
            isRedeemed[bond] = true
          }
        }
        }

        await delay(60*1000)
        i++

    } catch (error) {
      console.log(error);
      await delay(60*1000)
      i++
    }
    
  }
  console.log('end');
}
redeemJob('Wonderland')
// redeemJob('Fortress')

module.exports = redeemJob

