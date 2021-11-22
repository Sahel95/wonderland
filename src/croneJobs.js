const cron = require('node-cron');

const redeemJob = require('./redeemJob')


// Redeem every 8 hr
cron.schedule('* * 8 * * *', redeemJob)