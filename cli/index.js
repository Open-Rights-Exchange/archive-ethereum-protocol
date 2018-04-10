const { profileFor } = require('./profile')
const { generate } = require('./generate')

const dump = (k, v) => {
  console.log(`${k}='${v}'`)
}

const run = async (profileDescriptor) => {
  let profile
  if (typeof profileDescriptor === 'string') {
    profile = profileFor(profileDescriptor)
  } else { // assume an object
    profile = profileDescriptor
  }

  const { context, offer, voucher } = await generate(profile)

  dump('CPU_CONTRACT_ADDRESS', profile.cpuContractAddress)
  dump('PAYMENT_CHANNEL_ADDRESS', profile.paymentChannelAddress)
  dump('HOLDER_ADDRESS', profile.holder)
  dump('VERIFIER_ADDRESS', profile.verifier)
  dump('OFFER_ADDRESS', profile.offerAddress)
  dump('VOUCHER_ADDRESS', profile.voucherAddress)
}

const profileDescriptor = process.env.ORE_PROFILE || 'local'

run(profileDescriptor)
