import numpy as np
import pandas as pd
from typing import List, Dict, Any
from app.schemas.schemas import BaselineMetrics
from app.models.models import Metric

class BaselineEngine:
    @staticmethod
    def calculate_baseline(metrics: List[Metric]) -> BaselineMetrics:
        if not metrics:
            # Fallback zero baseline
            return BaselineMetrics(
                mean_cpu=0.0, p95_cpu=0.0, p99_cpu=0.0, peak_cpu=0.0,
                mean_memory=0.0, p95_memory=0.0, peak_memory=0.0,
                avg_request_volume=0.0, p95_request_volume=0.0, peak_request_volume=0.0,
                mean_latency=0.0, p95_latency=0.0, p99_latency=0.0,
                availability=100.0
            )

        cpu_vals = [m.cpu_utilization for m in metrics]
        mem_vals = [m.memory_utilization for m in metrics]
        req_vals = [m.request_volume for m in metrics]
        lat_avg_vals = [m.average_latency for m in metrics]
        lat_p95_vals = [m.p95_latency for m in metrics]
        avail_vals = [m.availability for m in metrics]

        return BaselineMetrics(
            mean_cpu=float(np.mean(cpu_vals)),
            p95_cpu=float(np.percentile(cpu_vals, 95)),
            p99_cpu=float(np.percentile(cpu_vals, 99)),
            peak_cpu=float(np.max(cpu_vals)),
            
            mean_memory=float(np.mean(mem_vals)),
            p95_memory=float(np.percentile(mem_vals, 95)),
            peak_memory=float(np.max(mem_vals)),
            
            avg_request_volume=float(np.mean(req_vals)),
            p95_request_volume=float(np.percentile(req_vals, 95)),
            peak_request_volume=float(np.max(req_vals)),
            
            mean_latency=float(np.mean(lat_avg_vals)),
            p95_latency=float(np.percentile(lat_p95_vals, 95)),
            p99_latency=float(np.percentile(lat_p95_vals, 99)),
            
            availability=float(np.mean(avail_vals))
        )
