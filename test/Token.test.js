require('chai')
    .use(require('chai-as-promised'))
    .should()

const Token = artifacts.require('./Token')

console.log(artifacts);

contract('Token', (accounts) => {
    let token
    const settings = {
        name: 'My Name',
        symbol: 'DAPP',
        decimals: '18',
        totalSupply: '1' + ('0'.repeat(24)),
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
    })
})