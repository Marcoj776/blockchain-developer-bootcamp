pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Token.sol";

// TODO:
// [X] set fee
// [ ] deposit ether
// [ ] withdraw ether
// [ ] deposit tokens
// [ ] withdraw tokens
// [ ] check balances
// [ ] make order
// [ ] cancel order
// [ ] fill order
// [ ] charge fees

contract Exchange {
using SafeMath for uint;
    //variables
    address public feeAccount; //the account that receives fees
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function depositToken(address _token, uint256 _amount) public {
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
}
