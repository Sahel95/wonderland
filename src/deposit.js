const connectToProvider = require('./connector')
const subscribeToContract = require('./subscribeToContract')
const contractDetail = require('./constants/contractsDetail')
const Tx = require('ethereumjs-tx').Transaction;
const myWallet = require('./constants/myWallet')
const addresses = require('./constants/addresses')
const Web3 = require('web3')


const sendTransaction = async (admin, data, contractAddress, provider) => {
    const web3 = new Web3(provider)

    var count = await web3.eth.getTransactionCount(admin)
    var gasPrice = await web3.eth.getGasPrice()
    var block = await web3.eth.getBlock("latest");
    var gasLimit = block.gasLimit

    console.log(admin);

    var rawTx = {
        "from":admin,
        "gasPrice":web3.utils.toHex(gasPrice),
        "gasLimit":web3.utils.toHex(gasLimit),
        "to":contractAddress,
        // "value":web3.utils.toHex(amountToBuyWith), The value transferred for the transaction in wei, also the endowment if it’s a contract-creation transaction.
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count)
    };

    console.log(rawTx);
    var tx = new Tx(rawTx, {chain:'mainnet', hardfork: 'petersburg'}); //chain????
    console.log('tttttttttttttttt',tx);
    const privateKey = Buffer.from(myWallet['privateKey'], 'hex')
    tx.sign(privateKey);
    var serializedTx = tx.serialize();
    const result = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', (hash) => {
        console.log(hash);
    })
    .on('receipt', (receipt) => {
        console.log(receipt);
    })
    .on('confirmation', (confirmationNumber, receipt) => {
        console.log( confirmationNumber);
        console.log(receipt);
    })
    .on('error', console.error);

    console.log(result);
    return result
}


const changeApproval = async (bondName, provider, address) => {

    // TODO: check allowance then approve
    const reserveContract = await subscribeToContract('RESERVES.BONDNAME?????', provider)
    const maxUint256 = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'], maxUint256).call()
    await reserveContract.methods.allowance(address, contractDetail['Bonds'][bondName]['address'])
    
    // const balance = await reserveContract.methods.balanceOf(address)
    // if avax_time or mim_time:
    // balance = ethers.utils.formatUnits(balance, "ether")
}




const deposit = async (value, bondName, /*provider,*/ slippage/*, useAvax*/) => {
    // TODO slipage
    const provider = connectToProvider()
    const web3 = new Web3(provider)
    const [depositorAddress, _] = await web3.eth.getAccounts()
    console.log(depositorAddress);
    const acceptedSlippage = slippage / 100 || 0.005;
    console.log(acceptedSlippage);
    const valueInWei = web3.utils.toWei(value)
    console.log(valueInWei);

    const reserveContract = await subscribeToContract(bondName, provider,'Reserves')
    approveResult = await reserveContract.methods.approve(contractDetail['Bonds'][bondName]['address'],valueInWei).call()
    console.log(approveResult);
    console.log('1234567890');
    const bondContract = await subscribeToContract(bondName, provider, 'Bonds')

    const calculatePremium = await bondContract.methods.bondPrice().call()
    const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));
    console.log('1234567890-234567890-p');
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
        console.log('ttttttttttttttttttttttttttttttttttt');
        const depositResult = await sendTransaction(depositorAddress, depositData, contractDetail['Bonds'][bondName]['address'],provider)
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


const redeemBond = async ( address, bond, networkID, provider, autostake ) => {
    const bondContract = subscribeToContract('bondName?????', provider)
    redeemData = await bondContract.methods.redeem(address, autostake === true).call()
    const redeemResult = await sendTransaction(address, redeemData, contractDetail['BOND.bondName???????']['address'],provider)
    return redeemResult;
}

deposit('0.8',"Wavax",2)
