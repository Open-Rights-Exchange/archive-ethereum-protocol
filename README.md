
# THIS IS AN ALPHA RELEASE

# ORE protocol

The Open Rights Exchange (ORE) protocol has a notion of `instrument` that is general enough to describe the rights associated with any given economic transaction. Every instrument has a smart contract on the Ethereum blockchain that represents its ownership and associated rights. We wish to build a prototype implementation of this protocol to demonstrate its applicability to facilitating transactions in an API economy. This prototype implementation will have two types of instruments, the API voucher and the API offer. The API voucher concerns the right to call the HTTP endpoints it describes and has a unique `holder` that is recorded on the blockchain. The API offer concerns the right to purchase its attached voucher.

# Introduction

This library can be used by an API seller to create an API offer (an instrument) in ORE and used by an API buyer to accept that offer. Once each party has negotiated this setup phase, the buyer will receive an HTTP client to make requests against the purchased API.

An `instrument` is a description and a set of rights. If known, an instrument has two attached identities for who issued the instrument and who currently holds the instrument.

A `right` is a description and a _capability_ that can be _performed_, subject to a set of attached conditions all being _satisfied_.

A `condition` can be `prove`n which yields a proof to convince a `verifier` the requisite task has been performed. If the proof convinces the `verifier` then the condition is _satisfied_.

We say we `exercise` an instrument when we perform the conditions attached to the rights. As the exerciser, we generate cryptographic proofs that the respective action satisfying the condition has been performed. These proofs are supplied to the capability we then 'unlock' and are sent along to any verifier who is arbitrating access to the resource represented by the capability. The verifier can use this library along the proof data to make sure the claimed actions have taken place. The verifier can then provide some token of access for the client to present to the ultimate destination.

# Setup on MacOS

### Install Dependancies
- `brew install mongodb`
- `brew install ipfs`
- `ipfs init`
- `npm install -g ganache-cli`

### Start Services
- `brew services start mongodb`
- `brew services start ipfs`
- `ganache-cli`

# Example usage

Refer to the readme in the cli directory

There is a complete example in `cli/example.js`.

Keep in mind that this library "does what you tell it" in the sense that there are no checks for previous contract exercise events or outstanding token transfers. Be careful with your live production code: you will probably want to include some mechanism for idemopotency in a higher level of your stack.

# Notes

Some particular things to note about library usage:

Instruments are the primary object in the system. Rights, conditions and capabilities influence the behavior of instruments.

Instruments support a method `exercise` which selects the associated right and attempts to perform the capabilities necessary to fulfill its associated conditions. It does this by recursively calling `exercise` on the right. Future versions of this library will support multiple rights associated with an instrument.

If the conditions attached to a right are `undefined` or `null`, then the semantics dictate the right's capability can be performed by any party, i.e. they are satisfiable by default.

The order indicated by the position of the conditions in a right's `conditions` Array property is significant: the actions required to prove a given sequence of conditions are performed in that order.

Along with `exercise`, a given right object supports the method `verify`. The proof produced by `exercise` should be passed by the prover to the verifier who then supplies the proof to a `verify` call to the same type of right object in their trusted domain.

Do not rely on the internal APIs or data formats of this library as these details are evolving quickly.

This library uses an internal tagging system to differentiate objects: `tag.js` implements a way to tag various objects so that a static description can be created and later interpreted. this strategy means it is trivial to serialize objects, i.e. on a decentralized network, and then sometime later be reinstantiated for further operation by any actor on the network. the systems aims to be extensibly open so that new semantics can later be given to existing objects as the protocol evolves.
