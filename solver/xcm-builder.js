/**
 * XCM Message Builder for IntentBridge Solver
 * 
 * Zero-dependency manual SCALE encoding of XCM v4 messages.
 * Reference: https://docs.polkadot.com/smart-contracts/precompiles/xcm/
 * 
 * Documented example (WithdrawAsset→BuyExecution→DepositAsset):
 * 0x050c000401000003008c86471301000003008c8647000d010101000000010100{32-byte-account}
 */

// ── Helpers ──

function hexToBytes(hex) {
    const clean = hex.replace(/^0x/, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function concat(...arrays) {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}

function u32LE(value) {
    return new Uint8Array([value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff]);
}

/** SCALE compact encode a BigInt */
function compact(value) {
    const v = BigInt(value);
    if (v < 64n) {
        return new Uint8Array([Number(v) << 2]);
    } else if (v < 16384n) {
        const n = (Number(v) << 2) | 1;
        return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
    } else if (v < 1073741824n) {
        const n = (Number(v) << 2) | 2;
        return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
    } else {
        const bytes = [];
        let rem = v;
        while (rem > 0n) {
            bytes.push(Number(rem & 0xffn));
            rem >>= 8n;
        }
        return new Uint8Array([((bytes.length - 4) << 2) | 3, ...bytes]);
    }
}

// ── XCM Instruction Encoders ──

/** WithdrawAsset([{ id: {parents, Here}, fun: Fungible(amount) }]) */
function withdrawAsset(amount) {
    return concat(
        new Uint8Array([0x00]),   // instruction index
        compact(1n),             // 1 asset in vec
        new Uint8Array([0x01]),   // parents = 1 (relay chain native token)
        new Uint8Array([0x00]),   // interior = Here
        new Uint8Array([0x00]),   // fun = Fungible (variant 0)
        compact(amount)           // amount
    );
}

/** BuyExecution({ fees: {parents, Here, Fungible(amount)}, weight_limit: Unlimited }) */
function buyExecution(feeAmount) {
    return concat(
        new Uint8Array([0x13]),   // instruction index
        new Uint8Array([0x01]),   // parents = 1
        new Uint8Array([0x00]),   // interior = Here
        new Uint8Array([0x00]),   // fun = Fungible (variant 0)
        compact(feeAmount),       // fee amount
        new Uint8Array([0x00])    // weight_limit = Unlimited
    );
}

/** DepositAsset({ assets: Wild(AllCounted(1)), beneficiary: {0, X1(AccountId32(id))} }) */
function depositAsset(accountId32Hex) {
    const accountBytes = hexToBytes(accountId32Hex);
    return concat(
        new Uint8Array([0x0d]),   // instruction index
        new Uint8Array([0x01]),   // assets = Wild
        new Uint8Array([0x01]),   // AllCounted
        u32LE(1),                // count (u32 LE, not compact)
        new Uint8Array([0x00]),   // beneficiary parents = 0
        new Uint8Array([0x01]),   // interior = X1
        new Uint8Array([0x01]),   // junction = AccountId32
        new Uint8Array([0x00]),   // network = None
        accountBytes              // 32-byte account
    );
}

/** DepositReserveAsset({ assets: Wild(AllCounted(1)), dest, xcm: [...] }) */
function depositReserveAsset(paraId, innerXcmBytes) {
    return concat(
        new Uint8Array([0x09]),   // instruction index
        new Uint8Array([0x01]),   // assets = Wild
        new Uint8Array([0x01]),   // AllCounted
        u32LE(1),                // count (u32 LE)
        new Uint8Array([0x01]),   // dest parents = 1
        new Uint8Array([0x01]),   // interior = X1
        new Uint8Array([0x00]),   // junction = Parachain
        u32LE(paraId),            // parachain ID
        innerXcmBytes             // nested XCM program
    );
}

// ── Public API ──

const PAS_UNITS = 10_000_000_000n;
const PAS_CENTS = PAS_UNITS / 100n;

/**
 * Build a simple local XCM transfer (WithdrawAsset → BuyExecution → DepositAsset).
 * @param {bigint} amountWei   - Amount in wei (18 decimals)
 * @param {string} beneficiary - 32-byte AccountId32 hex (0x prefixed)
 * @returns {string} Hex-encoded XCM message
 */
export function buildSimpleTransfer(amountWei, beneficiary) {
    const pasAmount = amountWei / 100_000_000n;  // wei (18 dec) → PAS (10 dec)
    const feeAmount = 10n * PAS_CENTS;

    const body = concat(
        withdrawAsset(pasAmount),
        buyExecution(feeAmount),
        depositAsset(beneficiary)
    );

    return bytesToHex(concat(
        new Uint8Array([0x05]),   // VersionedXcm::V4
        compact(3n),             // 3 instructions
        body
    ));
}

/**
 * Build a cross-chain transfer via DepositReserveAsset.
 * WithdrawAsset → BuyExecution → DepositReserveAsset(dest, [BuyExecution, DepositAsset])
 * @param {bigint} amountWei   - Amount in wei
 * @param {string} beneficiary - 32-byte AccountId32 hex
 * @param {number} destParaId  - Destination parachain ID
 * @returns {string} Hex-encoded XCM message
 */
export function buildCrossChainTransfer(amountWei, beneficiary, destParaId) {
    const pasAmount = amountWei / 100_000_000n;
    const localFee = 1n * PAS_UNITS;
    const remoteFee = 10n * PAS_CENTS;

    const innerXcm = concat(
        compact(2n),
        buyExecution(remoteFee),
        depositAsset(beneficiary)
    );

    const body = concat(
        withdrawAsset(pasAmount),
        buyExecution(localFee),
        depositReserveAsset(destParaId, innerXcm)
    );

    return bytesToHex(concat(
        new Uint8Array([0x05]),
        compact(3n),
        body
    ));
}

/**
 * Convert EVM H160 address to 32-byte AccountId32 (left-padded with zeros).
 * @param {string} evmAddress - 0x-prefixed 20-byte address
 * @returns {string} 0x-prefixed 32-byte hex
 */
export function evmToAccountId32(evmAddress) {
    const clean = evmAddress.replace('0x', '').toLowerCase();
    return '0x' + '00'.repeat(12) + clean;
}
