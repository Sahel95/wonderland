const connectToProvider = require('./connector')
const {sendTransaction} = require('./methods.js')
const subscribeToContract = require('./subscribeToContract');
const Web3 = require('web3')
const {readFileSync} = require('fs')


const contractsDetail = require('./constants/contractsDetail');
const bonds = require('./constants/bonds');

const abiDecoder = require('abi-decoder');
const fetch = require('node-fetch');



const zapinLpData = async (bond, token, tokenAmmount, slippage, ohmFork='Wonderland') => {
    const contracts = contractsDetail[ohmFork]

    const sellToken = contracts['Reserves'][token]['address']
    const buyToken = contracts['Reserves'][bond]['address']
    const zapInAddress = contractsDetail['ZapIn']['address']

    const url = `https://api.zapper.fi/v1/zap-in/pool/traderjoe/transaction?gasPrice=1000000000000&ownerAddress=${zapInAddress}&sellAmount=${tokenAmmount}&sellTokenAddress=${sellToken}&poolAddress=${buyToken}&slippagePercentage=${slippage}&network=avalanche&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241&skipGasEstimate=true`;

    const response = await fetch(url)
    const body = await response.json()

    const data = body.data
    const abi = JSON.parse(readFileSync('./src/constants/mine-abi/TraderZapin.json'))
    abiDecoder.addABI(abi)
    var decodeData = abiDecoder.decodeMethod(data);
    let swapTarget, swapData
    for (const item of decodeData.params){
        if (item['name'] === '_swapTarget'){
            swapTarget=item['value']
        }

        if (item['name'] === 'swapData'){
            swapData = item['value']
        }

    }
    console.log(decodeData);
    console.log('!!!!!!!!!!!!!!!!!');
    console.log(body);
    console.log(tokenAmmount);
    return [swapTarget, swapData, body.minTokens];
};


const zapinData = async (bond, token, tokenAmmount, slippage, web3, ohmFork='Wonderland' ) => {
    const contracts = contractsDetail[ohmFork]


    const sellToken = contracts['Reserves'][token]['address']
    const buyToken = contracts['Reserves'][bond]['address']
    const zapInAddress = contractsDetail['ZapIn']['address']

    const url = `https://avalanche.api.0x.org/swap/v1/quote?buyToken=${buyToken}&includePriceComparisons=true&intentOnFilling=true&sellAmount=${tokenAmmount}&sellToken=${sellToken}&skipValidation=true&slippagePercentage=${slippage}`;
    const response = await fetch(url)
    const data = await response.json()
    

    const dataBuyAmount = web3.utils.toBN(data.buyAmount)
    // TO DO
    // const buyAmount = dataBuyAmount.sub(dataBuyAmount.mul(slippage * 1000).div(1000));

    // return [data.to, data.data, buyAmount.toString()];
    return [data.to, data.data, dataBuyAmount];
};




const calcZapinDetails = async (bond, token, valueInWei, slippage,web3, ohmFork='Wonderland') => {
    const contracts = contractsDetail[ohmFork]

    const acceptedSlippage = slippage / 100 || 0.02;

    if (0.001 < acceptedSlippage < 1) {
        console.log('suitable slipage');
    }

    
    console.log(valueInWei);

    try {
        if (contracts['Bonds'][bond]['isLp']) {
            console.log('1111111');
            [swapTarget, swapData, amount] = await zapinLpData(bond, token, valueInWei, acceptedSlippage);
        } else {
            console.log('2222222222');
            [swapTarget, swapData, amount] = await zapinData(bond, token, valueInWei, acceptedSlippage, web3);
        }
        // console.log(swapTarget, swapData, amount);
    } catch (err) {
        console.log(err);
    }

    return [swapTarget,swapData,amount]
};


const zapinMint = async (bond, token, value, slippage, ohmFork='Wonderland') => {
    const contracts = contractsDetail[ohmFork]
    const provider = connectToProvider()
    const web3 = new Web3(provider)

    const [depositorAddress, _] = await web3.eth.getAccounts()

    const tokenContract = await subscribeToContract(token, web3, 'Reserves', ohmFork )
    const decimals = await tokenContract.methods.decimals().call()
    console.log('23333333');
    var valueInWei = Number(value) * Math.pow(10, decimals)
    // valueInWei = web3.utils.toBN(3285670)
    // valueInWei = 14592802
    valueInWei.toString()
    console.log(valueInWei);
    

    console.log('111111111');

    const [swapTarget,swapData,amount] = await calcZapinDetails( bond, token, valueInWei, slippage, web3);
        

        const acceptedSlippage = slippage / 100 || 0.02;

        const zapinContract = subscribeToContract('ZapIn', web3)

        const bondContract = subscribeToContract(bond, web3, 'Bonds', ohmFork)

        const calculatePremium = await bondContract.methods.bondPrice().call()
        const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));

        // const maxUint256 = web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        // console.log(amount);
        // console.log(zapinContract._address);
        // const tokenAllowance = await tokenContract.methods.allowance(depositorAddress,zapinContract._address).call()
        // console.log(tokenAllowance);
        // const approveTx = await tokenContract.methods.approve(zapinContract._address, maxUint256)
        // console.log(approveTx);

        // const approveResult = await sendTransaction(depositorAddress, approveTx, tokenContract._address,web3)
        // console.log(zapinContract);
        // 1152402992127630

        try {
            var gasPrice = await web3.eth.getGasPrice()

            try {
                if (contracts['Bonds'][bond]['isLp']) {
                    // console.log(contracts['Reserves'][token]['address'], bondContract._address, valueInWei, amount, swapTarget, swapData, true, maxPremium, depositorAddress);
                    var zapinData = await zapinContract.methods.ZapInLp(contracts['Reserves'][token]['address'], bondContract._address, web3.utils.toHex(valueInWei), web3.utils.toHex(amount), swapTarget, swapData, true, web3.utils.toHex(maxPremium), depositorAddress)
                } else {
                    var zapinData = await zapinContract.methods.ZapIn(contracts['Reserves'][token]['address'], bondContract._address, valueInWei, amount, swapTarget, swapData, maxPremium, depositorAddress);
                }
                const zapinResult = await sendTransaction(depositorAddress, zapinData, bondContract._address,web3)
            } catch (err) {
                console.log(err);
            }
           } catch (err) {
            console.log(err);
        } 
        // finally {
            
        // }
    }


// zapinData('Mim','Time','1','0.5')
// zapinLpData('MimTime','Time','1','0.5')
// calcZapinDetails('MimTime','Time','1','0.5')
// calcZapinDetails('Mim','Time','1','0.5')
// zapinMint('Mim','Time','1','0.5')
zapinMint('MimTime','Time','0.014592802','0.5')