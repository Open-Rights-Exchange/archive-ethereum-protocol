const ethUtils = require('ethereumjs-util')
const address = require('./address')

const sign = async (web3, address, data) => {
  const hash = web3.sha3(data)

  const sig = await new Promise((resolve, reject) => {
    web3.eth.sign(address, hash, (err, result) => {
      resolve(result)
    })
  })

  const {v, r, s} = ethUtils.fromRpcSig(sig)

  return {
    v,
    r: '0x'+ r.toString('hex'),
    s: '0x' + s.toString('hex'),
    hash
  }
}
exports.sign = sign

const recover = ({v, r, s, hash}) => {
  const msgHash = ethUtils.hashPersonalMessage(ethUtils.toBuffer(hash))
  const publicKey = ethUtils.ecrecover(msgHash, v, ethUtils.toBuffer(r), ethUtils.toBuffer(s))
  return publicKey
}
exports.recover = recover

const verify = (signature, targetAddress) => {
  const recoveredAddress = address.fromPublicKey(recover(signature))
  return recoveredAddress === targetAddress
}
exports.verify = verify

const p = console.log
