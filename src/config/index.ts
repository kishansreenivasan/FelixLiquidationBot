import { JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export const provider = new JsonRpcProvider(process.env.RPC_URL);