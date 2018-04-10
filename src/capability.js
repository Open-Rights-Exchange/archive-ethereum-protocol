const tagged = require('./tagged')
const instrument = require('./instrument')
const http = require('./http')

const performConstant = (capability, context) => capability.value

const performAPI = async (capability, requestBody) => {
  const {
    httpMethod,
    apiEndpoint,
    verificationEndpoint,
    proofs,
    contractAddress
  } = capability

  let auth
  if (verificationEndpoint) {
    auth = await http.fetchWithProofs({
      httpMethod: 'POST',
      endpoint: verificationEndpoint,
      requestBody: {
        apiEndpoint,
        voucherAddress: contractAddress
      },
      proofs
    })
  }

  return await http.fetchWithProofs({
    httpMethod,
    requestBody,
    endpoint: apiEndpoint,
    proofs: auth ? null : proofs,
    auth: auth ? auth : null
  })
}

const performInstrument = async ({instrument: _instrument, proofs}, {web3, ipfs, transactionParameters}) => {
  const [ { value: { transactionHash, abi, address: contractAddress }} ] = proofs.filter((proof) => proof.for === 'smartContractExecution')

  const { from } = transactionParameters

  const instrumentContract = web3.eth.contract(abi).at(contractAddress)

  const eventFilter = instrumentContract.InstrumentCreated({
    issuer: _instrument.issuer,
    holder: from
  }, { fromBlock: 0 })

  const events = await new Promise((resolve, reject) => {
    eventFilter.get((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })

  const [ event ] = events.filter((event) => event.transactionHash === transactionHash)

  if (!event) {
    throw new Error('could not find the requested instrument creation')
  }

  const address = event.args.instrument

  return instrument.at(address, {web3, ipfs})
}

const types = Object.freeze({
  constant: {
    name: "constant",
    perform: performConstant
  },
  api: {
    name: "api",
    perform: performAPI
  },
  instrument: {
    name: "instrument",
    perform: performInstrument
  }
})

const describe = (capability, type) => tagged.withTags(capability, 'capability', type)

exports.forConstant = (value) => describe({value}, types.constant)

exports.forAPI = (capability) => describe(capability, types.api)

exports.forInstrument = (instrument) => describe({instrument}, types.instrument)

exports.decorate = tagged.merge

exports.perform = (capability, context) => tagged.dispatch(capability, context, types, "perform")

exports.equality = tagged.equality
