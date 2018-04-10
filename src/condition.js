const tagged = require('./tagged')
const instrument = require('./instrument')
const cpuABI = require('../build/contracts/CPU.json')
const { truffleFor } = require('./contract')
const { sign, verify } = require('./signature')

const proveConstant = (condition, context) => condition
const verifyConstant = (condition, {proof}) => condition === proof

const provePaymentApproval = async (condition, {web3, transactionParameters, cpuContractAddress, contract}) => {
  const { approvalAmount, paymentType } = condition

  if (paymentType !== 'CPU') {
    throw new Error('currently only approving transfer of CPU is supported')
  }

  const cpu = truffleFor(cpuABI, web3).at(cpuContractAddress)

  const result = await cpu.approve(contract.address, approvalAmount, transactionParameters)

  const { tx: txnHash, receipt: { status }} = result

  if (parseInt(status, 16) !== 1) {
    throw new Error('could not approve CPU transfer')
  }

  return Object.assign(condition, {txnHash})
}

const verifyPaymentApproval = async (condition, {proof, web3}) => {
  throw new Error('sorry, not implemented yet; expected usage should not need this functionality')
}

const provePaymentChannel = async(condition, {web3, transactionParameters, paymentChannelInstance}) => {
  const { from } = transactionParameters
  const {
    receiver,
    amountPerCall,
    depositAmount,
    gateway
  } = condition

  const channel = paymentChannelInstance.openChannel(receiver, amountPerCall, depositAmount, gateway)

  const {token, channelId, verifier, client, value, contract} = await channel

  return {
    token,
    channelId,
    verifier,
    client,
    value,
    contract
  }
}

const verifyPaymentChannel = async (condition, {proof: {value}, paymentChannelInstanceVerifier}) => {
  const {channelId} = value

  if (channelId) {
    return await paymentChannelInstanceVerifier.getState(channelId)
  }
  throw new Error('invalid channel id for payment channel')
}


const proveMatchingHolder = async (_condition, {web3, transactionParameters, contract}) => {
  const condition = Object.assign(_condition, {instrumentAddress: contract.address})

  const holder = await contract.holder()

  const msg = JSON.stringify(condition)

  const signature = await sign(web3, holder, msg)

  return Object.assign(condition, {signature})
}

const verifyMatchingHolder = async ({message}, {proof: {value}, instrumentContract, web3}) => {
  if (message !== MATCHING_HOLDER_MESSAGE) {
    throw new Error('the incoming data to verify the holder is not as expected')
  }

  const { signature, instrumentAddress } = value

  const holder = await instrumentContract.holder()

  return verify(signature, holder)
}

const proveSmartContractExecution = async (condition, context) => {
  const { contract, transactionParameters } = context
  const { methodName } = condition

  const result = await contract[methodName](transactionParameters)

  const proof = {
    transactionHash: result.tx,
    abi: contract.abi,
    address: contract.address
  }
  return proof
}

const verifySmartContractExecution = async (condition, {proof}) => {
  throw new Error('not implemented, current common usage should not need this functionality')
}

const types = Object.freeze({
  constant: {
    name: "constant",
    prove: proveConstant,
    verify: verifyConstant
  },
  paymentApproval: {
    name: "paymentApproval",
    prove: provePaymentApproval,
    verify: verifyPaymentApproval,
  },
  paymentChannel: {
    name: "paymentChannel",
    prove: provePaymentChannel,
    verify: verifyPaymentChannel,
  },
  matchingHolder: {
    name: "matchingHolder",
    prove: proveMatchingHolder,
    verify: verifyMatchingHolder
  },
  smartContractExecution: {
    name: "smartContractExecution",
    prove: proveSmartContractExecution,
    verify: verifySmartContractExecution
  }
})

const describe = (condition, type) => tagged.withTags(condition, 'condition', type)

// forConstant represents the requirement that a constant value be transmitted from prover to verifier, like an identity combinator
exports.forConstant = (value) => describe({value}, types.constant)

exports.forPaymentApproval = (options) => {
  const condition = options

  return describe(condition, types.paymentApproval)
}

exports.forPaymentChannel = (options) => {
  const condition = options

  return describe(condition, types.paymentChannel)
}

const MATCHING_HOLDER_MESSAGE = "Signed for Open Rights Exchange Protocol"

exports.forMatchingHolder = () => {
  const condition = {
    message: MATCHING_HOLDER_MESSAGE
  }

  return describe(condition, types.matchingHolder)
}

exports.forSmartContractExecution = (options) => {
  const condition = options

  return describe(condition, types.smartContractExecution)
}

exports.prove = (condition, context) => tagged.dispatch(condition, context, types, "prove")

exports.verify = (condition, context) => tagged.dispatch(condition, context, types, "verify")

exports.equality = tagged.equality

exports.properties = tagged.data
