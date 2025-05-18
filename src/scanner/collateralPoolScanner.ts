import { ethers, JsonRpcProvider, formatUnits } from "ethers";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("src/config/.env") });

console.log("Loaded RPC_URL:", process.env.RPC_URL);

const collSurplusPoolAbi = [
  "function getCollBalance() view returns (uint256)"
];

const collSurplusPoolAddress = "0x9182e36bd7cceb71812c766c4464208ad9c122ca";
const provider = new JsonRpcProvider(process.env.RPC_URL);

async function main() {
  const collSurplusPool = new ethers.Contract(collSurplusPoolAddress, collSurplusPoolAbi, provider);
  const balance = await collSurplusPool.getCollBalance();
  console.log("Total surplus collateral:", formatUnits(balance, 18), "WHYPE");
}

main();