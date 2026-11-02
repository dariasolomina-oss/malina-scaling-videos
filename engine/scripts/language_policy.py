"""English-only output policy: a conservative script guard, not language detection.

Latin-script French/Spanish can pass. Semantic English review of all video,
on-screen text, voice, captions and metadata is mandatory. Codec validation
cannot certify audio language. Research quotations may be non-English inputs;
write their summaries in English. Callers exclude source URLs, machine paths
and authorship names, which are not output prose. No translation or hash edits.
"""
import re
import unicodedata

REVIEW = ('English-only output required. Correct the source in English and obtain '
          'fresh human approval; do not translate approved assets in place. '
          'This script guard does not prove English: Latin-script non-English '
          'text can pass. Semantic English review is mandatory.')


def require_language(value, field='episode language'):
    """Require the exact declared language, including on reloaded state."""
    if value != 'en':
        raise ValueError(f"{field}: exact 'en' required. {REVIEW}")


def require_output_text(value, field='output text'):
    """Reject non-Latin Unicode letters; allow accents, digits and punctuation."""
    if not isinstance(value, str):
        raise ValueError(f'{field}: text required. {REVIEW}')
    if any(unicodedata.category(char).startswith('L') and
           'LATIN' not in unicodedata.name(char, '') for char in value):
        raise ValueError(f'{field}: non-Latin letters are not allowed. {REVIEW}')
    return value


def require_script(text, field='script'):
    """Check prose, excluding literal HTTP(S) source URLs (including paths).

    This is not a Markdown parser or a semantic language detector. Non-English
    source quotations belong in research inputs, not the production script.
    """
    if not isinstance(text, str) or not text.strip():
        raise ValueError(f'{field}: nonempty text required. {REVIEW}')
    prose = re.sub(r'https?://[^\s<>\[\]()]+', '', text)
    require_output_text(prose, field)
    return text


def require_words(normalized):
    """Check supplied caption/voice text, never claim to detect audio language."""
    for word in normalized['words']:
        require_output_text(word['text'], 'supplied voice/caption words')
    return normalized
