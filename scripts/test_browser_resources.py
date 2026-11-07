import unittest
from analyze_browser_resources import summarize_resources,timestamp


class ResourceTests(unittest.TestCase):
    def process(self,pid,cpu,name='browser'):
        return dict(pid=pid,name=name,cpuSeconds=cpu,workingSetBytes=100,privateBytes=50)
    def sample(self,second,processes):
        return dict(at='2026-11-07T00:00:0%d+00:00'%second,hostTotalCpuPercent=20+second,processes=processes)
    def summary(self,samples,start=0,end=2):
        return summarize_resources(dict(logicalProcessors=4,samples=samples),'2026-11-07T00:00:0%dZ'%start,'2026-11-07T00:00:0%dZ'%end)
    def test_cpu_normalization_and_memory_boundary(self):
        report=self.summary([self.sample(i,[self.process(1,10+i)]) for i in range(3)])
        self.assertEqual(report['aggregateCpuPercentOfHostTimeWeighted'],25)
        self.assertEqual(report['cpuSecondsByProcessName'],{'browser':2})
        self.assertEqual(report['aggregateWorkingSetBytes']['median'],100)
        self.assertTrue(report['coverageBracketsCapture'])
    def test_process_churn_and_cpu_reset_are_not_counted_as_usage(self):
        report=self.summary([self.sample(0,[self.process(1,10),self.process(2,100)]),
            self.sample(1,[self.process(1,11),self.process(3,500)]),
            self.sample(2,[self.process(1,1),self.process(3,501)])])
        self.assertEqual(report['aggregateCpuPercentOfHostTimeWeighted'],25)
        self.assertEqual(report['reducedSamples'][1]['newProcessesNotCountedForCpu'],1)
        self.assertEqual(report['reducedSamples'][1]['exitedProcessesNotCountedForCpu'],1)
        self.assertEqual(report['reducedSamples'][2]['invalidCpuPairs'],1)
    def test_incomplete_interval_and_invalid_window(self):
        with self.assertRaises(ValueError):self.summary([self.sample(0,[])])
        with self.assertRaises(ValueError):self.summary([self.sample(0,[]),self.sample(1,[])],1,1)
    def test_windows_seven_digit_timestamps(self):
        self.assertEqual(timestamp('2026-11-07T21:53:27.9908876+00:00').microsecond,990887)


if __name__=='__main__':unittest.main()
