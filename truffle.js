module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    remoteDevelopment: {
      host: "your-ganache-endpoint.acme.com", // Add your remote ganache endpoint to run a remote
      port: 8545,
      network_id: "*"
    }
  }
};
