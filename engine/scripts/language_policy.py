"""English-only output metadata and prose checks, NOT language detection.

Latin-script non-English text can pass. Human semantic review of prose and actual
speech is mandatory; codec/timing checks do not establish English speech.
"""
import unicodedata


def require_en(value):
    if value != 'en':
        raise ValueError('output language must be exactly en')


def check_prose(value):
    """Reject non-Latin letters in authored output prose, not source identifiers."""
    if not isinstance(value, str):
        raise ValueError('output prose must be text')
    for character in value:
        if character.isalpha() and 'LATIN' not in unicodedata.name(character, ''):
            raise ValueError('output prose contains non-Latin letters; English review required')
