import { tokens } from '../helpers';

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Token = artifacts.require('./Token')

contract('Token', ([deployer, receiver]) => {
    let token
    const settings = {
        name: 'My Name',
        symbol: 'DAPP',
        decimals: '18',
        totalSupply: tokens(1000000).toString(),
    }

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
        const rawAmount = 100;
        let result
        let amount

        beforeEach(async () => {
            //transfer
            amount = tokens(rawAmount)
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
})