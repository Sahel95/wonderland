const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const {privateKey} = require('./constants/myWallet')
const Accounts = require('web3-eth-accounts')

const url = 'http://127.0.0.1:8545'
// const url = 'https://speedy-nodes-nyc.moralis.io/ff2eb169801bccb4ea1cd0cb/avalanche/mainnet'
// const url = 'https://speedy-nodes-nyc.moralis.io/ff2eb169801bccb4ea1cd0cb/eth/rinkeby'

const connectToProvider =  () => {
    const provider = new HDWalletProvider(
        privateKey,
        url
    )
    // console.log(provider);

    return provider
}

// connectToProvider()

module.exports =  connectToProvider

