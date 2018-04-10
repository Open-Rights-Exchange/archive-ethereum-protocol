pragma solidity ^0.4.18;

contract Instrument {
  address public issuer;
  address public holder;
  bytes32 public contentHash;

  event InstrumentCreated(address indexed issuer, address indexed holder, address indexed instrument, bytes32 contentHash);

  modifier onlyHolder {
    require(holder == msg.sender);
    _;
  }

  modifier onlyIssuer {
    require(issuer == msg.sender);
    _;
  }

  function Instrument(address _issuer, address _holder, bytes32 _contentHash) public {
    issuer = _issuer;
    holder = _holder;
    contentHash = _contentHash;
  }

  function setHolder(address _holder) onlyHolder public {
    holder = _holder;
  }

  function setIssuer(address _issuer) onlyIssuer public {
    issuer = _issuer;
  }
}
