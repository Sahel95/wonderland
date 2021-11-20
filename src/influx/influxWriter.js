const {InfluxDB, Point, HttpError} = require('@influxdata/influxdb-client')
const {url, token, org, bucket} = require('./client')
const {hostname} = require('os')

const influxWriter = async (bond, discount) => {
    const tableName = `${bond}`

    const client = new InfluxDB({
        url: url,
        token: token
    })  
    
    const writeApi = client.getWriteApi(org, bucket)
    writeApi.useDefaultTags({ host: 'host1' })
    const point = new Point(tableName)
    // .tag('price', price)
    .floatField('discount', discount)
    .timestamp(new Date())
    writeApi.writePoint(point)
    
    await writeApi
        .close()
        .then( () => {
            console.log('Influx FINISHED');
        })
        .catch( e => {
            console.error(e);
            console.log('Influx Finished ERROR');
        })
    return
}

// influxWriter(122, 220, 'ss', 'rtyui')

module.exports = influxWriter

