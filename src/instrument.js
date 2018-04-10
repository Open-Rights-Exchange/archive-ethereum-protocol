const persistence = require('./persistence')
const right = require('./right')
const tagged = require('./tagged')
const hashFn = require('./hash').default
const contract = require('./contract')
const capability = require('./capability')
const condition = require('./condition')
const _ = require('lodash')
const p = console.log

const tap = (x) => { p(x); return x}

const bufferToHex = (buf) => '0x' + buf.toString('hex')

const createEitherInstrumentFactoryContract = (truffleContract) => async (instrument, contentHash, instrumentContentHash, {transactionParameters, web3, cpuContractAddress}) => {
  const { issuer } = instrument

  const [ instrumentRight ] = instrument.rights.map(tagged.data).filter(right.withCapability(capability.forInstrument()))
  let amount
  const smartContractCondition = instrumentRight.conditions
                                   .filter((c) => condition.equality(c, condition.forSmartContractExecution()))
                                   .map(tagged.data)
  if (smartContractCondition && smartContractCondition.length !== 0) {
    const condition = smartContractCondition[0]
    if (condition.transaction) {
      const transaction = condition.transaction
      amount = transaction.value
    }
  }

  const truffle = truffleContract(web3)

  return await truffle.new(issuer, bufferToHex(contentHash), bufferToHex(instrumentContentHash), amount ? amount : 0, cpuContractAddress, transactionParameters)
}
const createInstrumentFactoryWithTokenContract = createEitherInstrumentFactoryContract(contract.instrumentFactoryWithToken)
const createInstrumentFactoryContract = createEitherInstrumentFactoryContract(contract.instrumentFactory)

const createInstrumentContract = async (instrument, contentHash, {transactionParameters, web3}) => {
  const { holder, issuer } = instrument

  const truffle = contract.instrument(web3)

  return await truffle.new(issuer, holder, bufferToHex(contentHash))
}

const loadContract = (address, web3, contract) => {
  return contract(web3).at(address)
}

const loadInstrumentFactoryContract = (address, web3) => loadContract(address, web3, contract.instrumentFactory)
exports.loadInstrumentFactoryContract = loadInstrumentFactoryContract
const loadInstrumentContract = (address, web3) => loadContract(address, web3, contract.instrument)
exports.loadInstrumentContract = loadInstrumentContract

const hash = (data) => '0x' + hashFn(data).toString('hex')

const serialize = (instrument) => {
  const instrumentData = JSON.stringify(instrument)
  const data = {
    instrument: instrumentData,
    hash: hash(instrumentData)
  }

  return Buffer.from(JSON.stringify(data), 'utf8')
}

// returns an instrument in a form ready for human consumption
exports.inspect = tagged.inspect

const deserialize = (data) => {
  const {
    instrument: instrumentData,
    hash: instrumentHash
  } = JSON.parse(data.toString())

  if (hash(instrumentData) !== instrumentHash) {
    throw new Error('invalid instrument')
  }

  return JSON.parse(instrumentData)
}

const ensureHashesMatch = async (contract, contentHash) => {
  const newContentHash = await contract.contentHash()

  if (newContentHash !== contentHash) {
    throw new Error('error loading InstrumentFactory contract; hashes should match but did not')
  }
}

const hoistInstruments = (instrument) => {
  const { rights } = tagged.data(instrument)

  const children = rights.map(tagged.data).filter(right.withCapability(capability.forInstrument()))

  switch (children.length) {
    case 0:
      return [instrument]
    case 1:
      return [instrument, tagged.data(children[0].capability).instrument]
    default:
      throw new Error('library only supports up to 1 instrument child per instrument')
  }
}

const hasInstrumentChildren = (instrument) => hoistInstruments(instrument).length === 2

// decorate associates some properties that only exist at runtime (in `context`) in the `instrument`
const decorate = (instrument, context) => tagged.merge(instrument, context)

const at = async (address, {web3, ipfs}, contentHashHint) => {
  let _truffle = await loadInstrumentContract(address, web3)

  const contentHash = await _truffle.contentHash()

  // sanity check
  if (contentHashHint && (contentHash !== contentHashHint)) {
    throw new Error('the content hash logged in the Ethereum event did not match the hash loaded from the Truffle contract')
  }

  const data = await persistence.load(contentHash, {ipfs})

  const instrument = deserialize(data)

  // specialize the _truffle instance
  if (hasInstrumentChildren(instrument)) {
    _truffle = await loadInstrumentFactoryContract(address, web3)

    // sanity check
    await ensureHashesMatch(_truffle, contentHash)
  }

  return decorate(instrument, {contentHash, _truffle})
}
exports.at = at

const insertIntoStorage = async (instruments, {ipfs}) => {
  const storage = _.partial(_.flip(persistence.store), {ipfs})
  const storageOperations = instruments.map(serialize).map((serialization) => storage(serialization))
  return Promise.all(storageOperations)
}

const createInstrument = async (taggedInstrument, {transactionParameters, ipfs, web3, cpuContractAddress}) => {
  // NOTE: the children of the instrument may contain one instrument
  // We need to search for this child and if present create an instance of an InstrumentFactory
  const instruments = hoistInstruments(taggedInstrument)

  const contentHashes = await insertIntoStorage(instruments, {ipfs})

  const instrument = tagged.data(taggedInstrument)
  let _truffle
  switch (contentHashes.length) {
    case 2:
      _truffle = await createInstrumentFactoryWithTokenContract(instrument, contentHashes[0], contentHashes[1], {transactionParameters, web3, cpuContractAddress})
      break
    case 1:
      _truffle = await createInstrumentContract(instrument, contentHashes[0], {transactionParameters, web3})
      break
    default:
      throw new Error('library only supports up to 1 instrument child per instrument')
  }

  const contentHash = contentHashes[0]
  return decorate(taggedInstrument, {contentHash, _truffle})
}

exports.create = async (instrument, context) => await createInstrument(instrument, context)

const describe = (instrument) => tagged.withTags(instrument, 'instrument')

exports.describe = (options) => {
  const { description, rights, issuer, holder } = options

  const instrument = {
    description,
    rights,
    issuer,
    holder
  }

  return describe(instrument)
}

const backingContract = (instrument) => (tagged.data(instrument))._truffle
exports.backingContract = backingContract

// address returns the address of the smart contract backing the `instrument`.
exports.address = (instrument) => backingContract(instrument).address

exports.exercise = async (instrument, {web3, transactionParameters, cpuContractAddress, paymentChannelInstance}) => {
  const { rights, _truffle } = tagged.data(instrument)

  const exerciseOperations = rights.map((r) => right.exercise(r, {web3, transactionParameters, cpuContractAddress, paymentChannelInstance, contract: _truffle }))

  return Promise.all(exerciseOperations)
}

// returns the subset of attached rights that match the supplied criteria.
exports.searchRights = (instrument, criteria) => {
  const instruments = hoistInstruments(instrument)

  const { rights } = tagged.data(instrument)

  const results =  instruments.map((instrument) => tagged.data(instrument).rights.map(right.search(criteria)))
  return _.flatten(results.map(_.compact).filter(_.some))
}

// returns all direct instrument children of `instrument`
exports.extractChildren = (instrument) => {
  return hoistInstruments(instrument).slice(1)
}
