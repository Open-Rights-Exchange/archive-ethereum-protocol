const { instrument, right, condition, capability } = require('../src/index')

const createOrLoadOffer = async (profile) => {
  if (profile.offerAddress) {
    profile.log('loading offer...')
    return await instrument.at(profile.offerAddress, profile)
  }

  profile.log('creating offer...')
  const offer = await createOffer(profile)

  // this is for inspection later, can safely ignore
  profile.offerAddress = instrument.address(offer)

  return offer
}
exports.createOrLoadOffer = createOrLoadOffer

const createOffer = async (profile) => {
  const {
    apiDescription,
    depositAmount,
    amountPerCall,
    issuer,
    verifier,
    gatewayEndpoint,
    verifytokenEndpoint,
    apiEndpoint,
    verificationEndpoint,
    httpMethod,
    voucherDescription,
    offerDescription,
    offerAmount,
    cpuContractAddress,
    web3,
    transactionParameters,
    ipfs,
    offerAddress
  } = profile

  const apiEndpointRight = right.describe({
    description: apiDescription,
    conditions: [
      condition.forPaymentChannel({
        depositAmount,
        paymentType: 'CPU',
        amountPerCall,
        receiver: verifier,
        gateway: gatewayEndpoint,
        verifytokenEndpoint,
        provider: issuer
      })
    ],
    capability: capability.forAPI({
      apiEndpoint,
      verificationEndpoint,
      verifier,
      httpMethod
    })
  })

  const voucher = instrument.describe({
    description: voucherDescription,
    rights: [ apiEndpointRight ],
    issuer,
  })

  let offerConditions
  if (offerAmount) {
    offerConditions = [
      condition.forPaymentApproval({
        approvalAmount: offerAmount,
        paymentType: 'CPU'
      }), // NOTE: required to approve before we can perform the required actions for the next condition
      condition.forSmartContractExecution({
        methodName: "accept",
        transaction: {
          value: offerAmount // CPU
        }
      })
    ]
  } else {
    offerConditions = [
      condition.forSmartContractExecution({
        methodName: "accept",
      })
    ]
  }

  const voucherCreationRight = right.describe({
    conditions: offerConditions,
    capability: capability.forInstrument(voucher)
  })

  const offer = instrument.describe({
    description: offerDescription,
    rights: [ voucherCreationRight ],
    issuer,
    holder: issuer
  })

  // this is for inspection later, can safely ignore
  profile.staticOfferData = offer

  return instrument.create(offer, {
    web3,
    transactionParameters,
    cpuContractAddress,
    ipfs
  })
}
exports.createOffer = createOffer
