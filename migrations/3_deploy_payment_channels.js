var TokenUnidirectional = artifacts.require('./TokenUnidirectional.sol')
var ECRecovery = artifacts.require('./ECRecovery.sol')

module.exports = function(deployer, network, accounts) {
  deployer.deploy(ECRecovery).then(function() {accounts
    deployer.link(ECRecovery, TokenUnidirectional)
    deployer.deploy(TokenUnidirectional)
  })
}
