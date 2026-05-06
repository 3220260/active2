import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

function runGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const version = {
  updatedAt: new Date().toISOString(),
  commit: runGit(['rev-parse', '--short', 'HEAD']),
  branch: runGit(['branch', '--show-current']),
};

mkdirSync('assets', { recursive: true });
writeFileSync('assets/site-version.json', JSON.stringify(version, null, 2) + '\n');
console.log(`Site version updated: ${version.updatedAt}`);
