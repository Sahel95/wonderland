const connectToProvider = require('./connector')
const {sendTransaction, deposit} = require('./methods.js')
const subscribeToContract = require('./subscribeToContract');
const getBondDiscount = require('./bondDiscount')
const Web3 = require('web3');


const bonds = require('./constants/bonds');
const contractsDetail = require('./constants/contractsDetail');


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const bigIntMax = ( ...args ) => args.reduce((m, e) => e > m ? e : m);

const init = async () => {
    let discount, tokenContract, amount,
    paths, amountIn, amountsOut, amountOutMin, swapData, swapReceipt, bondContract,
    value, bondDetails, interestDue, pendingPayout, bondDiscounts=[],
    approveData
    const fork = 'Wonderland'
    contracts = contractsDetail[fork]

    // TODO
    const slippage = 0.5
    try {
        while(true){
            const provider = connectToProvider()
            const web3 = new Web3(provider)
            const [admin, _] = await web3.eth.getAccounts()

            const routerContract = await subscribeToContract('JoeRouter', web3)
            const memoContract = await subscribeToContract('Memo', web3)
            const timeContract = await subscribeToContract('Time', web3, 'Reserves',fork)
            const stakingContract = await subscribeToContract('Staking', web3, '', fork)

            var memoBalance = await memoContract.methods.balanceOf(admin).call()
            var beforeTimeBalance = await timeContract.methods.balanceOf(admin).call()
            console.log('TimeBalance', beforeTimeBalance);
            
            
            for (const bond of bonds[fork]){
                if(!contracts['Bonds'][bond]['isLp']){
                    discount = await getBondDiscount(bond, web3, fork)
                    console.log(bond, discount);
                    // if ( discount>= 0.08) { // **********************************//
                    if ( true) {
                        let obj={}
                        obj[bond]=discount
                        bondDiscounts.push(obj)
                    }
                }
            }

            console.log(bondDiscounts);

            var size = Object.keys(bondDiscounts).length;
            console.log('111111111111111111111',bondDiscounts);
            if ( size > 0 ){
                // TODO
                bondDiscounts.sort( function ( a, b ) { return b.bond - a.bond; } );
                console.log('22222222222222222222', bondDiscounts);
                for (const item of bondDiscounts){
                    var bond = Object.keys(item)[0]
                    console.log(bond);
                    
                    //check current bond
                    bondContract = await subscribeToContract(bond, web3, 'Bonds', fork)
                    bondDetails = await bondContract.methods.bondInfo(admin).call()
                    interestDue = bondDetails.payout
                    pendingPayout = await bondContract.methods.pendingPayoutFor(admin).call();
                    if (interestDue > 0 || pendingPayout > 0){
                        console.log(`You have an existing ${bond} mint.`);
                    } else {
                        //memo to time
                        memoToTimeData = stakingContract.methods.unstake(memoBalance, true) 
                        memoToTimeReceipt = await sendTransaction(admin, memoToTimeData, stakingContract._address, web3)
                        var afterTimeBalance = await timeContract.methods.balanceOf(admin).call()

                        // TODO: MIN amount>4000$:ke masalan 4% ee ke ezafe migirim beshe 160$ 

                        amountIn = afterTimeBalance - beforeTimeBalance
                        tokenContract = await subscribeToContract(bond, web3, 'Reserves', fork)

                        // swap Time to bond token
                        approveData = await tokenContract.methods.approve(routerContract._address, amountIn)
                        approveReceipt = await sendTransaction(admin, approveData, tokenContract._address, web3)

                            // TODO: wait until receipt
                            // while(true){
                            //     var approveStatus = await web3.eth.getTransactionReceipt(approveReceipt)
                            //     if(approveStatus === true){
                            //         break
                            //     }
                            // }
                            
                            const anotherToken = {
                                Wavax : 'Mim',
                                Mim: 'Wavax'
                            }

                            
                            paths = [
                                [timeContract._address ,tokenContract._address],
                                [timeContract._address, contracts['Reserves'][anotherToken[bond]]['address'] ,tokenContract._address]
                            ]

                            // TEST
                            amountIn = beforeTimeBalance
                            console.log(amountIn);

                            let obj = {}
                            for (const route of paths){
                                var length = route.length
                                amountsOut = await routerContract.methods.getAmountsOut(amountIn, route).call()
                                obj[amountsOut[length-1]] = route
                            }
                            amountsOut = bigIntMax(Object.keys(obj)[0],Object.keys(obj)[1])
                            var path = obj[amountsOut]
                            console.log(amountsOut);

                            amountOutMin = web3.utils.toBN(amountsOut)
                                .mul(web3.utils.toBN(90))
                                .div(web3.utils.toBN(100));

                            console.log(web3.utils.toHex(amountIn), web3.utils.toHex(amountOutMin), path, admin, Math.floor((Date.now() / 1000)) + 60 * 10);

                            swapData = await routerContract.methods.swapExactTokensForTokens(
                                web3.utils.toHex(amountIn),
                                web3.utils.toHex(amountOutMin),
                                path,
                                admin,
                                web3.utils.toHex(Math.floor((Date.now() / 1000)) + 60 * 10)
                            )
                            var beforTokenBalance = await tokenContract.methods.balanceOf(admin).call()
                            swapReceipt = await sendTransaction(admin, swapData, routerContract._address, web3)
                            // TODO: get value from swapReceipt
                            var afterTokenBalance = await tokenContract.methods.balanceOf(admin).call()
                            value = afterTokenBalance - beforTokenBalance

                            // 2. deposit token
                            await deposit(admin, fork, value, bond, web3, slippage, true)
                            
                    } 
                }
            }
            await delay(4*60*1000)
        }
    } catch (error) {
        console.log('error:',error)
        // init()
    }
}

init()