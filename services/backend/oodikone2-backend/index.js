require('./src/app')

process.on('unhandledRejection', reason => {
  console.log(reason)
})
