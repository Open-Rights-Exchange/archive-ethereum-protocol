pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';

contract CPU is MintableToken, BurnableToken, Pausable {
  string public name = "CPU COIN";
  string public symbol = "CPU";
  uint256 public decimals = 18;

  // values of eth, by address
  mapping (address => uint256) public deposited;
  // INFO: amounts of cpu, are stored in balances

  // INFO: Hear ye, hear ye, henceforth...
  // value shall refer to a store of ETH
  // amount shall refer to a store of CPU
  event BuyCPU(address indexed _from, address indexed _to, uint256 _value);
  event SellCPU(address indexed _from, uint256 _amount);
  event DeliverCPU(address indexed _to, uint256 _amount);
  event PickupCPU(address indexed _from, uint256 _value);

  function CPU() public {}

  function() public payable {
    buyCPU(msg.sender);
  }

  //////////////////
  // user methods //
  //////////////////

  // user sends ETH for CPU, and can do so on anothers behalf!
  function buyCPU(address _to) public payable returns (bool) {
    require(msg.sender != address(0));
    require(_to != address(0));
    require(msg.value > 0);

    deposited[_to] = deposited[_to].add(msg.value);

    BuyCPU(msg.sender, _to, msg.value);
    return true;
  }

  // user sends CPU for ETH
  function sellCPU(uint256 _amount) public returns (bool) {
    require(msg.sender != address(0));
    require(_amount > 0);
    require(balances[msg.sender] >= _amount);

    SellCPU(msg.sender, _amount);
    return true;
  }

  ///////////////////
  // owner methods //
  ///////////////////

  // after buyCPU, owner mints CPU, and pulls ETH
  function deliverCPU(address _to, uint256 _amount, uint256 _value) onlyOwner public returns (bool) {
    require(_to != address(0));
    require(deposited[_to] >= _value);

    deposited[_to] = deposited[_to].sub(_value);
    owner.transfer(_value);
    mint(_to, _amount);

    return true;
  }

  // after sellCPU, owner burns CPU, and delivers ETH
  function pickupCPU(address _from, uint256 _amount) onlyOwner public payable returns (bool) {
    require(_from != address(0));
    require(balances[_from] >= _amount);

    transferCPU(_from, owner, _amount);
    burn(_amount);
    _from.transfer(msg.value);

    return true;
  }

  // an alternative to the transferFrom method, which requires an allowance from the holder
  function transferCPU(address _from, address _to, uint256 _amount) onlyOwner public returns (bool) {
    require(_to != address(0));
    require(_amount <= balances[_from]);

    balances[_from] = balances[_from].sub(_amount);
    balances[_to] = balances[_to].add(_amount);

    Transfer(_from, _to, _amount);
    return true;
  }
}
