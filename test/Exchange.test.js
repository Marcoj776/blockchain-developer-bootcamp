import { tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Exchange', ([deployer, feeAccount, user1]) => {
    let exchange
    let token
    const feePercent = 10

    beforeEach(async () => {
        exchange = await Exchange.new(feeAccount, feePercent)
        token = await Token.new()
        token.transfer(user1, tokens(100), { from: deployer })
    })

  describe('deployment', () => {
    it('tracks the fee account', async () => {
        const result = await exchange.feeAccount()
        result.should.equal(feeAccount)
    })
      
    it('tracks the fee percent', async () => {
        const result = await exchange.feePercent()
        result.toString().should.equal(feePercent.toString())
    })
  })
    
    describe('depositing tokens', () => {
        let result
        let amount
        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                result = await exchange.depositToken(token.address, amount, { from: user1 })
            })

            it('tracks depositing tokens', async () => {
                let balance
                //user deposited
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                //tokens are correctly attributed to user
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })
            
            it('emits a Deposit event', () => {
                const log = result.logs[0]
                log.event.should.eq('Deposit')
                const event = log.args
                event.token.toString().should.equal(token.address, 'Token is correct')
                event.user.should.equal(user1, 'User is correct')
                event.amount.toString().should.equal(amount.toString(), 'Amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'Balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects Ether deposits', async () => {
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            it('rejects unapproved deposits', async () => {
                await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            it('rejects 0 deposits', async () => {
                await token.approve(exchange.address, tokens(0), { from: user1 })
                await exchange.depositToken(token.address, tokens(0), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })
    describe('fallback', () => {
        it('reverts when ether is sent', async () => {
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })
})