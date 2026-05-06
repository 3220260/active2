#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-index.html}"

if [[ ! -f "$FILE" ]]; then
  echo "Δεν βρέθηκε το $FILE"
  echo "Τρέξ' το από το root του project ή δώσε path: bash fix_wizard_labels.sh path/to/index.html"
  exit 1
fi

cp "$FILE" "$FILE.bak.$(date +%Y%m%d-%H%M%S)"

python3 - "$FILE" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
html = path.read_text(encoding="utf-8")

provider_re = re.compile(
    r'(<div class="flex items-center gap-2 flex-wrap mb-2">\s*)'
    r'<span class="inline-flex items-center rounded-full bg-(?:red|blue)-50 text-(?:red|blue)-700 px-3 py-1 text-xs font-extrabold tracking-wide uppercase">[^<]+</span>\s*'
    r'<span class="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">100€ / 12 μήνες</span>\s*'
    r'<span class="inline-flex items-center rounded-full bg-(?:amber|emerald)-50 text-(?:amber|emerald)-700 px-3 py-1 text-xs font-bold">[^<]+</span>\s*'
    r'(</div>)'
)

headers = [
    ("\\1<span class=\"inline-flex items-center rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-extrabold tracking-wide uppercase\">Vodafone CU</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold\">100€ / 12 μήνες</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-bold\">Φορητότητα</span>\n"
     "          \\2"),
    ("\\1<span class=\"inline-flex items-center rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-extrabold tracking-wide uppercase\">Vodafone CU</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold\">100€ / 12 μήνες</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold\">Νέος Αριθμός</span>\n"
     "          \\2"),
    ("\\1<span class=\"inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-extrabold tracking-wide uppercase\">NOVA Q</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold\">100€ / 12 μήνες</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-bold\">Φορητότητα</span>\n"
     "          \\2"),
    ("\\1<span class=\"inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-extrabold tracking-wide uppercase\">NOVA Q</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold\">100€ / 12 μήνες</span>\n"
     "            <span class=\"inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold\">Νέος Αριθμός</span>\n"
     "          \\2"),
]

count = 0

def replace_header(match):
    global count
    if count >= len(headers):
        return match.group(0)
    replacement = match.expand(headers[count])
    count += 1
    return replacement

html = provider_re.sub(replace_header, html)

if count < 4:
    raise SystemExit(f"Βρέθηκαν μόνο {count} wizard headers. Περίμενα 4. Δεν γράφω αλλαγές.")

sections = re.split(r'(<section\s+data-wizard\b)', html)
if len(sections) >= 9:
    rebuilt = [sections[0]]
    wizard_index = 0
    for i in range(1, len(sections), 2):
        marker = sections[i]
        content = sections[i + 1]
        wizard_index += 1
        if wizard_index in (3, 4):
            content = content.replace('Κάλεσε στο <span class="font-black text-slate-900">1252</span>.',
                                      'Κάλεσε στο <span class="font-black text-slate-900">12200</span>.')
            content = content.replace('Κάλεσε στο 1252.', 'Κάλεσε στο 12200.')
        rebuilt.append(marker)
        rebuilt.append(content)
    html = ''.join(rebuilt)

path.write_text(html, encoding="utf-8")
print(f"OK: διορθώθηκαν {count} wizard headers στο {path}")
print("Backup δημιουργήθηκε δίπλα στο index.html")
PY

echo
echo "Τώρα τρέξε:"
echo "npm run check"
