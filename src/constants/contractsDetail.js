const {readFileSync} = require('fs')

const contractsDetail = {
    StakingHelper  : {  //siavash stake
        address : '0x096BBfB78311227b805c968b070a81D358c13379',
        abi: JSON.parse(readFileSync('./src/constants/mine-abi/StakingHelper.json'))
    },
    TimeStaking : { //stake  & unstake
        address: '0x4456B87Af11e87E329AB7d7C7A246ed1aC2168B9',
        abi: JSON.parse(readFileSync('./src/constants/mine-abi/TimeStaking.json'))
    },
    
    MerkleDistributor : { //claim
        address: '0xFACA6B40DD0130b4Fc4f6b8E4501375E9b623a86',
        abi: JSON.parse(readFileSync('./src/constants/mine-abi/MerkleDistributor.json'))
    },
    TimeToken : {
        address: '0xb54f16fB19478766A268F172C9480f8da1a7c9C3',
        abi: JSON.parse(readFileSync('./src/constants/mine-abi/TimeToken.json'))
    },
    MEMOries : {
        address: '0x136Acd46C134E8269052c62A67042D6bDeDde3C9',
        abi: JSON.parse(readFileSync('./src/constants/mine-abi/MEMOries.json'))
    },
    
    Reserves: {
        Mim : {
            address: '0x130966628846BFd36ff31a822705796e8cb8C18D',
            abi: JSON.parse(readFileSync('./src/constants/mine-abi/MimToken.json'))
        },
        MimTime : {
            address: '0x113f413371fC4CC4C9d6416cf1DE9dFd7BF747Df',
            abi: JSON.parse(readFileSync('./src/constants/mine-abi/MimTime.json'))
        },
        WavaxTime: {
            address: '0xf64e1c5b6e17031f5504481ac8145f4c3eab4917',
            abi: JSON.parse(readFileSync('./src/constants/mine-abi/WavaxTime.json')) 
        },
        Wavax: {
            address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
            abi: JSON.parse(readFileSync('./src/constants/mine-abi/WavaxToken.json'))
        },
    },
    Bonds: {
        Mim : { //bond:deposit, redeem
            address: '0x694738E0A438d90487b4a549b201142c1a97B556',
            abi: JSON.parse(readFileSync('./src/constants/mine-abi/TimeBondDepository.json'))
        },
        MimTime: {
            address: '0xA184AE1A71EcAD20E822cB965b99c287590c4FFe',
            abi: JSON.parse(readFileSync('./src/constants/abi/bonds/MimTime.json'))
        },
        AvaxTime: {
            address: '0xc26850686ce755FFb8690EA156E5A6cf03DcBDE1',
            abi: JSON.parse(readFileSync('./src/constants/abi/bonds/AvaxTime.json'))
        },
        Wavax: {
            address: '0xE02B1AA2c4BE73093BE79d763fdFFC0E3cf67318',
            abi: JSON.parse(readFileSync('./src/constants/abi/bonds/Wavax.json'))
        }
    }

}

module.exports = contractsDetail