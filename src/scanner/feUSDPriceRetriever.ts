import fetch from "node-fetch";

async function getFeUsdPrice() {
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

    type SpotMetaAndAssetCtxsResponse = [any, any];
    const [meta, assetCtxs] = await response.json() as SpotMetaAndAssetCtxsResponse;

    const feUsdToken = meta.tokens.find((t: any) => t.index === 241);
    if (!feUsdToken) {
        throw new Error("feUSD token not found");
    }

    const feUsdPair = meta.universe.find((p: any) => p.tokens.includes(feUsdToken.index));
    if (!feUsdPair) {
        throw new Error("feUSD trading pair not found");
    }

    const priceCtx = assetCtxs[feUsdPair.index];
    console.log(`feUSD spot mid price: ${priceCtx.midPx}`);
    console.log(`feUSD spot mark price: ${priceCtx.markPx}`);
    console.log(`feUSD previous day price: ${priceCtx.prevDayPx}`);
}

getFeUsdPrice().catch(console.error);