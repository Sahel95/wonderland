const Web3 = require('web3')
const subscribeToContract = require('./subscribeToContract')

const EPOCH_INTERVAL = 28800;


const secondsUntilBlock = (startBlock, endBlock) => {
    if (startBlock % EPOCH_INTERVAL === 0) {
      return 0;
    }
    return endBlock - startBlock;
  };


const timeUntilRebase = async (provider) => {
    const web3 = new Web3(provider)

    const currentBlock = await web3.eth.getBlockNumber()
    const currentBlockTime = (await web3.eth.getBlock(currentBlock)).timestamp

    const stakingContract = subscribeToContract('STAKING_ADDRESS', provider)
    const epoch = await stakingContract.methods.epoch().call()
    const nextRebase = epoch.endTime;

    if (currentBlockTime && nextRebase) {
        const seconds = secondsUntilBlock(currentBlockTime, nextRebase);
        // return prettifySeconds(seconds);
        return seconds
      }
}


module.exports = timeUntilRebase


