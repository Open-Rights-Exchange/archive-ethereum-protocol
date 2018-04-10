const ethUtils = require('ethereumjs-util')

const fromPublicKey = (pubkey) => '0x' + ethUtils.setLength(ethUtils.fromSigned(ethUtils.publicToAddress(pubkey)), 20).toString('hex')

exports.fromPublicKey = fromPublicKey
