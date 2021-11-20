const Web3 = require('web3')

const connectToProvider = require('./connector')
const subscribeToContract = require('./subscribeToContract')
const contractDetail = require('./constants/contractsDetail')
const {deposit, redeem} = require('./methods.js')
const myWallet = require('./constants/myWallet')
const rebaseTime = require('./rebaseTime')


const init = async () => {
  const bonds = ['Mim', 'MimTime']
  const provider = connectToProvider()
  const web3 = new Web3(provider)
  const seconds = rebaseTime()
  if( seconds <= 300){
    var gasPrice = web3.utils.gasPrice()
    if (web3.utils.fromWei(gasPrice,'gwei') <= 25){
      bonds.map( (bond) => {
        redeem(bond, provider, web3)
      })
    }

  } 
}