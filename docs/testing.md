# Testing & Verification Guide

## Test Suite Execution Instructions

The project includes an automated test suite powered by `pytest` covering rightsizing logic, cost calculation, operating scenarios, sensitivity parameter sweeps, manual overrides, audit logging, change approvals, emergency rollbacks, edge cases, and REST API endpoints.

---

## 1. Running the Automated Tests

To run all automated backend unit and integration tests:

```bash
cd backend
py -m pytest
```

Expected output:
```text
====================== 22 passed in 2.64s =======================
```

---

## 2. Acceptance Test Matrix (All 10 Core Test Cases)

| Test ID | Test Scenario Description | Execution Command / API Call | Expected Outcome | Status |
|---|---|---|---|---|
| **Test 1** | Normal workload safe rightsizing | `POST /api/simulations` (res-back-03, normal scenario) | Decision = `SAFE TO RIGHTSIZE` | PASS |
| **Test 2** | Peak workload rightsizing block | `POST /api/simulations` (res-emer-06, peak scenario) | Decision = `REVIEW REQUIRED` or `BLOCKED` | PASS |
| **Test 3** | Bursty workload risk detection | `POST /api/simulations` (res-logs-04, bursty scenario) | Risk = `HIGH`, Latency warning generated | PASS |
| **Test 4** | Manual override audit trail | `POST /api/recommendations/{id}/override` | Audit entry with `MANUAL_OVERRIDE` created | PASS |
| **Test 5** | High-impact recommendation approval | `POST /api/recommendations/{id}/accept` (risk >= HIGH) | Status = `PENDING_APPROVAL` in Change log | PASS |
| **Test 6** | Approved change implementation | `POST /api/changes/{id}/approve` | Change status = `APPLIED`, resource updated | PASS |
| **Test 7** | Rollback functionality | `POST /api/changes/{id}/rollback` | Previous instance restored, audit log created | PASS |
| **Test 8** | Sensitivity threshold variation | `POST /api/sensitivity-analysis` | Identifies decision-changing assumptions | PASS |
| **Test 9** | Missing metrics gap handling | `GET /api/metrics/res-logs-04` | Anomaly detected, auto-rightsizing downgraded | PASS |
| **Test 10** | Sudden traffic spike handling | `EdgeCaseHandler.inspect_metrics` | Traffic spike detected, conservative margin enforced | PASS |
