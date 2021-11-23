const cron = require('node-cron');

const redeemJob = require('./redeemJob')


// Redeem time every 8 hr
cron.schedule('* * 8 * * *', () => redeemJob('Wonderland'))

// Redeem time every 8 hr
cron.schedule('* * 8 * * *', () => redeemJob('Fortress'))