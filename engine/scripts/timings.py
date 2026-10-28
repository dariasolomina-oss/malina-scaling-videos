#!/usr/bin/env python3
"""Normalize supplied word timestamps; no alignment or transcription API calls."""
import argparse
import json
import math
from pathlib import Path


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('timestamp must be a finite number')
    return float(value)


def validate_words(words):
    if not isinstance(words, list) or not words:
        raise ValueError('nonempty words array required')
    result, previous_end = [], 0.0
    for word in words:
        text = word.get('text', word.get('word'))
        if not isinstance(text, str) or not text.strip():
            raise ValueError('word text required')
        start, end = number(word['start']), number(word['end'])
        if start < 0 or end <= start or start < previous_end - 1e-9:
            raise ValueError('word times must be positive duration, ordered and nonoverlapping')
        result.append(dict(text=text.strip(), start=start, end=end))
        previous_end = end
    return result


def alignment_words(alignment):
    chars = alignment['characters']
    starts = alignment['character_start_times_seconds']
    ends = alignment['character_end_times_seconds']
    if not isinstance(chars, list) or not chars or not (len(chars) == len(starts) == len(ends)):
        raise ValueError('alignment arrays must have equal nonzero length')
    words, text, start, end, previous = [], '', None, None, 0.0
    for char, s, e in zip(chars, starts, ends):
        s, e = number(s), number(e)
        if not isinstance(char, str) or len(char) != 1 or s < 0 or e < s or s < previous - 1e-9:
            raise ValueError('invalid or overlapping character alignment')
        previous = e
        if char.isspace():
            if text:
                words.append(dict(text=text, start=start, end=end))
                text, start, end = '', None, None
        else:
            start = s if start is None else start
            end = e
            text += char
    if text:
        words.append(dict(text=text, start=start, end=end))
    return validate_words(words)


def normalize(data, source='words'):
    if source == 'elevenlabs':
        alignment = data.get('alignment') or data.get('normalized_alignment') or data
        words = alignment_words(alignment)
    elif source in ('words', 'whisper'):
        words = validate_words(data if isinstance(data, list) else data['words'])
    else:
        raise ValueError('unsupported timing source')
    return dict(schema_version=1, unit='seconds', source=source, words=words,
                accuracy='not_verified')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('input', type=Path); p.add_argument('output', type=Path)
    p.add_argument('--source', choices=['words', 'elevenlabs', 'whisper'], default='words')
    a = p.parse_args()
    try:
        result = normalize(json.loads(a.input.read_text(encoding='utf-8')), a.source)
        a.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as e:
        p.exit(2, f'error: {e}\n')


if __name__ == '__main__':
    main()
