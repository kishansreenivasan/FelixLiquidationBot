import { JsonRpcProvider, formatUnits } from "ethers";
import { Contract } from "ethers";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import pLimit from "p-limit";

import TroveNFTAbi from "../contracts/abis/TroveNFTAbi.json";
import TroveManagerAbi from "../contracts/abis/TroveManagerAbi.json";

import fetch from "node-fetch";

dotenv.config({ path: path.resolve(__dirname, "../config/.env") });

const TROVE_NFT = "0x5ad1512e7006fdbd0f3ebb8aa35c5e9234a03aa7";
const TROVE_MANAGER = "0x3100f4e7bda2ed2452d9a57eb30260ab071bbe62";

const provider = new JsonRpcProvider(process.env.RPC_URL);
console.log(`Loaded RPC_URL: ${process.env.RPC_URL}`);

const nft = new Contract(TROVE_NFT, TroveNFTAbi, provider);
const troveManager = new Contract(TROVE_MANAGER, TroveManagerAbi, provider);

async function getHypeSpotPrice(): Promise<number> {
  const response = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "spotMetaAndAssetCtxs" })
  });

  if (!response.ok) throw new Error(`HTTP error ${response.status}`);

  const data = (await response.json()) as [any, any];
  const [meta, assetCtxs] = data;

  const hypeToken = meta.tokens.find((token: any) => token.name === "HYPE");
  if (!hypeToken) throw new Error("HYPE token not found");

  const hypePair = meta.universe.find((pair: any) => pair.tokens.includes(hypeToken.index));
  if (!hypePair) throw new Error("HYPE pair not found");

  const priceCtx = assetCtxs[hypePair.index];
  return Number(priceCtx.midPx);
}

async function processBatch(
  start: number,
  BATCH_SIZE: number,
  hypePrice: number,
  totalSupplyNumber: number
): Promise<any[]> {
  const batch = [];
  for (let j = start; j < Math.min(start + BATCH_SIZE, totalSupplyNumber); j++) {
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

    return troveResults.map((result, k) => {
      const [troveId, owner, troveRawData, status] = result;

      const [
        entireDebt,
        entireColl,
        ,
        ,
        ,
        ,
        annualInterestRate
      ] = troveRawData;

      const collHype = Number(formatUnits(entireColl, 18));
      const debtFeUSD = Number(formatUnits(entireDebt, 18));
      const collateralValueUSD = collHype * hypePrice;
      const collatRatio = debtFeUSD > 0 ? (collateralValueUSD / debtFeUSD) * 100 : 0;
      const ltv = collateralValueUSD > 0 ? (debtFeUSD / collateralValueUSD) * 100 : 0;

      console.log(`Trove ${troveId} (${start + k + 1}/${totalSupplyNumber})`);
      console.log(`  Owner:                         ${owner}`);
      console.log(`  Collateral:                    ${collHype} HYPE`);
      console.log(`  Debt:                          ${debtFeUSD} feUSD`);
      console.log(`  Collateralization Ratio:       ${collatRatio.toFixed(2)}%`);
      console.log(`  LTV:                           ${ltv.toFixed(2)}%`);
      console.log(`  Interest Rate:                 ${formatUnits(annualInterestRate, 16)}%`);
      console.log(`  Status:                        ${status}`);
      console.log("--------------------------------------------------------------------------------------------------");

      return {
        troveId,
        owner,
        entireDebt: entireDebt.toString(),
        entireColl: entireColl.toString(),
        annualInterestRate: annualInterestRate.toString(),
        status: status.toString(),
        collateralizationRatio: collatRatio.toFixed(2),
        ltv: ltv.toFixed(2)
      };
    });

  } catch (err) {
    console.error(`Error in range ${start}-${start + BATCH_SIZE - 1}:`, err);
    return [];
  }
}

async function getAllTroveData(): Promise<void> {
  try {
    const hypePrice = await getHypeSpotPrice();
    console.log(`📈 HYPE mid price: $${hypePrice}`);

    const totalSupply = await nft.totalSupply();
    const totalSupplyNumber = Number(totalSupply);
    const BATCH_SIZE = 20;
    const limit = pLimit(10);

    const batchJobs = [];
    for (let i = 0; i < totalSupplyNumber; i += BATCH_SIZE) {
      batchJobs.push(
        limit(() => processBatch(i, BATCH_SIZE, hypePrice, totalSupplyNumber))
      );
    }

    const nestedResults = await Promise.all(batchJobs);
    const results = nestedResults.flat();

    // Sort by LTV descending
    results.sort((a, b) => parseFloat(b.ltv) - parseFloat(a.ltv));

    fs.writeFileSync("troves.json", JSON.stringify(results, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v, 2));

    console.log("✅ Sorted troves saved to troves.json");
  } catch (err) {
    console.error("❌ Failed to fetch trove data:", err);
  }
}

async function runPeriodically(): Promise<void> {
  while (true) {
    console.log(`⏰ Starting full trove data retrieval at ${new Date().toISOString()}`);
    await getAllTroveData();
    console.log(`⏳ Waiting 30 minutes before next run...`);
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000)); // 30 minutes
  }
}

runPeriodically().catch(console.error);