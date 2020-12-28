require('chai')
    .use(require('chai-as-promised'))
    .should()

const Token = artifacts.require('./Token')

console.log(artifacts);

contract('Token', (accounts) => {
    describe('deployment', () => {
        it('tracks the name', async () => {
            const token = await Token.new()
            const result = await token.name()
            result.should.equal('My Name')
        })
    })
})