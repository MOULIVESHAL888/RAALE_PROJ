# Ethics & Governance Policy

## Performance-Safe Cloud Rightsizing Simulator for Hospital Infrastructure

---

## 1. Non-Clinical Scope Boundary

1. **Infrastructure Only**: This system supports cloud infrastructure decision-making for hospital IT managers, cloud engineers, and FinOps analysts.
2. **No Clinical Decisions**: The system does **NOT** make clinical, diagnostic, or patient care decisions.
3. **No Automatic Production Modification**: The system functions strictly as a simulator. No real-world cloud infrastructure is altered automatically.

---

## 2. Patient Data Privacy & Synthetic Dataset Guarantee

1. **Zero PHI Processing**: No Protected Health Information (PHI) or real hospital patient records are accessed or stored.
2. **De-Identified Operational Workloads**: Workload names (PACS Image Processing, Patient Records API, Emergency Dept API) represent synthetic demonstration operational profiles.
3. **Simulated Pricing**: All hourly rates and cost calculations rely on synthetic cloud pricing matrices and do not represent contractual AWS/Azure rates.

---

## 3. Governance & Human-in-the-Loop Safeguards

1. **Human Authorization**: All high-risk or high-impact rightsizing recommendations require human approval before change execution simulation.
2. **Emergency Rollback**: Provides a visible 1-click Rollback path to instantly restore previous instance configurations in case of performance anomalies.
3. **Auditability**: Maintains an immutable audit trail for every simulation run, recommendation generated, manual override, approval, and rollback action.
