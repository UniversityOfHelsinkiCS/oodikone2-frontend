var stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI);
const { getStudent, getMeta } = require('./doo_api_database_updater/updater_formatter')


console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
var opts = stan.subscriptionOptions();
opts.setManualAckMode(true);
opts.setAckWait(15 * 60 * 1000); // 15min
opts.setDeliverAllAvailable()
opts.setDurableName('durable')
opts.setMaxInFlight(3)

const handleMessage = async (priority) => async (msg) => { // :d
  let data = ''
  const message = msg.getData()
  if (!message) {
    console.log('undefined message')
    msg.ack()
    return
  }
  if (message === 'meta') {
    data = await getMeta()
    stan.publish('UpdateWrite', JSON.stringify(data))
    msg.ack()
    stan.publish('status', `${message}:FETCHED`, (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
  } else {
    // TODO: check that its a valid studentnumber and just ack it if its not
    data = await getStudent(message)
    try {
      // TODO: check that data is properly structured(?)
      stan.publish(priority ? 'PriorityWrite' :'UpdateWrite' , JSON.stringify(data), (err, guid) => {
        if (err) {
          return err
        } else {
          msg.ack()
          stan.publish('status', `${message}:FETCHED`, (err) => { if (err) console.log('STATUS PUBLISH FAIELD', err) })
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
}
stan.on('connect', async () => {

  const sub = stan.subscribe('UpdateApi', 'updater.workers', opts)
  const prioSub = stan.subscribe('PriorityApi', 'updater.workers.prio', opts)

  sub.on('message', await handleMessage(false))
  prioSub.on('message', await handleMessage(true))
})