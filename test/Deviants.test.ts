import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Deviants  } from "../typechain-types/contracts";
import { Faces } from "../typechain-types/contracts/mock/faces.sol";
import { LobbyLobsters } from "../typechain-types/contracts/mock/lobbyLobster.sol";
import { PolymorphV1 } from "../typechain-types/contracts/mock/polymorphv1.sol";
import { PolymorphV2 } from "../typechain-types/contracts/mock/polymorphv2.sol";

describe("Deviants", () => {
  let DAO: SignerWithAddress;
  let deployer: SignerWithAddress;
  let deviantsInstance: Deviants;
  let polymorphV1Instance: PolymorphV1;
  let polymorphV2Instance: PolymorphV2;
  let facesInstance: Faces;
  let lobbyLobstersInstance: LobbyLobsters;
  let snapshotId: any;

  let name = "Deviants";
  let token = "DVNT";
  let baseUri = "https://us-central1-polymorphmetadata.cloudfunctions.net/deviants-images-test?id=";
  let royaltyFee = 250;
  let totalSupply = 10000;
  let bulkBuyLimit = 20;
  let deviantsPrice = ethers.utils.parseEther("0.05");
  let discountPrice = ethers.utils.parseEther("0.025");

  const startTokenId = ethers.BigNumber.from("0");

  let constructorArgs;

  before(async () => {
    const [user, dao] = await ethers.getSigners();

    DAO = dao;
    deployer = user;

    const PolymorphV1 = await ethers.getContractFactory("PolymorphV1");
    const polymorphV1Inst = await PolymorphV1.deploy();
    await polymorphV1Inst.deployed();

    polymorphV1Instance = polymorphV1Inst as PolymorphV1;

    const PolymorphV2 = await ethers.getContractFactory("PolymorphV2");
    const polymorphV2Inst = await PolymorphV2.deploy();
    await polymorphV2Inst.deployed();
    polymorphV2Instance = polymorphV2Inst as PolymorphV2;

    const Faces = await ethers.getContractFactory("Faces");
    const facesInst = await Faces.deploy();
    await facesInst.deployed();
    facesInstance = facesInst as Faces;

    const LobbyLobsters = await ethers.getContractFactory("LobbyLobsters");
    const lobbyLobstersInst = await LobbyLobsters.deploy();
    await lobbyLobstersInst.deployed();
    lobbyLobstersInstance = lobbyLobstersInst as LobbyLobsters;

    constructorArgs = {
      name: name,
      symbol: token,
      _baseURI: baseUri,
      _maxTotalSupply: totalSupply,
      _bulkBuyLimit: bulkBuyLimit,
      _publicPrice: deviantsPrice,
      _discountPrice: discountPrice,
      _daoAddress: DAO.address,
      _polymorphsV1Contract: polymorphV1Instance.address,
      _polymorphsV2Contract: polymorphV2Instance.address,
      _facesContract: facesInstance.address,
      _lobstersContract: lobbyLobstersInstance.address,
    };

    const Deviants = await ethers.getContractFactory("Deviants");
    const deviantsInst = await Deviants.deploy(constructorArgs);
    await deviantsInst.deployed();
    deviantsInstance = deviantsInst as Deviants;
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it(`first token id should be 1`, async () => {
    await deviantsInstance.mint(1, { value: deviantsPrice });

    const lastToken = await deviantsInstance.lastTokenId();

    expect(lastToken).eq(1);

    const totalSupply = await deviantsInstance.totalSupply();
    expect(totalSupply).eq(1);
  });

  // it(`mint(address) should be disabled`, async () => {
  //   await expect(
  //     polymorphV1Instance["mint(address)"](deployer.address)
  //   ).revertedWith("Should not use this one");
  // });

  it(`should mint several tokens`, async () => {
    const cost = await deviantsInstance.publicPrice();
    const mintCount = ethers.BigNumber.from("10");
    await deviantsInstance.mint(mintCount, { value: cost.mul(mintCount) });
    const lastTokenId = await deviantsInstance.lastTokenId();

    expect(lastTokenId.sub(startTokenId)).eq(mintCount);
  });

  it(`should return excess if any after mint`, async () => {
    const minterBalanceBefore = await deployer.getBalance();
    const daoBalanceBefore = await DAO.getBalance();
    const cost = await deviantsInstance.publicPrice();
    const mintCount = ethers.BigNumber.from("10");
    // mint 10 tokens sending msg.value for 12 tokens
    const mintTx = await deviantsInstance.mint(mintCount, { value: cost.mul(mintCount.add(2)) });
    const receipt = await mintTx.wait();
    const totalGas = ethers.utils.parseUnits(ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)));
    const daoBalanceAfter = await DAO.getBalance();
    const minterBalanceAfter = await deployer.getBalance();
    expect(daoBalanceAfter).eq(daoBalanceBefore.add(cost.mul(mintCount)));
    expect(minterBalanceAfter).eq(minterBalanceBefore.sub(mintCount.mul(cost)).sub(totalGas));
    const lastTokenId = await deviantsInstance.lastTokenId();

    expect(lastTokenId.sub(startTokenId)).eq(mintCount);
  });

  it(`should have owner`, async () => {
    const ownerAddress = await deviantsInstance.owner();
    expect(ownerAddress).eq(deployer.address);
  });

  it(`should transfer ownership`, async () => {
    const initialOwnerAddress = await deviantsInstance.owner();
    expect(initialOwnerAddress).eq(deployer.address);

    await deviantsInstance.transferOwnership(DAO.address);

    const newOwnerAddress = await deviantsInstance.owner();
    expect(newOwnerAddress).eq(DAO.address);
  });

  it(`should have ERC2981 Default Royalties`, async () => {
    const royaltyInfo = await deviantsInstance.royaltyInfo(1, 10000);

    expect(royaltyInfo[0]).eq(DAO.address);
    expect(royaltyInfo[1]).eq(royaltyFee);
  });

  it(`only DAO should update ERC2981 Default Royalties`, async () => {
    const royaltyInfo = await deviantsInstance.royaltyInfo(1, 10000);

    expect(royaltyInfo[0]).eq(DAO.address);
    expect(royaltyInfo[1]).eq(royaltyFee);

    await expect(
      deviantsInstance.setRoyalties(deployer.address, 200)
    ).revertedWith("Not Called by DAO");

    await expect(
      deviantsInstance.connect(DAO).setRoyalties(deployer.address, 200)
    ).to.be.emit(deviantsInstance, "RoyaltiesChanged");

    const newRoyaltyInfo = await deviantsInstance.royaltyInfo(1, 10000);

    expect(newRoyaltyInfo[0]).eq(deployer.address);
    expect(newRoyaltyInfo[1]).eq(200);
  });

  it(`transfer calls mint functionality`, async () => {
    const lastTokenId = await deviantsInstance.lastTokenId();
    await deployer.sendTransaction({
      to: deviantsInstance.address,
      value: ethers.utils.parseEther("1"),
    });
    const lastTokenIdAfter = await deviantsInstance.lastTokenId();
    await expect(lastTokenId.add(1)).eq(lastTokenIdAfter);
    const owner = await deviantsInstance.ownerOf(lastTokenIdAfter);

    await expect(owner).eq(deployer.address);
  });

  it("should mint nft normally with random gene", async () => {
    const daoBalanceBefore = await DAO.getBalance();

    const cost = await deviantsInstance.publicPrice();
    await deviantsInstance.mint(1, { value: cost });
    await deviantsInstance.mint(1, { value: cost });

    const daoBalanceAfter = await DAO.getBalance();

    const geneA = await deviantsInstance.geneOf(startTokenId.add(1));
    const geneB = await deviantsInstance.geneOf(startTokenId.add(2));

    expect(geneA).not.eq(geneB, "The two genes ended up the same");

    expect(daoBalanceAfter).eq(
      daoBalanceBefore.add(cost.mul(2)),
      "The dao did not receive correct amount"
    );
  });

  it("should not mint when DAO does not have receive or fallback function", async () => {
    const TestContractInteractor = await ethers.getContractFactory(
      "TestContractInteractor"
    );
    const contractInteractor = await TestContractInteractor.deploy(
      deviantsInstance.address
    );

    const MockedDeviants= await ethers.getContractFactory(
      "Deviants"
    );

    const mockedDeviantsInstance = await MockedDeviants.deploy({
      name: name,
      symbol: token,
      _baseURI: baseUri,
      _maxTotalSupply: totalSupply,
      _bulkBuyLimit: bulkBuyLimit,
      _publicPrice: deviantsPrice,
      _discountPrice: discountPrice,
      _daoAddress: contractInteractor.address,
      _polymorphsV1Contract: polymorphV1Instance.address,
      _polymorphsV2Contract: polymorphV2Instance.address,
      _facesContract: facesInstance.address,
      _lobstersContract: lobbyLobstersInstance.address,
    });

    await mockedDeviantsInstance.deployed();

    const cost = await mockedDeviantsInstance.publicPrice();
    await expect(
      mockedDeviantsInstance.mint(1, { value: cost })
    ).revertedWith(
      "Address: unable to send value, recipient may have reverted"
    );
  });

  it("should change bulk buy limit", async () => {
    const newBulkBuyLimit = 30;

    const bulkBuyLimitBefore = await deviantsInstance.bulkBuyLimit();
    expect(bulkBuyLimitBefore).eq(
      bulkBuyLimit,
      `The bulk buy limit was not ${bulkBuyLimit} in the beginning`
    );

    await deviantsInstance.connect(DAO).setBulkBuyLimit(newBulkBuyLimit);

    const bulkBuyLimitAfter = await deviantsInstance.bulkBuyLimit();
    expect(bulkBuyLimitAfter).eq(
      newBulkBuyLimit,
      "The bulk buy limit did not change"
    );

    await expect(
      deviantsInstance.setBulkBuyLimit(newBulkBuyLimit)
    ).revertedWith("Not Called by DAO");
  });

  it("should change deviant price", async () => {
    const newDeviantPrice = ethers.utils.parseEther("0.0877");

    const deviantPriceBefore = await deviantsInstance.publicPrice();
    expect(deviantPriceBefore).eq(
      deviantsPrice,
      `The price was not ${deviantsPrice} in the beginning`
    );

    await deviantsInstance.connect(DAO).setMintPrice(newDeviantPrice);

    const deviantPriceAfter = await deviantsInstance.publicPrice();
    expect(deviantPriceAfter).eq(newDeviantPrice, "The price did not change");

    await expect(
      deviantsInstance.setMintPrice(newDeviantPrice)
    ).to.revertedWith("Not Called by DAO");
  });

  it("should change max supply", async () => {
    const newMaxSupply = 11000;

    const totalSupplyBefore = await deviantsInstance.maxTotalSupply();
    expect(totalSupplyBefore).eq(
      totalSupply,
      `The max supply was not ${totalSupply} in the beginning`
    );

    await deviantsInstance.connect(DAO).setMaxSupply(newMaxSupply);

    const totalSupplyAfter = await deviantsInstance.maxTotalSupply();
    expect(totalSupplyAfter).eq(newMaxSupply, "The max supply did not change");

    await expect(deviantsInstance.setMaxSupply(newMaxSupply)).revertedWith(
      "Not Called by DAO"
    );
  });

  it("should not bulk buy more than the limit", async () => {
    const cost = await deviantsInstance.publicPrice();
    const limit = await deviantsInstance.bulkBuyLimit();

    await expect(deviantsInstance.mint(limit.add(1), {
      value: cost.mul(limit.add(1)),
    })).revertedWith("Amount exceeds bulk Buy Limit");
  });

  it("should change baseURI", async () => {
    const newBaseURI = "https://new-base-uri-test.com/";
    const baseURIBefore = await deviantsInstance.baseURI();
    expect(baseURIBefore).eq(
      baseUri,
      `The base URI was not ${baseUri} in the beginning`
    );

    await deviantsInstance.connect(DAO).setBaseURI(newBaseURI);

    const baseURIAfter = await deviantsInstance.baseURI();
    expect(baseURIAfter).eq(newBaseURI, "The baseURI did not change");

    await expect(deviantsInstance.setBaseURI(newBaseURI)).revertedWith(
      "Not Called by DAO"
    );
  });

  it(`should not mint more than totalSupply`, async () => {
    const cost = await deviantsInstance.publicPrice();
    const newMaxTotalSupply = 10;

    await deviantsInstance.connect(DAO).setMaxSupply(newMaxTotalSupply);

    await deviantsInstance.mint(newMaxTotalSupply, {
      value: cost.mul(newMaxTotalSupply),
    });

    const lastTokenId = await deviantsInstance.lastTokenId();
    expect(lastTokenId).eq(newMaxTotalSupply);

    const totalSupply = await deviantsInstance.maxTotalSupply();
    expect(totalSupply).eq(newMaxTotalSupply);

    await expect(deviantsInstance.mint(1, { value: cost })).to.be.revertedWith(
      "Total supply would exceed maxTotalSupply"
    );
  });

  it(`discountMint flow should apply correctly`, async () => {
    const daoBalanceBefore = await DAO.getBalance();
    const discountCost = await deviantsInstance.discountPrice();
    const totalTokensToMintWithDiscount = ethers.BigNumber.from("10");
    await expect(
      deviantsInstance.discountMint(1, { value: discountCost })
    ).to.be.revertedWith("Not enough tokens for the discount'");
    await polymorphV1Instance.mint(3);
    await polymorphV2Instance.mint(3);
    await facesInstance.mint(3);
    await lobbyLobstersInstance.mint(3);
    const totalUserDiscountUsedBeforeMint =
      await deviantsInstance.discountsUsed(deployer.address);
    expect(totalUserDiscountUsedBeforeMint).eq(0);
    await expect(
      deviantsInstance.discountMint(totalTokensToMintWithDiscount, {
        value: discountCost.mul(8),
      })
    ).to.be.revertedWith("Not enough ETH sent");
    await deviantsInstance.discountMint(totalTokensToMintWithDiscount, {
      value: discountCost.mul(totalTokensToMintWithDiscount),
    });
    const daoBalanceAfter = await DAO.getBalance();
    expect(daoBalanceAfter).eq(daoBalanceBefore.add(totalTokensToMintWithDiscount.mul(discountCost)))
    const totalUserDiscountUsedAfterMint = await deviantsInstance.discountsUsed(
      deployer.address
    );
    expect(totalUserDiscountUsedAfterMint).eq(totalTokensToMintWithDiscount);
    await deviantsInstance.discountMint(2, { value: discountCost.mul(2) });
    await expect(
      deviantsInstance.discountMint(1, { value: discountCost.mul(1) })
    ).to.be.revertedWith("No discounts allowed");
  });
});
