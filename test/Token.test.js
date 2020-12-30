import { tokens, EVM_REVERT } from '../helpers';

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Token = artifacts.require('./Token')

contract('Token', ([deployer, receiver, exchange]) => {
    let token
    const settings = {
        name: 'My Name',
        symbol: 'DAPP',
        decimals: '18',
        totalSupply: tokens(1000000).toString(),
    }
    const rawAmount = 100;
    let result
    let amount = tokens(rawAmount)

    beforeEach(async () => {
        token = await Token.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            const r = await token.name()
            r.should.equal(settings.name)
        })
        it('tracks the symbol', async () => {
            const r = await token.symbol()
            r.should.equal(settings.symbol)
        })
        it('tracks the decimals', async () => {
            const r = await token.decimals()
            r.toString().should.equal(settings.decimals)
        })
        it('tracks the totalSupply', async () => {
            const r = await token.totalSupply()
            r.toString().should.equal(settings.totalSupply)
        })
        it('assigns totalSupply to deployer', async () => {
            const r = await token.balanceOf(deployer)
            r.toString().should.equal(settings.totalSupply)
        })
    })

    describe('sending tokens', () => {

        beforeEach(async () => {
            //transfer
            result = await token.transfer(receiver, amount, { from: deployer })
        })
        it('transfer token balances', async () => {
            let balanceOf

            //after
            balanceOf = await token.balanceOf(deployer)
            balanceOf.toString().should.equal((tokens(1000000 - rawAmount)).toString())

            balanceOf = await token.balanceOf(receiver)
            balanceOf.toString().should.equal(amount.toString())
        })

        it('emits a transfer event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Transfer');
            const event = log.args
            event.from.toString().should.equal(deployer, 'from is correct')
            event.to.should.equal(receiver, 'to is correct')
            event.value.toString().should.equal(amount.toString(), 'amount is correct')
        })
    })

    describe('failure', () => {
        beforeEach(async () => {
        })
        it('rejects insuffcient token balances', async () => {
            let invalidAmount = tokens(100000000)
            await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT);
            
            let invalidAmount2 = tokens(10)
            await token.transfer(deployer, invalidAmount2, { from: receiver }).should.be.rejectedWith(EVM_REVERT);
        })
    })

    describe('invalid receiver', () => {
        it('rejects invlaid address', async () => {
            await token.transfer(0x0, amount, { from: deployer }).should.be.rejected;
        })
    })

    describe('approving tokens', () => {
        let result
        beforeEach(async () => {
            result = await token.approve(exchange, amount, { from: deployer })
        })
        describe('success', () => {
            it('allocates an allowance for delegated token spending on an exchange', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString())
            })
        })

        it('emits an approval event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Approval');
            const event = log.args
            event.owner.toString().should.equal(deployer, 'owner is correct')
            event.spender.should.equal(exchange, 'spender is correct')
            event.value.toString().should.equal(amount.toString(), 'value is correct')
        })

        describe('failure', () => {
            it('disallows approval of a 0 address', async () => {
                await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
            })
        })
    })

    describe('Transfer from', () => {
        beforeEach(async () => {
            await token.approve(exchange, amount, { from: deployer })
        })

        describe('success', () => {
            beforeEach(async () => {
                //transfer
                result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
            })
            it('successful transfer of tokens from deployer to receiver via exchange', async () => {
                let balanceOf

                //before
                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal((tokens(1000000 - rawAmount)).toString());

                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(amount.toString());
            })
            it('emits a transfer event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Transfer');
                const event = log.args;
                event.from.toString().should.equal(deployer, 'from is correct');
                event.to.should.equal(receiver, 'to is correct');
                event.value.toString().should.equal(amount.toString(), 'value is correct');
            })
            it('resets the allowance', async () => {
                const allowance = await token.allowance(deployer, exchange);
                allowance.toString().should.equal('0');
            })
        })
        describe('failure', () => {
            it('rejects insufficient amounts', async () => {
                const invalidAmount = tokens(100000000);
                await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT);
            })
            it('rejects invalid recipients', async () => {
                const invalidAddress = 0x0;
                await token.transferFrom(deployer, invalidAddress, amount, { from: exchange }).should.be.rejected;
            })
        })
    })
})