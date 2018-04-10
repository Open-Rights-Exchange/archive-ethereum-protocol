const { instrument } = require('../src/index')

const createAPICapability = async (voucher, {log, transactionParameters, web3, paymentChannelInstance}) => {
  try {
    const [ apiCapability ] = await instrument.exercise(voucher, {transactionParameters, web3, paymentChannelInstance})
    return apiCapability
  } catch (e) {
    log(e.message)
    return null
  }
}
exports.createAPICapability = createAPICapability
