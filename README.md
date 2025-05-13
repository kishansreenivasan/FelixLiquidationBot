# Felix Position Health Scanner - Implementation Steps

## Project Overview

Build a system to monitor CDP position health on Felix Protocol (Hyperliquid L1) to identify liquidation opportunities.

**Current Status:** Phase 1 - Single Wallet Scanner

---

## Prerequisites & Setup

### 1. Environment Setup
- [ ] Install Node.js 18+ and npm/yarn
- [ ] Set up project repository structure
- [ ] Configure environment variables file
- [ ] Install required dependencies (ethers.js, database drivers)

#### feUSD Token
- **Contract:** `0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70`

#### HYPE (WHYPE) Branch
- **Trove Manager:** `0x3100f4e7bda2ed2452d9a57eb30260ab071bbe62`
- **Price Feed:** `0x12a1868b89789900e413a6241ca9032dd1873a51`
- **Stability Pool:** `0x576c9c501473e01ae23748de28415a74425efd6b`
- **Active Pool:** `0x39ebba742b6917d49d4a9ac7cf5c70f84d34cc9e`
- **WHYPE Token:** `0x5555555555555555555555555555555555555555`

#### UBTC (Bitcoin) Branch
- **Trove Manager:** `0xbbe5f227275f24b64bd290a91f55723a00214885`
- **Price Feed:** `0xf59f338424062dd1d44a9b4dd2721128a45358ab`
- **Stability Pool:** `0xabf0369530205ae56dd4c49629474c65d1168924`
- **Active Pool:** `0x8d99575ebbbda038a626ca769561c16fdd7a5939`
- **UBTC Token:** `0x9fdbda0a5e284c32744d2f17ee5c74b284993463`

#### Need to know
- [ ] **Get HyperEVM network details**
 - RPC endpoint URL
 - Chain ID
 - WebSocket endpoint (if available)
 - Contract deployment block number
- [ ] **Confirm liquidation parameters**
 - Liquidation threshold (assumed 40% LTV)
 - Liquidation bonus percentage
 - Supported collateral types and ratios

---

## Phase 1: Single Wallet Scanner

### Step 1: Contract Integration
1. **Create contract interface classes**
  - Connect to HyperEVM RPC endpoint
  - Load contract ABIs for Felix contracts
  - Test basic contract connectivity

2. **Implement position query function**
  - Query CDP Manager for specific wallet position
  - Extract collateral amount, type, and debt amount
  - Handle cases where wallet has no position

3. **Add price data retrieval**
  - Query Felix Price Oracle for collateral prices
  - Ensure prices match what Felix uses internally
  - Add error handling for price feed failures

### Step 2: Health Calculation Logic
1. **Calculate Loan-to-Value (LTV) ratio**
  - Formula: LTV = (Debt Amount in USD) / (Collateral Value in USD)
  - Account for different collateral types and decimals
  - Ensure precision handling for large numbers

2. **Determine health status**
  - CRITICAL: LTV ≥ 40% (liquidatable)
  - WARNING: LTV ≥ 35% (approaching liquidation)
  - HEALTHY: LTV < 35%

3. **Calculate additional metrics**
  - Distance to liquidation (percentage buffer)
  - Liquidation price for collateral
  - Estimated time to liquidation (basic model)

### Step 3: Build Scanner Function
1. **Create single wallet scanner method**
  - Input: wallet address
  - Output: complete position health report
  - Include error handling for invalid addresses

2. **Add monitoring capability**
  - Periodic scanning at defined intervals
  - Price change monitoring
  - Alert generation for status changes

### Step 4: Testing & Validation
1. **Test with known positions**
  - Use Felix UI to verify our calculations
  - Test edge cases (no position, multiple positions)
  - Validate price data accuracy

2. **Performance testing**
  - Measure scan time per wallet
  - Test RPC rate limiting
  - Optimize query efficiency

**Deliverable:** Working single wallet scanner that outputs accurate health status

---

## Phase 2: Multi-Wallet Discovery

### Step 1: Position Discovery Engine
1. **Historical position discovery**
  - Scan event logs for CDP creation events
  - Extract all position IDs and owner addresses
  - Build comprehensive position database

2. **Real-time position monitoring**
  - Set up event listeners for new positions
  - Monitor position updates and closures
  - Maintain accurate position registry

3. **Data validation**
  - Filter out closed positions (zero debt)
  - Verify position data accuracy
  - Remove duplicate entries

### Step 2: Database Implementation
1. **Design database schema**
  - Positions table (ID, owner, collateral, debt)
  - Health history table (timestamps, LTV, status)
  - Price history table (asset prices over time)

2. **Implement data persistence**
  - Save discovered positions
  - Store health calculation results
  - Track historical position changes

3. **Add data management features**
  - Update existing positions
  - Archive closed positions
  - Clean up old historical data

### Step 3: Batch Processing System
1. **Design efficient batch scanning**
  - Process positions in configurable batch sizes
  - Implement proper rate limiting for RPC calls
  - Add retry logic for failed requests

2. **Optimize for scale**
  - Parallel processing where possible
  - Cache frequently accessed data
  - Minimize redundant contract calls

3. **Add monitoring dashboard**
  - Track scanning progress
  - Monitor system performance
  - Display critical positions count

**Deliverable:** System that discovers and monitors all Felix CDP positions

---

## Phase 3: Production System

### Step 1: Real-Time Monitoring
1. **Continuous scanning loop**
  - Implement configurable scan intervals
  - Priority scanning for critical positions
  - Graceful handling of system interruptions

2. **Event-driven updates**
  - React to price changes immediately
  - Process position updates in real-time
  - Minimize latency for critical alerts

3. **System health monitoring**
  - Track RPC connection status
  - Monitor scan completion rates
  - Alert on system failures

### Step 2: Alert System Integration
1. **Multi-channel alerting**
  - Discord webhooks for team notifications
  - Telegram bots for mobile alerts
  - Email for non-urgent summaries

2. **Smart alert filtering**
  - Avoid alert spam for minor changes
  - Prioritize by position size and risk
  - Customizable alert thresholds

3. **Alert delivery guarantee**
  - Retry failed alert deliveries
  - Multiple delivery channels as backup
  - Alert acknowledgment tracking

### Step 3: Performance & Reliability
1. **Optimize for production load**
  - Connection pooling for database
  - RPC endpoint failover
  - Memory usage optimization

2. **Add comprehensive logging**
  - Structured logging for debugging
  - Performance metrics collection
  - Error tracking and analysis

3. **Implement monitoring metrics**
  - Track key business metrics
  - System performance indicators
  - Custom Grafana dashboards

**Deliverable:** Production-ready system monitoring all Felix positions 24/7

---

## Success Criteria

### Phase 1 Completion
- [ ] Successfully scan any single wallet's position
- [ ] Accurate LTV calculation matching Felix UI
- [ ] Proper health status classification
- [ ] Sub-second scan time for single position

### Phase 2 Completion
- [ ] Discovery of 100% of active Felix positions
- [ ] Batch processing of 1000+ positions in under 30 seconds
- [ ] Persistent storage of position data
- [ ] Real-time tracking of new positions

### Phase 3 Completion
- [ ] 24/7 monitoring with 99.9% uptime
- [ ] Alert delivery within 5 seconds of threshold breach
- [ ] Zero missed liquidation events
- [ ] System handling all positions efficiently

