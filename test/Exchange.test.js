import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from '../helpers';

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

contract('Exchange', ([deployer, feeAccount, user1]) => {
    let token
    let exchange
    let result
    const settings = {
        feePercent: '10',
        rawAmount: 10,
    }
    let amount = tokens(settings.rawAmount)

    beforeEach(async () => {
        token = await Token.new();
        exchange = await Exchange.new(feeAccount, settings.feePercent);
        token.transfer(user1, tokens(100), { from: deployer });
    })

    describe('Deployment', () => {
        it('tracks the feeAccount', async () => {
            const result = await exchange.feeAccount();
            result.should.equal(feeAccount);
        })
        
        it('tracks the feePercent', async () => {
            const result = await exchange.feePercent();
            result.toString().should.equal(settings.feePercent);
        })
    })

    describe('Depositing tokens', () => {
        let balance
        let tokenBalance

        describe('success', () => {
            beforeEach(async () => {
                await token.approve(exchange.address, tokens(10), { from: user1 });
                result = await exchange.depositToken(token.address, tokens(10), { from: user1 })
                balance = await token.balanceOf(exchange.address);
                tokenBalance = await exchange.tokens(token.address, user1);
            })

            it('tracks the token deposit', async () => {
                balance.toString().should.equal(amount.toString());
                tokenBalance.toString().should.equal(amount.toString());
            })

            it('emits a deposit event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Deposit');
                const event = log.args
                event.token.should.equal(token.address, 'token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(tokenBalance.toString(), 'balance is correct')
            })
        })
        
        describe('failure', () => {
            it('fails on lack of approval', async () => {
                await exchange.depositToken(token.address, tokens(10), 
                    { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                balance = await token.balanceOf(exchange.address);
                tokenBalance = await exchange.tokens(token.address, user1);
                balance.toString().should.equal('0');
                tokenBalance.toString().should.equal('0');
            })

            it('fails on transfer ETHER', async () => {
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), 
                    { from: user1 }).should.be.rejectedWith(EVM_REVERT);
            })
        })
    })

    describe('depositing ETHER', () => {
        let result
        let amount

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount })
        })

        describe('success', () => {
            it('tracks the Ether deposit', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal(amount.toString())
            })

            it('emits a deposit event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Deposit');
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS, 'Ether token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })
    })

    describe('fallback', () => {
        it('reverts when Ether is sent direct to smart contract', async () => {
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('withdraw ETHER', () => {
        let result
        let amount
        let oldBalance

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount })
        })

        describe('success', () => {
            beforeEach(async () => {
                oldBalance = await exchange.tokens(ETHER_ADDRESS, user1)
                result = await exchange.withdrawEther(amount, { from: user1 });
            })

            it('tracks the Ether withdrawal', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal((oldBalance - amount).toString())
            })
        })
    })
})