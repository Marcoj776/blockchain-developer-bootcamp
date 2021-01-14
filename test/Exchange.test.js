import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from '../helpers';

require('chai').use(require('chai-as-promised')).should()

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
        token.transfer(user1, tokens(999999), { from: deployer });
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
            await exchange.depositEther({ from: user1, value: amount })
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

            it('emits a withdraw event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Withdraw');
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS, 'Ether token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal((oldBalance - amount).toString(), 'balance is correct')
            })
        })
        
        describe('failure', () => {
            beforeEach(async () => {
            })
            it('fails withdrawing too much Ether', async () => {
                result = await exchange.withdrawEther(ether(2), { from: user1 }).should.be.rejectedWith(EVM_REVERT);
            })
        })
    })

    describe('withdraw Tokens', () => {
        let result
        let rawamount = 8888
        let rawamountWithdraw = 1111
        let amount
        let amountWithdraw
        let withdraw

        beforeEach(async () => {
            amount = tokens(rawamount)
            amountWithdraw = tokens(rawamountWithdraw)
            await token.approve(exchange.address, amount, { from: user1 })
            await exchange.depositToken(token.address, amount, { from: user1 })
        })

        describe('success', () => {
            beforeEach(async () => {
                withdraw = await exchange.withdrawToken(token.address, amountWithdraw, { from: user1 })
                result = await exchange.tokens(token.address, user1)
            })

            it('tracks the Token withdrawal', async () => {
                result.toString().should.equal(tokens(rawamount - rawamountWithdraw).toString())
            })

            it('emits a withdraw event', async () => {
                const log = withdraw.logs[0]
                const event = log.args
                event.token.should.equal(token.address, 'DAPP token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amountWithdraw.toString(), 'amount is correct')
                event.balance.toString().should.equal(tokens(rawamount - rawamountWithdraw).toString(), 'balance is correct')
            })
        })

        describe('failure', () => {
            let tooManyTokens = tokens(rawamount * 2)

            it('fails on withdrawing too much', async () => {
                 await exchange.withdrawToken(token.address, tooManyTokens, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })

            it('fails on withdrawing from ETHER_ADDRESS', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, tokens(1), { from: user1 }).should.be.rejectedWith(EVM_REVERT);
            })
        })
    })

    describe('getting balance of tokens', () => {
        let result
        let amount = tokens(1)

        beforeEach(async () => {
            await token.approve(exchange.address, amount, { from: user1 })
            await exchange.depositToken(token.address, amount, { from: user1 })
        })

        describe('success', () => {
            it('gets the balance', async () => {
                result = await exchange.balanceOfToken(token.address, user1)
                result.toString().should.equal(amount.toString())
            })
        })

        describe('failure', () => {
            it('tries to get the ETH balance', async () => {
                await exchange.balanceOfToken(ETHER_ADDRESS, user1).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('Making orders', async () => {
        let token = await Token.new()
        let tokenGet = token.address
        let amountGet = tokens(2)
        let tokenGive = ETHER_ADDRESS
        let amountGive = ether(1)

        beforeEach(async () => {
            result = await exchange.makeOrder(tokenGet, amountGet, tokenGive, amountGive, { from: user1 })
        })
        
        it('tracks the order created', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1', 'orderCount is correct')
            const order = await exchange.orders('1')
            order.id.toString().should.equal('1', 'ID is correct')
            order.user.toString().should.equal(user1.toString(), 'user is correct')
            order.tokenGet.toString().should.equal(tokenGet.toString(), 'tokenGet is correct')
            order.amountGet.toString().should.equal(amountGet.toString(), 'amountGet is correct')
            order.tokenGive.toString().should.equal(tokenGive.toString(), 'tokenGive is correct')
            order.amountGive.toString().should.equal(amountGive.toString(), 'amountGive is correct')
            order.timestamp.toString().length.should.be.at.least(1, 'time is there')
        })

        describe('success', () => {
            it('Order event', async () => {
                let log = result.logs[0]
                let event = log.args
                event.id.toString().should.equal('1', 'ID is correct'))
                event.user.toString().should.equal(user1.toString(), 'user is correct')
                event.tokenGet.toString().should.equal(tokenGet.toString(), 'tokenGet is correct')
                event.amountGet.toString().should.equal(amountGet.toString(), 'amountGet is correct')
                event.tokenGive.toString().should.equal(tokenGive.toString(), 'tokenGive is correct')
                event.amountGive.toString().should.equal(amountGive.toString(), 'amountGive is correct')
            })
        })

        describe('failure', () => {
            it('token address is not a token', async () => {
                
            })
        })
    })
})