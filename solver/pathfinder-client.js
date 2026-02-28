/**
 * Pathfinder Client — queries the deployed ink! PVM Pathfinder contract
 * for optimal cross-chain routing.
 *
 * Contract: 0x7013DC4df91c1A8f0D33d6D6F44310e1565FBb5c
 * Methods:
 *   - find_route(from: u32, to: u32) → Vec<u32>
 *   - get_edge_cost(from: u32, to: u32) → u128
 *
 * Since the Pathfinder is an ink!/PVM contract, direct EVM calls may not
 * work via ethers.js. This module provides:
 *   1. An attempt to query the on-chain Pathfinder via EVM interop
 *   2. A local fallback routing table for when the on-chain call fails
 */

const PATHFINDER_ADDRESS = '0x7013DC4df91c1A8f0D33d6D6F44310e1565FBb5c';
const POLKADOT_HUB_CHAIN_ID = 420420417;

// ── Local Routing Table (fallback) ──
// Known HRMP channels between Polkadot parachains
const ROUTES = {
    // From Polkadot Hub (420420417)
    '420420417→2000': { path: [420420417, 1000, 2000], cost: 100000000n, name: 'Hub → AssetHub → Acala' },
    '420420417→2004': { path: [420420417, 1000, 2004], cost: 100000000n, name: 'Hub → AssetHub → Moonbeam' },
    '420420417→2006': { path: [420420417, 1000, 2006], cost: 100000000n, name: 'Hub → AssetHub → Astar' },
    '420420417→2030': { path: [420420417, 1000, 2030], cost: 100000000n, name: 'Hub → AssetHub → Bifrost' },
    '420420417→2034': { path: [420420417, 1000, 2034], cost: 100000000n, name: 'Hub → AssetHub → Hydration' },
    '420420417→1000': { path: [420420417, 1000], cost: 50000000n, name: 'Hub → AssetHub (direct)' },
};

/**
 * Query the on-chain Pathfinder for the optimal route.
 * Falls back to local routing table if the contract call fails.
 *
 * @param {number} fromChain - Source chain ID
 * @param {number} toChain   - Destination chain ID
 * @param {object} provider  - ethers.js provider (optional, for on-chain query)
 * @returns {{ path: number[], cost: bigint, source: string }}
 */
export async function queryRoute(fromChain, toChain, provider = null) {
    // Try on-chain Pathfinder first
    if (provider) {
        try {
            const route = await queryOnChain(fromChain, toChain, provider);
            if (route && route.path.length > 0) {
                return { ...route, source: 'on-chain (PVM Pathfinder)' };
            }
        } catch (err) {
            // PVM contract not callable via EVM — expected on testnet
        }
    }

    // Fallback to local routing table
    return queryLocal(fromChain, toChain);
}

/**
 * Attempt to call the ink! Pathfinder via EVM interop.
 * This may fail if PVM↔EVM interop isn't available.
 */
async function queryOnChain(fromChain, toChain, provider) {
    const { ethers } = await import('ethers');

    // ink! contract selectors (first 4 bytes of blake2 hash of "Pathfinder::find_route")
    // For ink! contracts, the selector is computed differently than Solidity
    // This is a best-effort attempt — PVM contracts may not be callable via EVM staticcall
    const pathfinder = new ethers.Contract(PATHFINDER_ADDRESS, [
        'function find_route(uint32 from, uint32 to) view returns (uint32[])',
        'function get_edge_cost(uint32 from, uint32 to) view returns (uint128)',
    ], provider);

    const path = await pathfinder.find_route(fromChain, toChain);
    const cost = await pathfinder.get_edge_cost(fromChain, toChain);

    return {
        path: path.map(Number),
        cost: BigInt(cost),
    };
}

/**
 * Local routing table lookup.
 */
function queryLocal(fromChain, toChain) {
    const key = `${fromChain}→${toChain}`;
    const route = ROUTES[key];

    if (route) {
        return {
            path: route.path,
            cost: route.cost,
            source: `local table (${route.name})`,
        };
    }

    // Unknown route — direct path (best effort)
    return {
        path: [fromChain, toChain],
        cost: 200000000n, // ~0.02 PAS default fee estimate
        source: 'local table (direct, no known route)',
    };
}

/**
 * Format a route path as a readable string.
 * @param {number[]} path
 * @returns {string}
 */
export function formatRoute(path) {
    return path.map(id => {
        const names = {
            420420417: 'PolkadotHub',
            1000: 'AssetHub',
            2000: 'Acala',
            2004: 'Moonbeam',
            2006: 'Astar',
            2030: 'Bifrost',
            2034: 'Hydration',
        };
        return names[id] || `Para(${id})`;
    }).join(' → ');
}
