const connectToProvider = require('./connector')
const subscribeToContract = require('./subscribeToContract')
const contracts = require('./constants/contractsDetail')
const Tx = require('ethereumjs-tx').Transaction;
const myWallet = require('./constants/myWallet')
const Web3 = require('web3')
const ethereumjs_common = require ('ethereumjs-common').default;



const sendTransaction = async (admin, data, contractAddress, provider, value) => {
    const web3 = new Web3(provider)
    var count = await web3.eth.getTransactionCount(admin)
    var gasPrice = await web3.eth.getGasPrice()
    var gasLimit = await web3.eth.estimateGas({
        "from"      : admin,       
        "nonce"     : web3.utils.toHex(count), 
        "to"        : contractAddress,     
        "data"      : data.encodeABI()
   })
    var common = ethereumjs_common.forCustomChain (
        'ropsten', { networkId: 43114, chainId: 43114, name: 'geth' },
        'muirGlacier'
      );


    var rawTx = {
        "from":admin,
        "gasPrice":web3.utils.toHex(gasPrice),
        "gasLimit":web3.utils.toHex(gasLimit),
        "to":contractAddress,
        // "value":web3.utils.toHex(value),
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count),
        "chainId": web3.utils.toHex(43114)
    };
    console.log('transaction::::::::::::::::::::::::::::',rawTx);
    var tx = new Tx(rawTx, { "common": common }); //chain????
    const privateKey = Buffer.from(myWallet['privateKey'], 'hex')
    tx.sign(privateKey);
    var serializedTx = tx.serialize();
    const result = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', (hash) => {
        console.log('transactionHash', hash);
    })
    .on('receipt', (receipt) => {
        console.log('receipt', receipt);
    })
    .on('error', console.error);
    return result
}



const deposit = async (ohmFork, value, bondName, /*provider,*/ slippage/*, useAvax*/) => {
    const contractDetail = contracts[ohmFork]
    // TODO slipage
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    const [depositorAddress, _] = await web3.eth.getAccounts()
    const acceptedSlippage = slippage / 100 || 0.005;
    const valueInWei = web3.utils.toWei(value)

    const reserveContract = await subscribeToContract(bondName, provider,'Reserves')
    approveResult = await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'],valueInWei).call()
    const bondContract = await subscribeToContract(bondName, provider, 'Bonds')

    const calculatePremium = await bondContract.methods.bondPrice().call()
    const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));
    try {
        // TODO *********************
        // if (useAvax) {
        //   depositData = await bondContract.methods
        //   .deposit(valueInWei, maxPremium, depositorAddress, { value: valueInWei }).call()
        // } else {
        //   depositData = await bondContract.methods
        //   .deposit(valueInWei, maxPremium, depositorAddress);
        // }

        depositData = await bondContract.methods
          .deposit(valueInWei, maxPremium, depositorAddress);
        const depositResult = await sendTransaction(depositorAddress, depositData, contractDetail['Bonds'][bondName]['address'],provider,valueInWei)
        return depositResult;

      } catch (error) {
        if (error.code === -32603 && error.message.indexOf("ds-math-sub-underflow") >= 0) {
          console.log("You may be trying to bond more than your balance! Error code: 32603. Message: ds-math-sub-underflow");
        } else if (error.code === -32603 && error.data && error.data.message.indexOf("Bond too small") >= 0) {
          console.log("Bond too small");
        } else if (error.code === -32603 && error.data && error.data.message) {
          console.log(error.data.message.split(":")[1].trim());
        } else console.log(error.message);
        return;
      }
}


const redeem = async (ohmFork, bond, admin, receiptAddress ,provider, web3 ) => {
    console.log(':::::::::::::::::::::::redeem::::::::::::::::::');
    const contractDetail = contracts[ohmFork]
    const bondContract = await subscribeToContract(bond, provider, 'Bonds', ohmFork)
    redeemData = await bondContract.methods.redeem(receiptAddress, true)
    const redeemResult = await sendTransaction(admin, redeemData, contractDetail['Bonds'][bond]['address'],provider)
    return redeemResult;
}


const pendingPayoutFor = async (ohmFork, bond, receiptAddress,provider ) => {
    const bondContract = await subscribeToContract(bond, provider, 'Bonds', ohmFork)
    claimableRewards = await bondContract.methods.pendingPayoutFor(receiptAddress).call()
    return claimableRewards;
}


const changeApproval = async (ohmFork, bondName, provider, address) => {
    const contractDetail = contracts[ohmFork]
    // TODO: check allowance then approve
    const reserveContract = await subscribeToContract(bondName, provider, 'Reserves')
    const maxUint256 = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'], maxUint256).call()
    await reserveContract.methods.allowance(address, contractDetail['Bonds'][bondName]['address'])
    
    // const balance = await reserveContract.methods.balanceOf(address)
    // if avax_time or mim_time:
    // balance = ethers.utils.formatUnits(balance, "ether")
}
// redeem()

module.exports = {
    deposit,
    redeem,
    pendingPayoutFor
}