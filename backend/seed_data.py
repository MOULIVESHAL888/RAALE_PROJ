import os
import json
import csv
import math
import random
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import User, Resource, Metric, InstanceCatalog, PricingHistory, Scenario, Recommendation, AuditLog

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    print("[INFO] Starting Synthetic Hospital Cloud Rightsizing Database Seeding...")

    # 1. Seed Users
    print("  -> Seeding Users...")
    users = [
        User(username="admin", email="admin@hospital.org", role="ADMIN", full_name="System Administrator"),
        User(username="cloud.engineer", email="engineer@hospital.org", role="CLOUD_ENGINEER", full_name="Lead Cloud Engineer"),
        User(username="reviewer", email="reviewer@hospital.org", role="REVIEWER", full_name="FinOps Reviewer"),
        User(username="viewer", email="viewer@hospital.org", role="VIEWER", full_name="Hospital Operations Analyst")
    ]
    for u in users:
        if not db.query(User).filter(User.username == u.username).first():
            db.add(u)
    db.commit()

    # 2. Seed Instance Catalog
    print("  -> Seeding Instance Catalog...")
    catalog_data = [
        {"instance_type": "t3.micro", "vcpu": 2, "memory_gb": 1.0, "hourly_price": 0.0104, "monthly_price": 7.59, "network_capacity": "Up to 5 Gbps", "performance_score": 15},
        {"instance_type": "t3.small", "vcpu": 2, "memory_gb": 2.0, "hourly_price": 0.0208, "monthly_price": 15.18, "network_capacity": "Up to 5 Gbps", "performance_score": 30},
        {"instance_type": "t3.medium", "vcpu": 2, "memory_gb": 4.0, "hourly_price": 0.0416, "monthly_price": 30.37, "network_capacity": "Up to 5 Gbps", "performance_score": 60},
        {"instance_type": "t3.large", "vcpu": 2, "memory_gb": 8.0, "hourly_price": 0.0832, "monthly_price": 60.74, "network_capacity": "Up to 5 Gbps", "performance_score": 120},
        {"instance_type": "t3.xlarge", "vcpu": 4, "memory_gb": 16.0, "hourly_price": 0.1664, "monthly_price": 121.47, "network_capacity": "Up to 5 Gbps", "performance_score": 240},
        {"instance_type": "t3.2xlarge", "vcpu": 8, "memory_gb": 32.0, "hourly_price": 0.3328, "monthly_price": 242.94, "network_capacity": "Up to 5 Gbps", "performance_score": 480},
        {"instance_type": "m5.large", "vcpu": 2, "memory_gb": 8.0, "hourly_price": 0.0960, "monthly_price": 70.08, "network_capacity": "Up to 10 Gbps", "performance_score": 150},
        {"instance_type": "m5.xlarge", "vcpu": 4, "memory_gb": 16.0, "hourly_price": 0.1920, "monthly_price": 140.16, "network_capacity": "Up to 10 Gbps", "performance_score": 300},
        {"instance_type": "m5.2xlarge", "vcpu": 8, "memory_gb": 32.0, "hourly_price": 0.3840, "monthly_price": 280.32, "network_capacity": "Up to 10 Gbps", "performance_score": 600},
        {"instance_type": "m5.4xlarge", "vcpu": 16, "memory_gb": 64.0, "hourly_price": 0.7680, "monthly_price": 560.64, "network_capacity": "Up to 10 Gbps", "performance_score": 1200},
        {"instance_type": "r5.large", "vcpu": 2, "memory_gb": 16.0, "hourly_price": 0.1260, "monthly_price": 91.98, "network_capacity": "Up to 10 Gbps", "performance_score": 180},
        {"instance_type": "r5.xlarge", "vcpu": 4, "memory_gb": 32.0, "hourly_price": 0.2520, "monthly_price": 183.96, "network_capacity": "Up to 10 Gbps", "performance_score": 360},
        {"instance_type": "r5.2xlarge", "vcpu": 8, "memory_gb": 64.0, "hourly_price": 0.5040, "monthly_price": 367.92, "network_capacity": "Up to 10 Gbps", "performance_score": 720},
        {"instance_type": "c5.large", "vcpu": 2, "memory_gb": 4.0, "hourly_price": 0.0850, "monthly_price": 62.05, "network_capacity": "Up to 10 Gbps", "performance_score": 170},
        {"instance_type": "c5.xlarge", "vcpu": 4, "memory_gb": 8.0, "hourly_price": 0.1700, "monthly_price": 124.10, "network_capacity": "Up to 10 Gbps", "performance_score": 340},
        {"instance_type": "c5.2xlarge", "vcpu": 8, "memory_gb": 16.0, "hourly_price": 0.3400, "monthly_price": 248.20, "network_capacity": "Up to 10 Gbps", "performance_score": 680}
    ]
    for cat in catalog_data:
        if not db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == cat["instance_type"]).first():
            db.add(InstanceCatalog(**cat))
    db.commit()

    # 3. Seed Pricing History
    print("  -> Seeding Pricing History...")
    for cat in catalog_data:
        if not db.query(PricingHistory).filter(PricingHistory.instance_type == cat["instance_type"]).first():
            db.add(PricingHistory(
                instance_type=cat["instance_type"],
                effective_date=datetime(2026, 1, 1),
                hourly_price=cat["hourly_price"],
                currency="USD",
                cloud_provider="AWS"
            ))
    db.commit()

    # 4. Seed Operating Scenarios
    print("  -> Seeding Operating Scenarios...")
    scenarios_data = [
        {
            "id": "normal",
            "name": "Scenario 1 — Normal Workload",
            "description": "Stable clinical traffic with moderate CPU and memory utilization, low latency, and high availability.",
            "traffic_multiplier": 1.0,
            "cpu_multiplier": 1.0,
            "memory_multiplier": 1.0,
            "latency_adder_ms": 0.0,
            "availability_impact": 0.0,
            "expected_result": "Rightsizing should usually be safe as resources operate within normal headroom."
        },
        {
            "id": "peak",
            "name": "Scenario 2 — Peak Hospital Activity",
            "description": "High request volume during peak hospital hours (shift handovers, emergency surges, outpatient peak), high CPU/memory usage, and elevated latency.",
            "traffic_multiplier": 1.65,
            "cpu_multiplier": 1.45,
            "memory_multiplier": 1.30,
            "latency_adder_ms": 45.0,
            "availability_impact": -0.05,
            "expected_result": "Some rightsizing recommendations must be rejected or marked for review because performance risk is too high during peak demand."
        },
        {
            "id": "bursty",
            "name": "Scenario 3 — Bursty / Unpredictable Workload",
            "description": "Unpredictable traffic spikes, variable request volume, high P95/P99 CPU, and periodic latency spikes.",
            "traffic_multiplier": 1.85,
            "cpu_multiplier": 1.60,
            "memory_multiplier": 1.40,
            "latency_adder_ms": 75.0,
            "availability_impact": -0.10,
            "expected_result": "Rightsizing may look cost-effective under average usage but becomes unsafe when peak/burst demand is considered."
        },
        {
            "id": "backup",
            "name": "Scenario 4 — Over-Provisioned Backup Workload",
            "description": "Scheduled off-peak data replication, low CPU/memory utilization, predictable traffic, and minimal latency sensitivity.",
            "traffic_multiplier": 0.70,
            "cpu_multiplier": 0.60,
            "memory_multiplier": 0.55,
            "latency_adder_ms": -10.0,
            "availability_impact": 0.01,
            "expected_result": "Aggressive rightsizing produces significant cost savings with minimal performance risk."
        }
    ]
    for s in scenarios_data:
        if not db.query(Scenario).filter(Scenario.id == s["id"]).first():
            db.add(Scenario(**s))
    db.commit()

    # 5. Seed Resources
    print("  -> Seeding Hospital Cloud Resources...")
    resources_data = [
        {
            "id": "res-pacs-01",
            "name": "PACS Medical Image Processing",
            "department": "Radiology Dept",
            "cloud_account": "prod-med-img-acc",
            "region": "us-east-1",
            "workload_type": "PACS Medical Image Processing",
            "current_instance_type": "m5.2xlarge",
            "monthly_cost": 280.32,
            "risk_classification": "LOW",
            "status": "SAFE_TO_RIGHTSIZE"
        },
        {
            "id": "res-pats-02",
            "name": "Patient Records API",
            "department": "EHR & Clinical IT",
            "cloud_account": "prod-core-api-acc",
            "region": "us-east-1",
            "workload_type": "Patient Records API",
            "current_instance_type": "m5.xlarge",
            "monthly_cost": 140.16,
            "risk_classification": "MEDIUM",
            "status": "SAFE_TO_RIGHTSIZE"
        },
        {
            "id": "res-back-03",
            "name": "Hospital Backup Service",
            "department": "IT Infrastructure",
            "cloud_account": "backup-disaster-acc",
            "region": "us-west-2",
            "workload_type": "Hospital Backup Service",
            "current_instance_type": "m5.2xlarge",
            "monthly_cost": 280.32,
            "risk_classification": "LOW",
            "status": "SAFE_TO_RIGHTSIZE"
        },
        {
            "id": "res-logs-04",
            "name": "Clinical Logs Service",
            "department": "Compliance & Security",
            "cloud_account": "audit-logs-acc",
            "region": "us-east-1",
            "workload_type": "Clinical Logs",
            "current_instance_type": "t3.xlarge",
            "monthly_cost": 121.47,
            "risk_classification": "MEDIUM",
            "status": "REVIEW_REQUIRED"
        },
        {
            "id": "res-labs-05",
            "name": "Lab Results Processing",
            "department": "Pathology Dept",
            "cloud_account": "prod-lab-acc",
            "region": "us-central-1",
            "workload_type": "Lab Results Processing",
            "current_instance_type": "r5.xlarge",
            "monthly_cost": 183.96,
            "risk_classification": "LOW",
            "status": "SAFE_TO_RIGHTSIZE"
        },
        {
            "id": "res-emer-06",
            "name": "Emergency Department API",
            "department": "Emergency Dept",
            "cloud_account": "prod-emergency-acc",
            "region": "us-east-1",
            "workload_type": "Emergency Department API",
            "current_instance_type": "m5.2xlarge",
            "monthly_cost": 280.32,
            "risk_classification": "HIGH",
            "status": "REVIEW_REQUIRED"
        },
        {
            "id": "res-appt-07",
            "name": "Appointment Service",
            "department": "Outpatient Care",
            "cloud_account": "prod-portal-acc",
            "region": "us-east-1",
            "workload_type": "Appointment Service",
            "current_instance_type": "t3.large",
            "monthly_cost": 60.74,
            "risk_classification": "LOW",
            "status": "SAFE_TO_RIGHTSIZE"
        },
        {
            "id": "res-bill-08",
            "name": "Billing & Claims Processing",
            "department": "Finance & Revenue",
            "cloud_account": "finance-acc",
            "region": "us-east-1",
            "workload_type": "Billing Service",
            "current_instance_type": "m5.xlarge",
            "monthly_cost": 140.16,
            "risk_classification": "MEDIUM",
            "status": "SAFE_TO_RIGHTSIZE"
        }
    ]

    for r_data in resources_data:
        if not db.query(Resource).filter(Resource.id == r_data["id"]).first():
            db.add(Resource(**r_data))
    db.commit()

    # 6. Generate 90 Days of Hourly Synthetic Metrics (2,160 metrics per resource)
    print("  -> Generating 90 days (2,160 hourly data points per resource) of realistic synthetic workload metrics...")

    end_time = datetime(2026, 10, 1, 0, 0, 0)
    start_time = end_time - timedelta(days=90)
    hours_count = 90 * 24

    # Seed parameters for each workload type
    profiles = {
        "res-pacs-01": {"base_cpu": 40.0, "cpu_var": 15.0, "base_mem": 52.0, "mem_var": 8.0, "base_req": 850, "lat_base": 180.0, "price": 0.3840},
        "res-pats-02": {"base_cpu": 38.0, "cpu_var": 12.0, "base_mem": 48.0, "mem_var": 6.0, "base_req": 1400, "lat_base": 120.0, "price": 0.1920},
        "res-back-03": {"base_cpu": 12.0, "cpu_var": 5.0, "base_mem": 20.0, "mem_var": 4.0, "base_req": 150, "lat_base": 45.0, "price": 0.3840}, # Highly overprovisioned
        "res-logs-04": {"base_cpu": 35.0, "cpu_var": 25.0, "base_mem": 60.0, "mem_var": 10.0, "base_req": 3200, "lat_base": 95.0, "price": 0.1664}, # Bursty log ingest
        "res-labs-05": {"base_cpu": 32.0, "cpu_var": 14.0, "base_mem": 42.0, "mem_var": 7.0, "base_req": 600, "lat_base": 140.0, "price": 0.2520},
        "res-emer-06": {"base_cpu": 54.0, "cpu_var": 18.0, "base_mem": 65.0, "mem_var": 9.0, "base_req": 2100, "lat_base": 210.0, "price": 0.3840}, # Peak ED load
        "res-appt-07": {"base_cpu": 28.0, "cpu_var": 10.0, "base_mem": 35.0, "mem_var": 5.0, "base_req": 450, "lat_base": 85.0, "price": 0.0832},
        "res-bill-08": {"base_cpu": 30.0, "cpu_var": 16.0, "base_mem": 44.0, "mem_var": 8.0, "base_req": 750, "lat_base": 110.0, "price": 0.1920}
    }

    metrics_to_insert = []
    # Check if metrics already exist
    existing_count = db.query(Metric).count()
    if existing_count < 1000:
        random.seed(42)
        np.random.seed(42)

        for res in db.query(Resource).all():
            prof = profiles.get(res.id, profiles["res-pacs-01"])
            for h in range(hours_count):
                current_timestamp = start_time + timedelta(hours=h)
                hour_of_day = current_timestamp.hour
                day_of_week = current_timestamp.weekday() # 0 = Mon, 6 = Sun

                # Diurnal pattern (peak hospital hours: 8 AM - 6 PM)
                if 8 <= hour_of_day <= 18:
                    diurnal_factor = 1.35 + 0.15 * math.sin((hour_of_day - 8) / 10.0 * math.pi)
                elif 0 <= hour_of_day <= 5: # Night time quiet period
                    diurnal_factor = 0.55
                else: # Evening transition
                    diurnal_factor = 0.85

                # Weekend factor
                weekend_factor = 0.65 if day_of_week in [5, 6] else 1.0
                if res.id == "res-emer-06": # Emergency dept is higher on weekends
                    weekend_factor = 1.25

                # Nightly backup spike for backup service at 2 AM
                if res.id == "res-back-03" and hour_of_day == 2:
                    diurnal_factor = 2.8

                # Random noise
                noise = np.random.normal(0, 1.0)
                
                # Bursty spikes for logs
                burst_factor = 1.0
                if res.id == "res-logs-04" and random.random() < 0.04: # 4% probability of log spike
                    burst_factor = 2.2

                cpu = prof["base_cpu"] * diurnal_factor * weekend_factor * burst_factor + (noise * 3.0)
                cpu = max(5.0, min(96.0, cpu))

                mem = prof["base_mem"] * (0.9 + 0.2 * (diurnal_factor - 0.5)) + (noise * 1.5)
                mem = max(10.0, min(95.0, mem))

                req_vol = prof["base_req"] * diurnal_factor * weekend_factor * burst_factor + (noise * 25.0)
                req_vol = max(10.0, req_vol)

                # Latency increases with CPU & volume
                lat_avg = prof["lat_base"] * (0.85 + 0.3 * (cpu / 100.0)) + (noise * 4.0)
                lat_p95 = lat_avg * (1.25 + 0.15 * (cpu / 100.0))

                avail = 99.96 + (0.03 * (1.0 - (cpu / 100.0))) + (random.uniform(-0.01, 0.01))
                avail = max(99.85, min(100.0, avail))

                # Inject 1 missing metric anomaly edge case into res-logs-04 at step 500 for testing
                if res.id == "res-logs-04" and 500 <= h <= 720: # 220 missing hours (~10% missing)
                    continue

                metrics_to_insert.append(Metric(
                    resource_id=res.id,
                    timestamp=current_timestamp,
                    cpu_utilization=round(float(cpu), 2),
                    memory_utilization=round(float(mem), 2),
                    request_volume=round(float(req_vol), 1),
                    average_latency=round(float(lat_avg), 1),
                    p95_latency=round(float(lat_p95), 1),
                    availability=round(float(avail), 4),
                    instance_type=res.current_instance_type,
                    instance_price=prof["price"],
                    cloud_account=res.cloud_account,
                    region=res.region,
                    workload_type=res.workload_type
                ))

        print(f"  -> Bulk inserting {len(metrics_to_insert)} historical metric records into database...")
        db.bulk_save_objects(metrics_to_insert)
        db.commit()

    # 7. Initial Audit Log Entry
    print("  -> Creating Initial Audit Trail Entries...")
    if db.query(AuditLog).count() == 0:
        db.add(AuditLog(
            timestamp=datetime.utcnow() - timedelta(hours=2),
            user="system",
            action="SYSTEM_INITIALIZED",
            reason="Hospital Cloud Infrastructure Rightsizing Simulator initialized with 90-day synthetic metrics.",
            risk_level="LOW"
        ))
        db.commit()

    print("[SUCCESS] Database seeding complete! Total records created successfully.")
    if close_at_end:
        db.close()

if __name__ == "__main__":
    seed_database()
