pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint;
    
    //vars
    string public name = "My Name";
    string public symbol = "DAPP";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    //events
    event Transfer(address indexed from, address to, uint256 value);
    
    // track balances
    mapping(address => uint256) public balanceOf;

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    //send tokens
    function transfer(address _to, uint256 _value) public returns (bool success) {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
}