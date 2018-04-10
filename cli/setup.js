const { createKeyPair } = require('./keys')
const PaymentChannel = require('payment-channel')
const { truffleFor } = require('../src/contract')

const Web3 = require('web3')

const cpuABI = require('../build/contracts/CPU.json')
const ecRecoveryABI = require('../build/contracts/ECRecovery.json')
const paymentChannelABI = require('../build/contracts/TokenUnidirectional.json')

const deployCPU = ({web3, transactionParameters}) => {
  const cpuContract = truffleFor(cpuABI, web3)
  return cpuContract.new(transactionParameters)
}

const deployECRecovery = ({web3, transactionParameters}) => {
  const ecRecoveryContract = truffleFor(ecRecoveryABI, web3)
  return ecRecoveryContract.new(transactionParameters)
}

const deployPaymentChannel = ({web3, transactionParameters}, ecRecoveryInstance) => {
  const address = ecRecoveryInstance.address
  const paymentChannelContract = truffleFor(paymentChannelABI, web3)

  paymentChannelContract.setNetwork(web3.version.network)
  paymentChannelContract.link("ECRecovery",address)

  return paymentChannelContract.new(transactionParameters)
}

const dispenseCPU = async (address, cpu, transactionParameters) => {
  return await cpu.mint(address, 1000, transactionParameters)
}


const IPFS = require('ipfs-mini')
const url = require('url')

const connectIPFS = (endpoint) => {
  const ipfsurl = url.parse(endpoint)
  const ipfs = new IPFS({
    host: ipfsurl.hostname,
    port: ipfsurl.port,
    protocol: ipfsurl.protocol.slice(0, -1)
  })
  return ipfs
}

const connectWeb3 = (endpoint) => {
  const web3Provider = new Web3.providers.HttpProvider(endpoint)
  return new Web3(web3Provider)
}

const setup = async (profile) => {
  if (!profile.web3) {
    const web3 = connectWeb3(profile.web3Endpoint)
    profile.web3 = web3
  }

  if (!profile.ipfs) {
    const ipfs = connectIPFS(profile.ipfsEndpoint)
    profile.ipfs = ipfs
  }

  const accounts = await new Promise((resolve, reject) => {
    profile.web3.eth.getAccounts((err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })

  profile.issuer = profile.issuer || accounts[0]
  profile.holder = profile.holder || accounts[1]
  profile.verifier = profile.verifier || accounts[2]

  if (!profile.verifierPrivateKey || !profile.verifierPublicKey) {
    const { publicKey , privateKey } = createKeyPair()
    profile.verifierPrivateKey = privateKey
    profile.verifierPublicKey = publicKey
  }

  const transactionParameters = {
    gas: profile.gas || 2930000,
    gasPrice: profile.gasPrice || 1e9,
    from: profile.holder
  }
  profile.transactionParameters = transactionParameters

  if (!profile.cpuContractAddress) {
    const cpu = await deployCPU({
      web3: profile.web3,
      transactionParameters: profile.transactionParameters
    })

    await dispenseCPU(profile.issuer, cpu, profile.transactionParameters)
    await dispenseCPU(profile.holder, cpu, profile.transactionParameters)
    profile.cpu = cpu
    profile.cpuContractAddress = cpu.address
  } else {
    const cpuContract = truffleFor(cpuABI, profile.web3)
    const cpu = await cpuContract.at(profile.cpuContractAddress)
    profile.cpu = cpu
  }

  if (!profile.paymentChannelAddress) {
    const ecRecoveryInstance = await deployECRecovery({
      web3: profile.web3,
      transactionParameters: profile.transactionParameters
    })
    const paymentChannel = await deployPaymentChannel({
      web3: profile.web3,
      transactionParameters: profile.transactionParameters
    }, ecRecoveryInstance)
    profile.paymentChannelAddress = paymentChannel.address
  }

  const paymentChannelInstance = new PaymentChannel(profile.holder, profile.web3, profile.databaseUrlClient)
  profile.paymentChannelInstance = paymentChannelInstance

  return profile
}
exports.setup = setup
