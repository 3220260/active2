#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-index.html}"

if [[ ! -f "$FILE" ]]; then
  echo "Δεν βρέθηκε το $FILE"
  echo "Τρέξ' το από το root του project ή δώσε path: bash fix_mobile_modal_wrapper.sh path/to/index.html"
  exit 1
fi

python3 - "$FILE" <<'PY'
from pathlib import Path
import re
import sys
from datetime import datetime

path = Path(sys.argv[1])
html = path.read_text(encoding="utf-8")

if 'id="mobileModal"' in html:
    print('OK: υπάρχει ήδη id="mobileModal". Δεν κάνω αλλαγή για να μη διπλώσω το modal.')
    print('Έλεγξε χειροκίνητα αν το mobileOffersProviderGrid είναι μέσα στο mobileModal.')
    raise SystemExit(0)

if 'id="mobileOffersProviderGrid"' not in html:
    raise SystemExit('Δεν βρέθηκε id="mobileOffersProviderGrid". Δεν μπορώ να κάνω ασφαλές fix.')

pattern = re.compile(
    r'(?P<grid><div\s+id="mobileOffersProviderGrid"[\s\S]*?</div>)\s*(?=<!-- VODAFONE - ΕΠΙΛΟΓΗ ΤΥΠΟΥ ΔΙΑΔΙΚΑΣΙΑΣ -->)'
)

match = pattern.search(html)
if not match:
    raise SystemExit('Βρήκα mobileOffersProviderGrid, αλλά όχι ακριβώς πριν από το Vodafone choice comment. Δεν γράφω αλλαγές.')

grid = match.group('grid')

replacement = (
    '<div id="mobileModal" class="hidden fixed inset-0 z-[9999] modal-backdrop flex items-center justify-center p-2 md:p-4">\n'
    '  <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] flex flex-col max-h-[90vh]">\n'
    '    <div class="flex justify-between items-center p-5 border-b shrink-0">\n'
    '      <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight">Επιλέξτε Πάροχο</h3>\n'
    '      <button\n'
    '        type="button"\n'
    '        data-modal-close="mobileModal"\n'
    '        class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 transition-colors"\n'
    '      >&times;</button>\n'
    '    </div>\n\n'
    f'    {grid}\n'
    '  </div>\n'
    '</div>\n\n'
)

backup = path.with_name(f'{path.name}.bak.{datetime.now().strftime("%Y%m%d-%H%M%S")}')
backup.write_text(html, encoding="utf-8")

html = html[:match.start()] + replacement + html[match.end():]
path.write_text(html, encoding="utf-8")

print(f'OK: ξαναμπήκε το wrapper του mobileModal στο {path}')
print(f'Backup: {backup}')
PY

echo
echo "Έλεγχος θέσεων:"
grep -n 'id="mobileModal"\|id="mobileOffersProviderGrid"\|VODAFONE - ΕΠΙΛΟΓΗ' "$FILE" || true

echo
echo "Τώρα τρέξε:"
echo "npm run check"
