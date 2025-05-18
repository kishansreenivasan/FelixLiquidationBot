const { JsonRpcProvider } = require("ethers");
const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const TroveNFTAbi = require("../contracts/abis/TroveNFTAbi.json");

dotenv.config({ path: path.resolve("src/config/.env") });

console.log("Loaded RPC_URL:", process.env.RPC_URL);

const TROVE_NFT = "0x5ad1512e7006fdbd0f3ebb8aa35c5e9234a03aa7";

const provider = new JsonRpcProvider(process.env.RPC_URL);

const nft = new ethers.Contract(TROVE_NFT, TroveNFTAbi, provider);

async function getAllTroveIds() {
  const totalSupply = await nft.totalSupply();
  const totalSupplyNumber = Number(totalSupply); // Convert BigInt to number

  console.log("Total Supply:", totalSupplyNumber);

  const ids: string[] = [];
  const BATCH_SIZE = 20;

  for (let i = 0; i < totalSupplyNumber; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < Math.min(i + BATCH_SIZE, totalSupplyNumber); j++) {
      console.log(`Queueing token index ${j}/${totalSupplyNumber}`);
      batch.push(nft.tokenByIndex(j));
    }

    try {
      const tokenIds = await Promise.all(batch);
      tokenIds.forEach((id, idx) => {
        console.log(`Fetched token ID: ${id.toString()} (index ${i + idx})`);
        ids.push(id.toString());
      });
    } catch (err) {
      console.error(`Error fetching token IDs ${i} to ${Math.min(i + BATCH_SIZE - 1, totalSupplyNumber - 1)}:`, err);
    }

    // Optional: prevent node rate-limit bans
    await new Promise(res => setTimeout(res, 100));
  }

  console.log("✅ Finished fetching all token IDs.");
  return ids;
}

getAllTroveIds().then(console.log).catch(console.error);