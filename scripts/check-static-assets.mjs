import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const checks = [
    {
        file: 'index.html',
        content: readFileSync(resolve(projectRoot, 'index.html'), 'utf8'),
        baseDir: projectRoot,
    },
    {
        file: 'assets/css/styles.css',
        content: readFileSync(resolve(projectRoot, 'assets/css/styles.css'), 'utf8'),
        baseDir: resolve(projectRoot, 'assets/css'),
    },
    {
        file: 'assets/css/tailwind.css',
        content: readFileSync(resolve(projectRoot, 'assets/css/tailwind.css'), 'utf8'),
        baseDir: resolve(projectRoot, 'assets/css'),
    },
];

const html = checks[0].content;
const failures = [];

if (/onclick\s*=/.test(html)) failures.push('index.html still contains inline onclick handlers.');
if (html.includes('cdn.tailwindcss.com')) failures.push('index.html still loads the Tailwind CDN.');
if (/energyModal|Enerwave/.test(html)) failures.push('Removed electricity offer references are still present.');

function isLocalAsset(value) {
    return value &&
        !value.startsWith('#') &&
        !value.startsWith('http://') &&
        !value.startsWith('https://') &&
        !value.startsWith('mailto:') &&
        !value.startsWith('tel:') &&
        !value.startsWith('viber:') &&
        !value.startsWith('javascript:') &&
        !value.startsWith('data:');
}

function normalizeReference(value) {
    return value.trim().replace(/^['"]|['"]$/g, '').split('#')[0].split('?')[0];
}

function assertExists(rawValue, baseDir, sourceFile) {
    const value = normalizeReference(rawValue);
    if (!isLocalAsset(value)) return;

    const absolutePath = resolve(baseDir, value);
    if (!existsSync(absolutePath)) {
        failures.push(`${sourceFile} references missing asset: ${value}`);
    }
}

const attrPattern = /\b(?:src|href|data-src|data-preview-src)=["']([^"']+)["']/g;
for (const match of html.matchAll(attrPattern)) {
    assertExists(match[1], projectRoot, 'index.html');
}

for (const check of checks.slice(1)) {
    const cssUrlPattern = /url\(([^)]+)\)/g;

    for (const match of check.content.matchAll(cssUrlPattern)) {
        assertExists(match[1], check.baseDir, check.file);
    }
}

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join('\n'));
    process.exit(1);
}

console.log('Static asset checks passed.');
