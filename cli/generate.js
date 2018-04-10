const { instrument } = require('../src/index')

const { setup } = require('./setup')

const { createOrLoadOffer } = require('./offer')

const { createOrLoadVoucher } = require('./voucher')

// generate takes a profile in the format of those in `./profile.js` returns the protocol context, the offer instrument object and the voucher instrument object
const generate = async (profile) => {
  const context = await setup(profile)

  const offer = await createOrLoadOffer(context)

  // we pass the offer address here to emulate a more realistic situation where the voucher is created at some later point when the offer object is not necessarily around
  const voucher = await createOrLoadVoucher(instrument.address(offer), context)

  return { context, offer, voucher }
}
exports.generate = generate
