const name = "Deviants of Metaversia";
const symbol = "DVNT";

const metadataURI =
  "https://us-central1-polymorphmetadata.cloudfunctions.net/deviants-images-test?id=";
const maxTotalSupply = 10000;
const bulkBuyLimit = 20;
const royaltyFee = 250;
const publicPrice = ethers.utils.parseEther("0.05");
const discountPrice = ethers.utils.parseEther("0.025");
const DAOAddress = "0x7e94e8D8c85960DBDC67E080C3D48D4e0BD423a6";

const polymorphV1Address = "0xfBF3471CB8e09967E41aBf56d66a3eC59BF371F7";
const polymorphV2Address = "0xCcA89336F67749C0A80926E6a640F8F84C0fa4e2";
const facesAddress = "0xA4F2D0d0B88122B4a37866aF1350FFB11F5F1C4d";
const lobbyLobstersAddress = "0x19946452eF676B28F32BdCcCAF69aA75DD61d1ac";

module.exports = [
  {
    name: name,
    symbol: symbol,
    _baseURI: metadataURI,
    _maxTotalSupply: maxTotalSupply,
    _bulkBuyLimit: bulkBuyLimit,
    _publicPrice: publicPrice,
    _discountPrice: discountPrice,
    _daoAddress: DAOAddress,
    _polymorphsV1Contract: polymorphV1Address,
    _polymorphsV2Contract: polymorphV2Address,
    _facesContract: facesAddress,
    _lobstersContract: lobbyLobstersAddress,
    _royaltyFee: royaltyFee
  },
];
