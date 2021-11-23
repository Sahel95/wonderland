const Web3 = require('web3')
const connectToProvider = require('./connector')
const contracts = require('./constants/contractsDetail')


const subscribeToContract = (name, provider, poolType='', ohmFork='') => {
    let abi, address, contractDetail
    // const provider = connectToProvider()
    const web3 = new Web3(provider)
    if (ohmFork !== ''){
        contractDetail = contracts[ohmFork]
    }else{
        contractDetail = contracts
    }
    
    if (poolType === 'Reserves'){
        address = contractDetail['Reserves'][name]['address'];
        abi = contractDetail['Reserves'][name]['abi']
    } else if (poolType === 'Bonds') {
        address = contractDetail['Bonds'][name]['address'];
        abi = contractDetail['Bonds'][name]['abi']
    } else {
        address = contractDetail[name]['address'];
        abi = contractDetail[name]['abi']
    }


    const contract = new web3.eth.Contract(
        abi,
        address
    )
    

    // console.log(contract);

    // result = {
    //     web3,
    //     contract
    // }

    return contract
}

// subscribeToContract('LevisnwapV2Router02')

module.exports = subscribeToContract

