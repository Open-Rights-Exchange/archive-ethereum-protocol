const InstrumentContractABI = require('../build/contracts/Instrument.json')
const InstrumentFactoryContractABI = require('../build/contracts/InstrumentFactory.json')
const InstrumentFactoryWithTokenContractABI = require('../build/contracts/InstrumentFactoryWithToken.json')
const CPUABI = require('../build/contracts/CPU.json')
const PaymentChannelABI = require('../build/contracts/TokenUnidirectional.json')

exports.abi = {
  instrument: InstrumentContractABI,
  instrumentFactory: InstrumentFactoryContractABI,
  instrumentFactoryWithToken: InstrumentFactoryWithTokenContractABI,
  cpu: CPUABI,
  paymentChannel: PaymentChannelABI
}

const truffle = require('truffle-contract')

const truffleFor = (abi, web3) => {
  const contract = truffle(abi)

  contract.setProvider(web3.currentProvider)
  return contract
}
exports.truffleFor = truffleFor

exports.instrument = (web3) => truffleFor(InstrumentContractABI, web3)

exports.instrumentFactory = (web3) => truffleFor(InstrumentFactoryContractABI, web3)

exports.instrumentFactoryWithToken = (web3) => truffleFor(InstrumentFactoryWithTokenContractABI, web3)
