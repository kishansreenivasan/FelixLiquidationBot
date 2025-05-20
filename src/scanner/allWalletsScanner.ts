const { JsonRpcProvider } = require("ethers");
const { formatUnits } = require("ethers"); // CommonJS
const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const TroveNFTAbi = require("../contracts/abis/TroveNFTAbi.json");
const TroveManagerAbi = require("../contracts/abis/TroveManagerAbi.json");

dotenv.config({ path: path.resolve("src/config/.env") });

const TROVE_NFT = "0x5ad1512e7006fdbd0f3ebb8aa35c5e9234a03aa7";
const TROVE_MANAGER = "0x3100f4e7bda2ed2452d9a57eb30260ab071bbe62";

const provider = new JsonRpcProvider(process.env.RPC_URL);

const nft = new ethers.Contract(TROVE_NFT, TroveNFTAbi, provider);
const troveManager = new ethers.Contract(TROVE_MANAGER, TroveManagerAbi, provider);

async function getAllTroveData() {
  const totalSupply = await nft.totalSupply();
  const totalSupplyNumber = Number(totalSupply);
  const results = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < totalSupplyNumber; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < Math.min(i + BATCH_SIZE, totalSupplyNumber); j++) {
      batch.push(nft.tokenByIndex(j));
    }

    try {
      const tokenIds = await Promise.all(batch);

      const troveCalls = tokenIds.map(tokenId => {
        const troveId = tokenId.toString();
        return Promise.all([
          Promise.resolve(troveId),
          nft.ownerOf(troveId),
          troveManager.getLatestTroveData(troveId),
          troveManager.getTroveStatus(troveId),
        ]);
      });

      const troveResults = await Promise.all(troveCalls);

      for (let k = 0; k < troveResults.length; k++) {
        const [troveId, owner, troveRawData, status] = troveResults[k];
        const absoluteIndex = i + k + 1;

        const [
          entireDebt,
          entireColl,
          UnknownVar1,
          UnknownVar2,
          UnknownVar3,
          UnknownVar4,
          annualInterestRate,
          UnknownVar5
        ] = troveRawData;

        console.log(`Trove ${troveId} (${absoluteIndex}/${totalSupplyNumber})`);
        console.log(`  Owner:                         ${owner}`);
        console.log(`  Collateral:                    ${formatUnits(entireColl, 18)} HYPE`);
        console.log(`  Debt:                          ${formatUnits(entireDebt, 18)} feUSD`);
        console.log(`  Interest Rate:                 ${formatUnits(annualInterestRate, 16)}%`);
        console.log(`  Status:                        ${status}`);
        console.log("--------------------------------------------------------------------------------------------------");

        results.push({
          troveId,
          owner,
          entireDebt: entireDebt.toString(),
          entireColl: entireColl.toString(),
          annualInterestRate: annualInterestRate.toString(),
          status
        });
      }
    } catch (err) {
      console.error(`Error in range ${i}-${i + BATCH_SIZE - 1}:`, err);
    }

    await new Promise(res => setTimeout(res, 100));
  }

  fs.writeFileSync("troves.json", JSON.stringify(results, null, 2));
  console.log("✅ Finished fetching all trove data.");
  return results;
}

getAllTroveData().then(console.log).catch(console.error);