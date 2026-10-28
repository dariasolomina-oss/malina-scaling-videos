from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'engine/scripts'))
from script_check import check


class ScriptCheckTests(unittest.TestCase):
    def test_mechanical_pass_editorial_pending(self):
        result = check('Bonjour, voici LakeSentry.')
        self.assertTrue(result['machine']['passed'])
        self.assertEqual(result['editorial']['status'], 'pending')
        self.assertFalse(result['grants_approval'])

    def test_negative_checks(self):
        for text in ('', 'TODO préciser', '{{claim}}', 'bad\x00text'):
            self.assertFalse(check(text)['machine']['passed'])
        self.assertIn('word_limit_exceeded', check('one two three', 2)['machine']['errors'])

    def test_hash_change(self):
        self.assertNotEqual(check('a')['script_hash'], check('b')['script_hash'])


if __name__ == '__main__': unittest.main()
