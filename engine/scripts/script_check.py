#!/usr/bin/env python3
"""Basic mechanical checks, never an editorial or human approval."""
import argparse
import hashlib
import json
import re
from pathlib import Path


def check(text, max_words=180):
    words = re.findall(r"\b[\w’'-]+\b", text, re.UNICODE)
    errors = []
    if not words: errors.append('empty_script')
    if len(words) > max_words: errors.append('word_limit_exceeded')
    if re.search(r'\b(TODO|TBD|FIXME)\b|\{\{.*?\}\}', text, re.I): errors.append('unresolved_placeholder')
    if any(ord(c) < 32 and c not in '\n\r\t' for c in text): errors.append('control_character')
    return dict(schema_version=1, script_hash=hashlib.sha256(text.encode('utf-8')).hexdigest(),
                machine=dict(passed=not errors, errors=errors, word_count=len(words), max_words=max_words),
                editorial=dict(status='pending', checks=['facts_and_claims', 'brand_and_tone', 'spoken_delivery', 'legal_and_rights']),
                grants_approval=False)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('script', type=Path); p.add_argument('--max-words', type=int, default=180)
    a = p.parse_args()
    if a.max_words <= 0: p.error('--max-words must be positive')
    try:
        result = check(a.script.read_text(encoding='utf-8'), a.max_words)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result['machine']['passed'] else 1
    except OSError as e:
        p.exit(2, f'error: {e}\n')


if __name__ == '__main__':
    raise SystemExit(main())
