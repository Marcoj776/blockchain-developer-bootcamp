const tokens = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

const EVM_REVERT = 'VM Exception while processing transaction: revert';
const EVM_REVERT_ADDRESS = 'invalid address (argument="address", value=0, code=INVALID_ARGUMENT, version=address/5.0.5) (argument="_to", value=0, code=INVALID_ARGUMENT, version=abi/5.0.0-beta.153)';
export { tokens, EVM_REVERT, EVM_REVERT_ADDRESS };