import { performance } from 'perf_hooks';

// Simulate sidecarApi.createVaultRow which makes a Tauri invoke
async function mockCreateVaultRow() {
    return new Promise(resolve => setTimeout(resolve, 20)); // 20ms per row network/ipc overhead
}

async function runSequential() {
    const start = performance.now();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();

    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    await mockCreateVaultRow();
    return performance.now() - start;
}

async function runParallel() {
    const start = performance.now();
    await Promise.all([
        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),

        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),
        mockCreateVaultRow(),
    ]);
    return performance.now() - start;
}

async function main() {
    let seqTotal = 0;
    let parTotal = 0;
    const iters = 10;
    for (let i=0; i<iters; i++) {
        seqTotal += await runSequential();
        parTotal += await runParallel();
    }
    console.log(`Sequential: ${seqTotal/iters}ms`);
    console.log(`Parallel: ${parTotal/iters}ms`);
    console.log(`Improvement: ${((seqTotal - parTotal)/seqTotal * 100).toFixed(2)}%`);
}

main();
