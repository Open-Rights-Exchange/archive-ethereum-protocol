const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const address = require('../src/address')
const http = require('../src/http')
const url = require('url')
const { incrementer } = require('./incrementer-api')
const { instrument, verifier, capability } = require("../src/index")

const buildServer = (endpoint, handler, ...middlewares) => {
  const app = express()

  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())

  for (let middleware of middlewares) {
      app.use(middleware)
  }

  const path = url.parse(endpoint).pathname
  app.post(path, handler)

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.json({
      message: err.message,
      error: err
    })
  })

  return app
}

const getPort = (endpoint) => url.parse(endpoint).port

const startServer = async ({web3, ipfs, verifierPublicKey, apiEndpoint, verifier: verifierAddress, verifierEndpoint, verifytokenEndpoint, claimEndpoint, serverOnStart, context}, instrumentAddress) => {
  if (context === 'remote') { // use remote server
    return null
  }

  const handler = (req, res) => {
    res.json({x: incrementer(req.body.x)})
  }

  const jwtMiddleware = verifier.middlewareDecodesJWT(verifierPublicKey)
  const addressMiddleware = verifier.middlewareMatchesInstrumentAddress(instrumentAddress)
  const acceptTokenMiddleware = verifier.middlewareExpectsPaymentChannelToken(verifytokenEndpoint)

  const app = buildServer(apiEndpoint, handler, jwtMiddleware, addressMiddleware, acceptTokenMiddleware)

  const server = require('http').createServer(app);
  const port = getPort(apiEndpoint)
  server.listen(port, serverOnStart)

  return server
}
exports.startAPIServer = startServer
