let config = require("./config.json")

const profileFor = (profile) => {
  const base = Object.assign({log: console.log}, config[profile])

  base.gatewayEndpoint = `${base.verifierEndpoint}/openchannel`
  base.verificationEndpoint = `${base.verifierEndpoint}/verify`
  base.claimEndpoint = `${base.verifierEndpoint}/claim`
  base.verifytokenEndpoint = `${base.verifierEndpoint}/verifytoken`

  base.voucherDescription = `right to call ${base.apiDescription}`
  base.offerDescription = `right to purchase a voucher for the ${base.voucherDescription}`

  return base
}

exports.profileFor = profileFor
