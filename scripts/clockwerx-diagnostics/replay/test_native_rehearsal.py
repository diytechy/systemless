import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "native_rehearsal", Path(__file__).with_name("compile-native-rehearsal.py"))
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)


class NativeRehearsalTests(unittest.TestCase):
    entry = dict(version=1, clock="frontend_ticks", application_partition_size=4096000,
                 actions=[dict(type="run", ticks=10)])

    def build(self, updates):
        literal = dict(updates=updates, holds=[dict(k="S", start=0, end=2, nominal=0)])
        return compiler.build(self.entry, literal, 1, 0, 1000, 20, False)

    def test_trailing_idle_releases_button_and_runs_entire_literal(self):
        scenario, captures, origin, _ = self.build(8)
        tick, release = 0, None
        for action in scenario["actions"]:
            tick += action.get("ticks", 0)
            if action["type"] == "key_up" and action["key"] == 55:
                release = tick
        self.assertEqual(origin, 10)
        self.assertEqual(release, 11)
        self.assertEqual(next(c["frontend"] for c in captures
                              if c["name"] == "goal-after-hold"), 34)

    def test_terminal_held_button_keeps_existing_margin(self):
        scenario, captures, _, _ = self.build(2)
        tick, release = 0, None
        for action in scenario["actions"]:
            tick += action.get("ticks", 0)
            if action["type"] == "key_up" and action["key"] == 55:
                release = tick
        self.assertEqual(release, 31)
        self.assertEqual(next(c["frontend"] for c in captures
                              if c["name"] == "goal-after-hold"), 31)

    def test_bounce_uses_option_modifier_and_preserves_hold_and_release(self):
        literal = dict(updates=8, holds=[dict(k="B", start=0, end=6, nominal=4)])
        scenario, captures, _, _ = compiler.build(self.entry, literal, 1, 0, 1000, 20, False)
        tick, edges = 0, []
        for action in scenario["actions"]:
            tick += action.get("ticks", 0)
            if action["type"] in ("key_down", "key_up") and action["key"] == 58:
                edges.append((action["type"], tick, action["ch"]))
        self.assertEqual(edges, [("key_down", 10, 0), ("key_up", 13, 0)])
        self.assertEqual(next(c["frontend"] for c in captures
                              if c["name"] == "input-01-B-nominal"), 13)


if __name__ == "__main__":
    unittest.main()
