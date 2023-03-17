const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

describe("Token", ()=> {
    let token, accounts, deployer, receiver, exchange;
    const invalidAddress = "0x0000000000000000000000000000000000000000";

    beforeEach( async () => {
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("My Unstable Token", "MUTKN", 1000000);
        accounts = await ethers.getSigners()
        deployer = accounts[0];
        receiver = accounts[1];
        exchange = accounts[2];
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
                await expect(token.connect(deployer).transfer(invalidAddress, amount)).to.be.reverted;
            })
        })
    })

    describe("Approving Tokens", () => {
        let amount, transaction, result;

        beforeEach(async () => {
            amount = tokens(100);
            transaction = await token.connect(deployer).approve(exchange.address, amount);
            result = await transaction.wait();
        })

        describe("Success", async () => {
            it("Allocates an allownace for delegated token spending", async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
            })

            it("Emits an Approval event", async () => {
                const approvalEvent = result.events[0];
                expect(approvalEvent.event).to.equal("Approval");
    
                const eventArgs = approvalEvent.args;
                expect(eventArgs._owner).to.equal(deployer.address);
                expect(eventArgs._spender).to.equal(exchange.address);
                expect(eventArgs._value).to.equal(amount);
            })
        })

        describe("Failure", async () => {
            const invalidTokenAmount = tokens(100000000);

            it("Rejects invalid spenders", async () => {
                await expect(token.connect(deployer).approve(invalidAddress, amount)).to.be.reverted;
            })

            it("Rejects invalid approval amount", async () => {
                await expect(token.connect(deployer).approve(exchange.address, invalidTokenAmount)).to.be.reverted;
            })
        })
    })

    describe("Delegated Token Transfers", () => {
        let amount, transaction, result;

        beforeEach(async () => {
            amount = tokens(100);
            transaction = await token.connect(deployer).approve(exchange.address, amount);
            result = await transaction.wait();
        })

        describe("Success", async () => {
            beforeEach(async () => {
                transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount);
                result = await transaction.wait();
            })

            it("Transfers token blanaces", async () => {
                expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits("999900", "ether"));
                expect(await token.balanceOf(receiver.address)).to.be.equal(amount);
            })
            
            it("Resets the allowance", async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0);
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
        describe("Failure", async () => {
            const invalidAmount = tokens(200);
            it("Rejects invalid transfer amount", async () => {
                await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted;
            })
        })
    })
})