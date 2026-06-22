import { readdirSync } from 'fs';

const clientFile = readdirSync('./output').find(f => f.startsWith('Cliente'));

if (!clientFile) {
    console.error('[DCL] No client found in output/');
    process.exit(1);
}

await import(`./output/${clientFile}`);