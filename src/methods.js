const connectToProvider = require('./connector')
const subscribeToContract = require('./subscribeToContract')
const contracts = require('./constants/contractsDetail')
const Tx = require('ethereumjs-tx').Transaction;
const myWallet = require('./constants/myWallet')
const Web3 = require('web3')
const ethereumjs_common = require ('ethereumjs-common').default;
const abiDecoder = require('abi-decoder');
const {readFileSync} = require('fs');
const contractsDetail = require('./constants/contractsDetail');




const sendTransaction = async (admin, data, contractAddress, web3, exit=false) => {
  console.log('test');

    var count = await web3.eth.getTransactionCount(admin)
    var gasPrice = await web3.eth.getGasPrice()
    // console.log('33333333333333');
    var gasLimit = await web3.eth.estimateGas({
        "from"      : admin,       
        "nonce"     : web3.utils.toHex(count), 
        "to"        : contractAddress,     
        "data"      : data.encodeABI()
    })
    // console.log('ttttttttttt');
    var common = ethereumjs_common.forCustomChain (
        'ropsten', { networkId: 43114, chainId: 43114, name: 'geth' },
        'muirGlacier'
    );

    var rawTx = {
        "from":admin,
        "gasPrice":web3.utils.toHex(gasPrice),
        "gasLimit":web3.utils.toHex(gasLimit),
        "to":contractAddress,
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count),
        "chainId": web3.utils.toHex(43114)
    };
    // console.log('transaction::::::::::::::::::::::::::::',rawTx);
    var tx = new Tx(rawTx, { "common": common });
    const privateKey = Buffer.from(myWallet['privateKey'], 'hex')
    tx.sign(privateKey);
    var serializedTx = tx.serialize();
    return '2'
    const result = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', (hash) => {
        console.log('transactionHash', hash);
    })
    .on('receipt', (receipt) => {
        console.log('receipt', receipt);
        
        if(exit){
          process.exit()
        }

        return
    })
    .on('error', console.error);
    return result
}



const deposit = async (depositorAddress, ohmFork, value, bondName, web3, slippage, exit=false) => {
    const contractDetail = contracts[ohmFork]
    // TODO slipage
    const acceptedSlippage = slippage / 100 || 0.005;
    const valueInWei = web3.utils.toWei(value)
    // var valueInWei = web3.utils.toBN(74.3622 * Math.pow(10, 18))
    // const valueInWei = 14592802
    // console.log(value)

    const reserveContract = await subscribeToContract(bondName, web3,'Reserves', ohmFork)
    
    const bondContract = await subscribeToContract(bondName, web3, 'Bonds', ohmFork)

    approveResult = await reserveContract.methods.approve(bondContract._address,valueInWei).call()

    const calculatePremium = await bondContract.methods.bondPrice().call()
    const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));
    try {        
      console.log('22222');
        depositData = await bondContract.methods.deposit(valueInWei, maxPremium, depositorAddress);

        const depositResult = await sendTransaction(depositorAddress, depositData, bondContract._address,web3,value, exit)
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


const redeem = async (ohmFork, bond, admin, receiptAddress , web3 ) => {
    console.log(':::::::::::::::::::::::redeem::::::::::::::::::');
    const contractDetail = contracts[ohmFork]
    const bondContract = await subscribeToContract(bond, web3, 'Bonds', ohmFork)
    redeemData = await bondContract.methods.redeem(receiptAddress, true)
    const redeemResult = await sendTransaction(admin, redeemData, contractDetail['Bonds'][bond]['address'],web3)
    return redeemResult;
}


const pendingPayoutFor = async (ohmFork, bond, receiptAddress,web3 ) => {
    const bondContract = await subscribeToContract(bond, web3, 'Bonds', ohmFork)
    claimableRewards = await bondContract.methods.pendingPayoutFor(receiptAddress).call()
    return claimableRewards;
}


const changeApproval = async (ohmFork, bondName, web3, address) => {
    const contractDetail = contracts[ohmFork]
    // TODO: check allowance then approve
    const reserveContract = await subscribeToContract(bondName, web3, 'Reserves')
    const maxUint256 = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'], maxUint256).call()
    await reserveContract.methods.allowance(address, contractDetail['Bonds'][bondName]['address'])
    
    // const balance = await reserveContract.methods.balanceOf(address)
    // if avax_time or mim_time:
    // balance = ethers.utils.formatUnits(balance, "ether")
}

const stake = async (amount, web3) => {

    const [admin, _] = await web3.eth.getAccounts()

    let amountInWei = Number(amount) * Math.pow(10, 9)

    
    const contract = await subscribeToContract('StakingHelper', web3)
    const data = await contract.methods.stake(amountInWei, admin)
    const depositResult = await sendTransaction(admin, data, contract._address,web3)
}


const swapAvax = async (amount,token,fork, web3) => {


  const [admin, _] = await web3.eth.getAccounts()
  const routerContract = await subscribeToContract('JoeRouter', web3)

  tokenContract = await subscribeToContract(token, web3, 'Reserves', fork)

  amountIn = web3.utils.toWei(amount, 'ether')
  // var amountIn = Number(amount)

  approveData = await tokenContract.methods.approve(routerContract._address, amountIn)
  approveReceipt = await sendTransaction(admin, approveData, tokenContract._address, web3)
  
  path = [contractsDetail[fork]['Reserves']['Wavax']['address'],tokenContract._address]

  amountsOut = await routerContract.methods.getAmountsOut(amountIn, path).call() 
  console.log(amountsOut);

  amountOutMin = web3.utils.toBN(amountsOut[1])
      .mul(web3.utils.toBN(90))
      .div(web3.utils.toBN(100));
      console.log(amountOutMin);

      console.log(routerContract);
      console.log(Math.floor((Date.now() / 1000)) + 60 * 10);
  swapData = await routerContract.methods.swapExactAVAXForTokens(
      // web3.utils.toHex(amountIn),
      web3.utils.toHex(amountOutMin),
      path,
      admin,
      web3.utils.toHex(Math.floor((Date.now() / 1000)) + 60 * 10)
  )
  swapReceipt = await sendTransaction(admin, swapData, routerContract._address, web3)


}

const provider = connectToProvider()
const web3 = new Web3(provider)
stake('0.01', web3)
// swapAvax('0.01','Time', 'Wonderland', web3)
// deposit('0x0D7CB484FB24371Ef151823789F2489991978250', 'Wonderland', '1', 'Mim', web3, '0.5')
// redeem('Wonderland', 'Wavax', '0x0D7CB484FB24371Ef151823789F2489991978250', '0xb92667E34cB6753449ADF464f18ce1833Caf26e0' , web3 )
module.exports = {
    deposit,
    redeem,
    pendingPayoutFor,
    sendTransaction
}