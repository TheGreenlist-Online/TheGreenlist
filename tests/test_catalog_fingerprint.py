import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('fingerprint', Path(__file__).resolve().parents[1] / 'scripts/check-catalog-fingerprint.py')
fingerprint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fingerprint)

class CatalogFingerprintTest(unittest.TestCase):
    def test_match_and_missing_extra_changed_categories(self):
        expected={'tables':{'count':30,'md5':'synthetic'},'policies':{'count':93,'md5':'synthetic'}}
        self.assertTrue(all(c['status']=='PASS' for c in fingerprint.compare(expected,expected)))
        for actual in ({}, {'tables':expected['tables']}, {**expected,'extra':{}},
                       {**expected,'policies':{'count':93,'md5':'changed'}}):
            self.assertTrue(any(c['status']=='FAIL' for c in fingerprint.compare(expected,actual)))
        self.assertTrue(any(c['status']=='FAIL' for c in fingerprint.compare({},{})))
