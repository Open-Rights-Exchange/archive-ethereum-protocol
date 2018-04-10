const hash = require('./hash').default
const ipfs_util = require('./ipfs')
const multihash = require('multihashes')

// convert the hash returned from IPFS base58 encoded hash to bytes32
const getbyte32Hash = (ipfshash) => {

  const multihsh58 = multihash.fromB58String(ipfshash)

  const multihsh = multihash.decode(multihsh58)

  return multihsh.digest
}
exports.hashToBytes = getbyte32Hash

const isHexString = (obj) => {
  if (typeof obj !== 'string') {
    return false
  }

  if (obj.indexOf('0x') !== 0) {
    return false
  }

  return obj
}

const codeForIPFSDefaultMultihash = 'sha2-256'

// convert the hash stored in the contract from bytes32 to bs58 multihash
const getbase58Hash = (digest) => {
  if (isHexString(digest)) {
    digest = new Buffer(digest.slice(2), 'hex')
  }

  const multihshdigest = multihash.encode(digest, codeForIPFSDefaultMultihash)

  const b58String = multihash.toB58String(multihshdigest)

  return b58String
}
exports.bytesToBase58 = getbase58Hash

// `store` takes an object with  Buffer `data` and ipfs node config. It writes the data to a persistent store. Returns a Promise yielding the data's hash as a byte32 buffer which serves as the key to retrieve the object later.
exports.store = async (data, {ipfs}) => ipfs_util.addToIPFS(ipfs, data).then(getbyte32Hash)

// `load` takes in an object with the `hash` of some data written to a persistent store with `store` and ipfs node config.
// Returns a Promise yielding a Buffer containing the data.
exports.load = async (contentHash, {ipfs}) => new Promise((resolve, reject) => {
  const ipfsHash = getbase58Hash(contentHash)

  ipfs_util.getFromIPFS(ipfs, ipfsHash).then((ipfsData) => Buffer.from(ipfsData, 'utf8')).then(resolve)
})
