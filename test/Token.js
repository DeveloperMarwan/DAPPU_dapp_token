const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

describe("Token", ()=> {
    let token, accounts, deployer, receiver;

    beforeEach( async () => {
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("My Unstable Token", "MUTKN", 1000000);
        accounts = await ethers.getSigners()
        deployer = accounts[0];
        receiver = accounts[1];
    })

    describe("Deployment", () => {
        const name = "My Unstable Token";
        const symbol = "MUTKN";
        const decimals = 18;
        const totalSupply = tokens(1000000);

        it("has correct name", async ()=> {
            expect(await token.name()).to.equal(name);
        })
    
        it("has correct symbol", async ()=> {
            expect(await token.symbol()).to.equal(symbol);
        })
    
        it("has correct decimals", async ()=> {
            expect(await token.decimals()).to.equal(decimals);
        })
    
        it("has correct total supply", async ()=> {
            expect(await token.totalSupply()).to.equal(totalSupply);
        })

        it("assigns total supply to deployer", async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
        })
    })

    describe("Sending Tokens", () => {
        let amount, transaction, result;

        describe("Success", () => {
            beforeEach( async () => {
                amount = tokens(100);
                transaction = await token.connect(deployer).transfer(receiver.address, amount);
                result = await transaction.wait();
            })
    
            it("Transfers token balances", async () => {
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
                expect(await token.balanceOf(receiver.address)).to.equal(amount);
            })
    
            it("Emits a transfer event", async () => {
                const transferEvent = result.events[0];
                expect(transferEvent.event).to.equal("Transfer");
    
                const eventArgs = transferEvent.args;
                expect(eventArgs._from).to.equal(deployer.address);
                expect(eventArgs._to).to.equal(receiver.address);
                expect(eventArgs._value).to.equal(amount);
            })
        })

        describe("Failure", () => {
            it("Rejects insufficient balances", async () => {
                const invalidAmount = tokens(100000000);
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted;
            })

            it("Rejects invalid recipient", async () => {
                const amount = tokens(100);
                const invalidAddress = "0x0000000000000000000000000000000000000000";
                await expect(token.connect(deployer).transfer(invalidAddress, amount)).to.be.reverted;
            })
        })
    })
})