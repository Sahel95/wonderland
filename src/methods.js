const connectToProvider = require('./connector')
const subscribeToContract = require('./subscribeToContract')
const contractDetail = require('./constants/contractsDetail')
const Tx = require('ethereumjs-tx').Transaction;
const myWallet = require('./constants/myWallet')
const Web3 = require('web3')
const ethereumjs_common = require ('ethereumjs-common').default;



const sendTransaction = async (admin, data, contractAddress, provider, value) => {
    const web3 = new Web3(provider)
    var count = await web3.eth.getTransactionCount(admin)
    var gasPrice = await web3.eth.getGasPrice()

    console.log('count::::::::::', count);


    // TO DO: gasLimit
    // var block = await web3.eth.getBlock("latest");
    // var gasLimit = block.gasLimit
    // console.log(gasLimit);

    var common = ethereumjs_common.forCustomChain (
        'ropsten', { networkId: 43114, chainId: 43114, name: 'geth' },
        'muirGlacier'
      );


    var rawTx = {
        "from":admin,
        "gasPrice":web3.utils.toHex(25000000000),
        "gasLimit":web3.utils.toHex(245064),
        "to":contractAddress,
        // "value":web3.utils.toHex(value),
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count),
        "chainId": web3.utils.toHex(43114)
    };

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



const deposit = async (value, bondName, /*provider,*/ slippage/*, useAvax*/) => {
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


const redeem = async (  /* address, bond,provider, web3*/ ) => {
    
    const bond = 'MimTime'
    const address = '0xb92667E34cB6753449ADF464f18ce1833Caf26e0'

    const provider = connectToProvider()
    const web3 = new Web3(provider)
    // const [address, _] = await web3.eth.getAccounts()
    
    const bondContract = await subscribeToContract(bond, provider, 'Bonds')
    redeemData = await bondContract.methods.redeem(address, true)
    const redeemResult = await sendTransaction(address, redeemData, contractDetail['Bonds'][bond]['address'],provider)
    return redeemResult;
}


const changeApproval = async (bondName, provider, address) => {

    // TODO: check allowance then approve
    const reserveContract = await subscribeToContract(bondName, provider, 'Reserves')
    const maxUint256 = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'], maxUint256).call()
    await reserveContract.methods.allowance(address, contractDetail['Bonds'][bondName]['address'])
    
    // const balance = await reserveContract.methods.balanceOf(address)
    // if avax_time or mim_time:
    // balance = ethers.utils.formatUnits(balance, "ether")
}
redeem()

module.exports = {
    deposit,
    redeem
}