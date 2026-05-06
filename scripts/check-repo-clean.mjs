import { execFileSync } from 'node:child_process';
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const forbidden = files.filter((file) => file === '.DS_Store' || file.endsWith('/.DS_Store') || file === 'node_modules' || file.startsWith('node_modules/'));
if (forbidden.length) {
  console.error('Forbidden generated/local files are tracked:');
  for (const file of forbidden) console.error('- ' + file);
  process.exit(1);
}
console.log('Repository cleanliness checks passed.');
