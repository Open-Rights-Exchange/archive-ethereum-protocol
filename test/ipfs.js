const crypto = require('crypto')
const { hashToBytes, bytesToBase58 } = require('../dist/persistence')

const storage = {}

exports.mockIPFS = {
  add: (msg, cb) => {
    const hash = crypto.createHash('sha256')
    hash.update(msg)
    const contentHash = hash.digest()
    const identifier = bytesToBase58(contentHash)
    storage[identifier] = msg
    cb(null, identifier)
  },
  cat: (address, cb) => {
    cb(null, storage[address])
  }
}
