const cron = require('node-cron');
const {readFileSync} = require('fs')
const redeemJob = require('./redeemJob');


const init = (ohmFork) => {
    console.log(ohmFork);
    if (JSON.parse(readFileSync('./src/redeemJob/getDone.json'))['getdone'] === true){
        redeemJob(ohmFork)
    }
}

// TEST
cron.schedule('* * * * * *', () => init('Wonderland'))
init()


// wonderland: 22 - 6 - 14
// cron.schedule('54 21 * * *', () => init('Wonderland'))
// cron.schedule('54 5 * * *', () => init('Wonderland'))
// cron.schedule('54 13 * * *', () => init('Wonderland'))

// Fortress: 18 - 2 - 10
// cron.schedule('54 17 * * *', () => init('Fortress'))
// cron.schedule('54 1 * * *', () => init('Fortress'))
// cron.schedule('54 9 * * *', () => init('Fortress'))



