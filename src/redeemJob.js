const Web3 = require('web3')

const connectToProvider = require('./connector')
const {redeem, pendingPayoutFor} = require('./methods.js')
const rebaseTime = require('./rebaseTime')
const subscribeToContract = require('./subscribeToContract');

const contracts = require('./constants/contractsDetail');
const bonds = require('./constants/bonds')

// TO DO : formule
const rewardYeild = {
  Wonderland : 0.006169,
  Fortress: 0.014833
}


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const redeemJob = async function(ohmFork){
  console.log('start');

  const contractsDetail = contracts[ohmFork]
  let isRedeemed = {}
  let redeemBonds = bonds[ohmFork]
  let route, index

  // redeemBonds = ['Mim', 'MimTime']

  for (const item of redeemBonds){
    isRedeemed[item] = false
  }

  console.log('0', isRedeemed);
  const receiptAddress = '0xb92667E34cB6753449ADF464f18ce1833Caf26e0'
  const provider = connectToProvider()
  const web3 = new Web3(provider)
  const [admin, _] = await web3.eth.getAccounts()

  let i = 0
  while (i < 5) {
    var gasPrice = await web3.eth.getGasPrice()
    console.log('1', gasPrice);
    for (const bond of redeemBonds){
      if (isRedeemed[bond] === false){
        console.log('2::::::::::::::::::::::::::::::', bond);
        const profit = 0
        const reward = rewardYeild[ohmFork]
        const claimableRewards = await pendingPayoutFor(ohmFork, bond, receiptAddress, provider)
        console.log(claimableRewards);
        if (claimableRewards>0){
          console.log('3', claimableRewards);
          const bondContract = await subscribeToContract(bond, provider, 'Bonds', ohmFork)
          const redeemData = await bondContract.methods.redeem(receiptAddress, true)
          var count = await web3.eth.getTransactionCount(admin)
          const gasLimit = await web3.eth.estimateGas({
            "from"      : admin,       
            "nonce"     : web3.utils.toHex(count), 
            "to"        : contractsDetail['Bonds'][bond]['address'],     
            "data"      : redeemData.encodeABI()
          })
          console.log('4', gasLimit);

          const routerContract = await subscribeToContract('Router', provider)

          if (ohmFork === 'Wonderland'){
              route = [contractsDetail['Reserves']['Wavax']['address'], contractsDetail['Reserves']['Time']['address']]
              index = 1
          } else if (ohmFork === 'Fortress') {
              route = [contractsDetail['Reserves']['Wavax']['address'], contractsDetail['Reserves']['Mim']['address'], contractsDetail['Reserves']['Fort']['address']]
              index = 2
          }
          
          // var test = 1000000000000000
          let gasPriceInToken = await routerContract.methods.getAmountsOut(gasPrice,route).call()
          gasPriceInToken = web3.utils.fromWei(gasPriceInToken[index],'gwei')
          console.log('5', gasPriceInToken);
          if (claimableRewards*reward - gasPriceInToken*gasLimit > profit ){
            redeem(ohmFork, bond, admin, receiptAddress, provider, web3)
            isRedeemed[bond] = true
            console.log('6', isRedeemed);
          }
        } else {
          isRedeemed[bond] = true
        }
      }
      }
    await delay(60*1000)
    i++
  }
  console.log('end');
}
// redeemJob('Wonderland')
redeemJob('Fortress')

module.exports = redeemJob


