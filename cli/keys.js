// creates a secp256r1 keypair for use with the verifier

const EC = require('elliptic').ec
const ec = new EC('p256')

const KeyEncoder = require('key-encoder')
const encoderOptions = {
  // https://www.ietf.org/rfc/rfc5480.txt
  curveParameters: [1, 2, 840, 10045, 3, 1, 7],
  privatePEMOptions: {label: 'EC PRIVATE KEY'},
  publicPEMOptions: {label: 'PUBLIC KEY'},
  curve: ec
}
const keyEncoder = new KeyEncoder(encoderOptions)

const createKeyPair = () => {
  const keys = ec.genKeyPair()

  const privateKey = keys.priv.toString(16)
  const publicKey = keys.getPublic().encode('hex')

  const pemPrivateKey = keyEncoder.encodePrivate(privateKey, 'raw', 'pem')
  const pemPublicKey = keyEncoder.encodePublic(publicKey, 'raw', 'pem')

  return {
    privateKey: pemPrivateKey,
    publicKey: pemPublicKey
  }
}
exports.createKeyPair = createKeyPair
