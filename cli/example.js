const { instrument, capability } = require('../src/index')
const { profileFor } = require('./profile')
const { generate } = require('./generate')
const { startVerifier } = require('./verifier')
const { startAPIServer } = require('./api-server')
const { createAPICapability } = require('./client')

const fetch = require('node-fetch')

const cpuBalance = async (cpu, address) => {
  return await cpu.balanceOf(address)
}

const claim = async (holder, issuer,claimEndpoint) => {
  await fetch(claimEndpoint, {
    headers: {
      holder: holder,
      issuer: issuer,
    }
  })
}

const run = async (profileDescriptor) => {
  let profile
  if (typeof profileDescriptor === 'string') {
    console.log(`running as profile: ${profileDescriptor}`)
    profile = profileFor(profileDescriptor)
  } else { // assume an object
    console.log(`running as profile: <custom>`)
    profile = profileDescriptor
  }

  const { context, offer, voucher } = await generate(profile)

  // set these for machinomy library
  process.env.CONTRACT_ADDRESS = context.paymentChannelAddress
  process.env.ERC20CONTRACT_ADDRESS = context.cpuContractAddress

  const { holder, issuer, cpu, claimEndpoint } = context

  const holderBalance = await cpuBalance(cpu, holder)
  context.log(`starting balance for holder ${holder}: ${holderBalance}`)

  const issuerBalance = await cpuBalance(cpu, issuer)
  context.log(`starting balance for issuer ${issuer}: ${issuerBalance}`)

  context.log('starting verifier...')
  const verifierServer = startVerifier(context)

  context.log('starting API server...')
  const apiServer = startAPIServer(context, instrument.address(offer))

  context.log('creating API client...')
  const apiCapability = await createAPICapability(voucher, context)

  context.log('sending API request:')
  const request = {x: 1}
  context.log(JSON.stringify(context.request, null, 2))

  const response = await capability.perform(apiCapability, context.request)
  context.log("the API responded:")
  context.log(JSON.stringify(response, null, 2))

  // claim balance
  await claim(holder, issuer, claimEndpoint)
  const finalHolderBalance = await cpuBalance(cpu, holder)
  context.log(`ending balance for holder ${holder}: ${finalHolderBalance}`)

  const finalIssuerBalance = await cpuBalance(cpu, issuer)
  context.log(`ending balance for issuer ${issuer}: ${finalIssuerBalance}`)

  if (context.contex === 'local') {
    verifierServer.close()
    apiServer.close()
  }

  return
}

const profileDescriptor = process.env.ORE_PROFILE || "localProfile"

run(profileDescriptor).then(process.exit)
