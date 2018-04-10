// Adds data to ipfs
// ipfs: ipfs instance of the ipfs node specified by the user
// msg: data to be stored on ipfs
exports.addToIPFS = async (ipfs, msg) => new Promise((resolve, reject) => {
  ipfs.add(msg, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})

// Gets data from IPFS corresponding to the hash
exports.getFromIPFS = async (ipfs, addr) => new Promise((resolve, reject) => {
  ipfs.cat(addr, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})
