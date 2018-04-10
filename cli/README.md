# protocol cli

This directory contains useful utilities for interacting with the protocol. The code here will form the backend to a nice CLI frontend to simplify usage of the ORE protocol.

## Usage

### Example

First, copy the config.example.json to config.json

`cp cli/config.example.json cli/config.json`

then, with yarn installed,

`yarn run demo`

This demo assumes the relevant services that participate in the protocol are running locally as specified in the local profile. The example is self-contained in that all of these services will be created as part of the example for you.

There are several sample profiles included to see how the protocol can be used in different contexts.

* `ORE_PROFILE=localProfile yarn run demo` -- Runs against your local machine
* `ORE_PROFILE=awsProfile yarn run demo` -- Runs against a remote machine. Example shown in the config.json (awsProfile) NOTE: You'll have to fill out the missing parameters

### Generation

There are several parameters that are useful to generate ahead of time which are supplied as configuration to various higher-level tools. For example, if you are interacting with an API that already has an offer created, you could use the following tool to help you generate a voucher. The `index.js` file performs this generation based on the supplied profile and logs the relevant data you may need elsewhere.

`yarn run generate`

You can provide an environment variable to select the profile you wish to use:

`ORE_PROFILE=$SOME_PROFILE yarn run generate`

For example, if you built a `awsProfile` profile and add it to config.json, then you could generate the offer (and voucher) for this API as follows:

`ORE_PROFILE='awsProfile' yarn run generate`

(See the cli/config.json file for example config data for the 'awsProfile' profile)

## Description

* `api-server.js`

Builds an API server for use in the example.

* `client.js`

Simulates a client's call to the API using the protocol.

* `example.js`

Runs a full round of the protocol, calling a sample API.

Takes a profile and acts as if every actor is as specified in the given profile.

* `generate.js`

Takes some configuration in the shape of a profile (see `profile.js`) and generates any objects required for a full execution of the protocol that are not supplied.

For example, if you supply an offer address but no voucher address this script will create a voucher from that offer for you.

* `incrementer-api.js`

A simple API to increment an integer by 1.

* `index.js`

Runs the code in `generate.js` and then logs the various output data.

The final output of this script is a series of addresses and other data relevant to using the protocol.

* ` keys.js`

Contains utilities for creating `secp256r1` keys which are used to authenticate between the server and verifier actors.

* `offer.js`

Contains utilities for creating an offer entity.

* `profile.js`

Contains function to take profile data from config-cli.json and fill out the parameters of a given protocol execution.

* `setup.js`

Performs the necessary actions to ensure the expected context for the protocol exists based on the data given in a profile.

* `verifier.js`

Sets up a verifier server for use in the example.

* `voucher.js`

Contains utilities for creating a voucher entity.
