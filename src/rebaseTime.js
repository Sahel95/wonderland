const Web3 = require('web3')
const subscribeToContract = require('./subscribeToContract')
const connectToProvider = require('./connector')

const EPOCH_INTERVAL = 28800;


const prettifySeconds = (seconds) => {
  if (seconds !== 0 && !seconds) {
    return "";
  }

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " Hour, " : " Hours, ") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " Min" : " Mins") : "";
  console.log(dDisplay + hDisplay + mDisplay);
  return dDisplay + hDisplay + mDisplay;
}


const secondsUntilBlock = (startBlock, endBlock) => {
    if (startBlock % EPOCH_INTERVAL === 0) {
      return 0;
    }
    return endBlock - startBlock;
  };


const timeUntilRebase = async () => {
    const provider = connectToProvider()
    const web3 = new Web3(provider)

    const currentBlock = await web3.eth.getBlockNumber()
    const currentBlockTime = (await web3.eth.getBlock(currentBlock)).timestamp
    const stakingContract = subscribeToContract('TimeStaking', provider)
    const epoch = await stakingContract.methods.epoch().call()
    const nextRebase = epoch.endTime;

    if (currentBlockTime && nextRebase) {
        const seconds = secondsUntilBlock(currentBlockTime, nextRebase);
        return prettifySeconds(seconds);
        console.log(seconds);
        return seconds
      }
}

timeUntilRebase()


module.exports = timeUntilRebase


