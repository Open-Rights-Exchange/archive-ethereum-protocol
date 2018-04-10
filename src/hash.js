// the default function of this module returns the Keccak256 hash (used in Ethereum) of the bytes associated with the `buffer` object.
const keccak256 = require('js-sha3').keccak256;

//returns a buffer with hash
exports.default = (bufferdata) => {

  if (typeof bufferdata === 'string') {

    const buffer = Buffer.from(bufferdata, 'utf8')

    const hash = keccak256(buffer)

    return Buffer.from(hash, 'utf8')
  }

  else {

    const hash = keccak256(bufferdata)

    return Buffer.from(hash, 'utf8')
  }
}
