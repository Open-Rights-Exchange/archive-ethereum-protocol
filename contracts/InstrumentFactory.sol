pragma solidity ^0.4.18;

import { Instrument } from './Instrument.sol';

contract InstrumentFactory is Instrument {
  uint256 public amountPaymentRequired; // amount in wei
  bytes32 public instrumentContentHash;

  function InstrumentFactory(address _issuer, bytes32 _contentHash, bytes32 _instrumentContentHash, uint256 _amountPaymentRequired) Instrument(_issuer, _issuer,  _contentHash) public {
    amountPaymentRequired = _amountPaymentRequired;
    instrumentContentHash = _instrumentContentHash;
  }

  function withdraw(address _withdrawAddress) onlyIssuer public {
    _withdrawAddress.transfer(this.balance);
  }

  function accept() public payable {
    require(msg.value == amountPaymentRequired);

    address instrument = new Instrument(issuer, msg.sender, instrumentContentHash);
    InstrumentCreated(issuer, msg.sender, instrument, instrumentContentHash);
  }
}
