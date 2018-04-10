pragma solidity ^0.4.18;

import { StandardToken } from 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import { Instrument } from './Instrument.sol';

contract InstrumentFactoryWithToken is Instrument {
  uint256 public amountPaymentRequired; // amount in wei
  bytes32 public instrumentContentHash;
  StandardToken public token;

  function InstrumentFactoryWithToken(address _issuer, bytes32 _contentHash, bytes32 _instrumentContentHash, uint256 _amountPaymentRequired, address _token) Instrument(_issuer, _issuer,  _contentHash) public {
    amountPaymentRequired = _amountPaymentRequired;
    instrumentContentHash = _instrumentContentHash;
    token = StandardToken(_token);
  }

  function withdraw(address _withdrawAddress, uint256 _value) onlyIssuer public {
    require(token.transfer(_withdrawAddress, _value));
  }

  function accept() public payable {
    // the acceptor, msg.sender, must have already `approve`d the transfer amount for this contract.
    require(token.transferFrom(msg.sender, this, amountPaymentRequired));

    address instrument = new Instrument(issuer, msg.sender, instrumentContentHash);
    InstrumentCreated(issuer, msg.sender, instrument, instrumentContentHash);
  }
}
