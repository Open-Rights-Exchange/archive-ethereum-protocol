const { instrument, capability } = require('../src/index')

const createOrLoadVoucher = async (offerAddress, profile) => {
  if (profile.voucherAddress) {
    profile.log('loading voucher...')
    return await instrument.at(profile.voucherAddress, profile)
  }

  profile.log('creating voucher...')
  const offer = await instrument.at(offerAddress, profile)

  const [ voucherCapability ] = await instrument.exercise(offer, {
    web3: profile.web3,
    transactionParameters: profile.transactionParameters,
    cpuContractAddress: profile.cpuContractAddress
  })

  const voucher = await capability.perform(voucherCapability, {
    web3: profile.web3,
    ipfs: profile.ipfs,
    transactionParameters: profile.transactionParameters
  })

  // this is for inspection later, can safely ignore
  profile.voucherAddress = instrument.address(voucher)

  return voucher
}
exports.createOrLoadVoucher = createOrLoadVoucher
