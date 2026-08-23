# Static Analysis Report — Slither

- **Tool**: Slither 0.11.6 (102 detectors)
- **Target**: `contracts/src/*` + OpenZeppelin v5 dependencies
- **Solidity**: 0.8.28 via solc-select
- **Result**: ✅ No high- or medium-severity vulnerabilities found
- **Raw output**: 26 informational results after remediation (was 31)

## Remediations Applied

| Finding | Resolution |
|---|---|
| `reentrancy-no-eth` / `reentrancy-benign` — state written after external call in `createCampaign` | Tracking state (`campaigns`, `campaignsByCreator`, `isCampaign`) now written **before** the external `initialize()` call (checks-effects-interactions) |
| `unused-return` — `Clones.cloneDeterministic` return ignored | Clone address now captured directly from return value; redundant `predictDeterministicAddress` call removed |
| `cache-array-length` — storage `.length` read in loop | Length cached in memory in `getActiveCampaigns()` |

## Accepted / False Positives

| Finding | Disposition |
|---|---|
| `missing-zero-check` on `Campaign.initialize(creator_)` | **False positive** — `_validate()` runs first and reverts with `ZeroAddress()` custom error; Slither does not trace into the private pure helper |
| `unused-return` in `getCampaignDetailsBulk` | **Intentional** — bulk view deliberately returns 6 of 8 campaign fields; `fundsWithdrawn`/`ipfsHash` omitted to bound memory arrays |
| `calls-loop` (`getCampaignDetailsBulk`, `getActiveCampaigns`) | **Accepted** — read-only view functions calling other campaigns in loops; no state changes, bounded gas risk only for off-chain callers |
| `reentrancy-events` in `createCampaign` | **Accepted** — event emitted after `initialize()`, which can only succeed once on a freshly created clone; no value at risk |
| `timestamp` dependence | **Inherent to design** — deadline logic requires block timestamps; 15-min drift is acceptable for crowdfunding windows |
| `low-level-calls` in `withdraw()`/`refund()` | **Best practice** — `call{value}` is the recommended ETH transfer pattern; success is checked with `TransferFailed()` revert; nonReentrant + CEI in place |
| `assembly`, `too-many-digits` | **OZ internals** — EIP-1167 clone bytecode construction inside OpenZeppelin `Clones.sol`; not project code |
| `pragma`/`solc-version` mixed ^0.8.20/^0.8.28 | **Standard** — OpenZeppelin declares floor pragma `^0.8.20`; our contracts pin `^0.8.28`; compiled with solc 0.8.28 across all files |

## Re-running the analysis

```powershell
python -m venv $env:TEMP\slither-venv
& "$env:TEMP\slither-venv\Scripts\pip.exe" install slither-analyzer
& "$env:TEMP\slither-venv\Scripts\solc-select.exe" install 0.8.28
& "$env:TEMP\slither-venv\Scripts\solc-select.exe" use 0.8.28
cd contracts
& "$env:TEMP\slither-venv\Scripts\slither.exe" .
```
