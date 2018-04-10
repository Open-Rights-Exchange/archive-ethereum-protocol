const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const url = require('url')
const paymentchannel = require('payment-channel')

const { incrementer } = require('./incrementer-api')
const { instrument, verifier } = require("../src/index")

const getPath = (endpoint) => { return url.parse(endpoint).pathname}
const getPort = (endpoint) => url.parse(endpoint).port

const paymentInstance = (address, web3, databaseUrlVerifier) => {
  const paymentChannelInstance = new paymentchannel(address, web3, databaseUrlVerifier)
  return paymentChannelInstance
}

const startVerifier = async ({web3, ipfs, apiEndpoint, verificationEndpoint, verifier: verifierAddress, serverOnStart, databaseUrlVerifier, gatewayEndpoint, verifytokenEndpoint, claimEndpoint, issuer, paymentChannelAddress, cpuContractAddress, verifierPrivateKey: privateKey, context}, instrumentAddress) => {
  if (context === 'remote') { // use remote server
    return null
  }

  const paymentChannelInstanceVerifier = paymentInstance(verifierAddress, web3, databaseUrlVerifier)

  const handler = verifier.handlerFor(web3, ipfs, paymentChannelInstanceVerifier, privateKey)

  const gatewayHandler = verifier.gatewayHandle(paymentChannelInstanceVerifier)

  const tokenVerifierHandler = verifier.tokenVerifier(paymentChannelInstanceVerifier)

  const claimHandler = verifier.claimHandle(paymentChannelInstanceVerifier, verifierAddress)

  const app = express()

  app.use(logger('dev'))

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())

  const verifierPath = getPath(verificationEndpoint)
  const gatewayPath = getPath(gatewayEndpoint)
  const verifytokenPath = getPath(verifytokenEndpoint)
  const claimPath = getPath(claimEndpoint)

  app.post(verifierPath, handler)
  app.post(gatewayPath, gatewayHandler)
  app.get(verifytokenPath, tokenVerifierHandler)
  app.get(claimPath, claimHandler)

  const server = require('http').createServer(app);

  const port = getPort(verificationEndpoint)
  server.listen(port, serverOnStart)

  return server
}

exports.startVerifier = startVerifier
