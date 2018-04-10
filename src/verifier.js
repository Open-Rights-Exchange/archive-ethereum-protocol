const { verify } = require('./right')
const capability = require('./capability')
const instrument = require('./instrument')
const tagged = require('./tagged')
const { getProofs } = require('./http')
const { performMatchingHolder } = require('./condition')
const signature = require('./signature')
const url = require('url')
const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')

const parsePath = (endpoint) => url.parse(endpoint).pathname
const sendAccessProof = (proofs) => {
  for (let proof of proofs) {
    if (proof.for == "paymentChannel") {
      const value = proof.value
      const token = value.token
      const channelId = value.channelId

      return {token, channelId}
    }
  }
}

const getStatus = async(verifytokenEndpoint, accessToken) => {
  let response = await fetch(verifytokenEndpoint, {
    headers: {
      authorization: accessToken
    }
  })

  return response.json()
}


const Web3 = require('web3')
const sha3 = new Web3().sha3

const eventSignature = "InstrumentCreated(address,address,address,bytes32)"
const topicName = sha3(eventSignature)

// returns the address of the offer instrument contract
const getAddressOfParent = async (web3, voucherAddress) => {

  const voucherAddressAsBytes32 = '0x' + '0'.repeat(24) + voucherAddress.slice(2)

  const filter = web3.eth.filter({
    fromBlock: 0,
    topics: [topicName, null, null, voucherAddressAsBytes32]
  })

  const [ result ] = await new Promise((resolve, reject) => {
    filter.get((err, logs) => {
      if (err) {
        reject(err)
      } else {
        resolve(logs)
      }
    })
  })

  // this should be the offer address
  return result.address
}

// main handler for the verifier to verify an incoming set of client proofs
exports.handlerFor = (web3, ipfs, paymentChannelInstanceVerifier, privateKey) => {
  // this map caches voucher instrument lookups by address
  const voucherCache = {}

  return async (req, res, next) => {
    const { voucherAddress, apiEndpoint } = req.body

    let voucher
    const cachedVoucher = voucherCache[voucherAddress]
    if (cachedVoucher) {
      voucher = cachedVoucher
    } else {
      voucher = await instrument.at(voucherAddress, {web3, ipfs})
      voucherCache[voucherAddress] = voucher
    }

    const [ right ] = instrument.searchRights(voucher, capability.forAPI({apiEndpoint}))
    const { capability: taggedCapability } = tagged.data(right)
    const cap = tagged.data(taggedCapability)

    const proofs = getProofs(req)

    const verified = await verify(right, proofs, {web3, instrumentContract: instrument.backingContract(voucher), paymentChannelInstanceVerifier: paymentChannelInstanceVerifier})
    if (verified) {
      const offerAddress = await getAddressOfParent(web3, instrument.address(voucher))
      const { token, channelId }  = await sendAccessProof(proofs)

      const payload = {
        accessToken: token,
        channelId,
        offerAddress
      }
      const jwtToken = jwt.sign(payload, privateKey, {
        algorithm: 'ES256',
        expiresIn: '10s'
      })
      res.json(jwtToken)
    } else {
      res.status(401).json({error: new Error('right is not satisifed by the supplied proof')})
    }
  }
}

// accepts payment from API client
exports.gatewayHandle = (paymentChannelInstanceVerifier) => {
  return async(req, res, next) => {

    try {
      const body = await paymentChannelInstanceVerifier.acceptPayment(req.body)
      res.status(202).header('Paywall-Token', body.token).send(body)
    } catch (e) {
      res.status(401).json({ status: 'payment is invalid', error: e})
    }
  }
}

// verifies if access token with the request is valid or not
exports.tokenVerifier = (paymentChannelInstanceVerifier) => {
  return async(req, res, next) => {

    try{
      const token = req.get('authorization')
      await paymentChannelInstanceVerifier.acceptToken(token)
      res.status(200).send({status: 'ok'})
    } catch (e) {
      res.status(401).json({ status: 'token is invalid', error: e})
    }
  }
}

// lets the provider claim the channel
exports.claimHandle = (paymentChannelInstanceVerifier, verifier) => {
  return async(req, res, next) => {

    try{
      const holder = req.get('holder')
      const issuer = req.get('issuer')
      const channelId = await paymentChannelInstanceVerifier.getChannelId(holder, verifier)
      await paymentChannelInstanceVerifier.close(channelId, issuer)
      res.status(200).send({ status: 'Claimed' })
    }
    catch (e){
      res.status(401).json({error: new Error('Payment channel cannot be claimed')})
    }
  }
}

exports.middlewareDecodesJWT = (publicKey) => {
  return async (req, res, next) => {
    const token = req.get('Authorization')

    try {
      const payload = jwt.verify(token, publicKey, {
        algorithms: ["ES256"]
      })
      req.openRightsExchangeTokenPayload = payload
      next()
    } catch (e) {
      res.status(401).json({message: "unauthorized"})
    }
  }
}

exports.middlewareMatchesInstrumentAddress = (targetAddress) => {
  return async(req, res, next) => {
    const { offerAddress } = req.openRightsExchangeTokenPayload

    if (offerAddress !== targetAddress) {
      res.status(401).json({message: 'unauthorized'})
      return
    }
    next()
  }
}

// middleware for API server to accept payment channel access token and get it verified by the verifier (acting as payment channel server)
exports.middlewareExpectsPaymentChannelToken = (verifytokenEndpoint) => {
  return async(req, res, next) => {
    const { accessToken } = req.openRightsExchangeTokenPayload

    if(accessToken) {
      const response = await getStatus(verifytokenEndpoint, accessToken)
      if (response.status === 'ok') {
        next()
        return
      } else {
        res.status(401).json({error: new Error('Access token is invalid')})
      }
    } else {
      res.status(402).json({error: new Error('Access token not present in the request')})
    }
  }
}
