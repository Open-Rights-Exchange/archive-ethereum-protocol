// This module defines the HTTP transport for exchanging ORE instruments
const fetch = require('node-fetch')

const AUTHORIZATION_HEADER = "Authorization"
const PROOFS_HEADER = "X-Open-Rights-Exchange-Proofs"

const buildHeaders = ({auth, proofs}) => {
  const headers = {'Content-Type': 'application/json'}

  if (auth) {
    headers[AUTHORIZATION_HEADER] = auth
  } else if (proofs) {
    headers[PROOFS_HEADER] = JSON.stringify(proofs)
  }

  return headers
}

exports.fetchWithProofs = async ({
  httpMethod,
  requestBody,
  endpoint,
  proofs,
  auth
}) => {
  const options =  {
    method: httpMethod,
    body: JSON.stringify(requestBody),
    headers: buildHeaders({auth, proofs})
  }
  return await fetch(endpoint, options).then(res => res.json())
}

// getProofs returns the proofs attached with an Express-style request `req`.
exports.getProofs = (req) => JSON.parse(req.header(PROOFS_HEADER))

const signatureForHeader = (signature) => JSON.stringify(signature)
const authorizationFromHeader = (req) => JSON.parse(req.header(AUTHORIZATION_HEADER))

exports.paymentChannelIDFromRequest = (req) => {
  const authorization = authorizationFromHeader(req)
  const channelId = authorization.channelId

  return channelId
}
