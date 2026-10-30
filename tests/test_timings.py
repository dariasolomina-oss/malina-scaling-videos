from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'engine/scripts'))
import timings


class TimingTests(unittest.TestCase):
    def test_words_and_whisper(self):
        for source in ('words', 'whisper'):
            value = timings.normalize({'words':[{'word':'Bonjour', 'start':0, 'end':.5}]}, source)
            self.assertEqual(value['words'][0]['text'], 'Bonjour')
            self.assertEqual(value['accuracy'], 'not_verified')

    def test_alignment(self):
        result = timings.normalize(dict(alignment=dict(characters=list('Hi toi'), character_start_times_seconds=[0,.1,.2,.3,.4,.5], character_end_times_seconds=[.1,.2,.3,.4,.5,.6])), 'elevenlabs')
        self.assertEqual(result['words'], [dict(text='Hi', start=0.0, end=.2), dict(text='toi', start=.3, end=.6)])

    def test_invalid_words(self):
        for words in ([], [dict(text='',start=0,end=1)], [dict(text='a',start=-1,end=1)], [dict(text='a',start=1,end=1)], [dict(text='a',start=True,end=1)], [dict(text='a',start=0,end=float('nan'))], [dict(text='a',start=0,end=2),dict(text='b',start=1,end=3)]):
            with self.subTest(words=words), self.assertRaises(ValueError): timings.validate_words(words)

    def test_bad_alignment(self):
        for chars, starts, ends in [(['a'],[],[]), (['ab'],[0],[1]), (['a','b'],[0,.1],[.3,.2]), (['a'],[0],[0])]:
            with self.assertRaises(ValueError): timings.alignment_words(dict(characters=chars,character_start_times_seconds=starts,character_end_times_seconds=ends))


if __name__ == '__main__': unittest.main()
