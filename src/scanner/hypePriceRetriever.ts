import fetch from "node-fetch";

async function getHypeSpotPrice() {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type: "spotMetaAndAssetCtxs"
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    type SpotMetaAndAssetCtxsResponse = [any, any];  // You can refine this type later!

    const data = await response.json() as SpotMetaAndAssetCtxsResponse;
    const [meta, assetCtxs] = data;

    // Find HYPE token index
    const hypeToken = meta.tokens.find((token: any) => token.name === "HYPE");
    if (!hypeToken) {
        throw new Error("HYPE token not found");
    }

    // Find universe entry for HYPE/USDC (or any pair involving HYPE)
    const hypePair = meta.universe.find((pair: any) => pair.tokens.includes(hypeToken.index));
    if (!hypePair) {
        throw new Error("HYPE pair not found");
    }

    // Extract corresponding price context
    const pairIndex = hypePair.index;
    const priceCtx = assetCtxs[pairIndex];

    console.log(`HYPE spot mid price: ${priceCtx.midPx}`);
    console.log(`HYPE spot mark price: ${priceCtx.markPx}`);
    console.log(`HYPE spot previous day price: ${priceCtx.prevDayPx}`);
}

getHypeSpotPrice().catch(console.error);
