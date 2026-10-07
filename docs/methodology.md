# Rightsizing Methodology & Mathematical Formulations

## Performance-Safe Cloud Rightsizing Framework for Hospitals

This document outlines the mathematical models, performance estimation formulas, SLA safety logic, and decision rules used in the simulator.

---

## 1. Financial Formulations

### 1.1 Monthly Cost Calculation
Monthly instance cost is computed assuming a standard 730 hours per month:

$$\text{Monthly Cost} = \text{hourly\_price} \times 730$$

### 1.2 Monthly Savings
$$\text{Monthly Savings} = \text{Current Monthly Cost} - \text{Proposed Monthly Cost}$$

### 1.3 Savings Percentage
$$\text{Savings \%} = \left( \frac{\text{Current Monthly Cost} - \text{Proposed Monthly Cost}}{\text{Current Monthly Cost}} \right) \times 100$$

---

## 2. Performance Prediction Model

### 2.1 vCPU & Memory Scaling
When evaluating a candidate instance with capacity ratio:

$$R_{\text{vCPU}} = \frac{\text{Candidate vCPU}}{\text{Current vCPU}}, \quad R_{\text{Mem}} = \frac{\text{Candidate Memory (GB)}}{\text{Current Memory (GB)}}$$

Predicted utilization metrics under scenario peak multiplier $M_{\text{peak}}$:

$$\text{Predicted CPU}_{P95} = \frac{\text{Baseline CPU}_{P95} \times M_{\text{peak}}}{R_{\text{vCPU}}}$$

$$\text{Predicted Memory}_{P95} = \frac{\text{Baseline Memory}_{P95} \times M_{\text{peak}}}{R_{\text{Mem}}}$$

### 2.2 Latency Queueing Estimation Model
Latency estimation models non-linear queuing contention as utilization approaches capacity:

$$U = \max\left(\frac{\text{Predicted CPU}_{P95}}{100}, \frac{\text{Predicted Memory}_{P95}}{100}\right)$$

$$\text{Latency Factor} = 
\begin{cases} 
1.0 + 0.15 \cdot U, & U \le 0.50 \\
1.08 + 0.45 \cdot (U - 0.50), & 0.50 < U \le 0.80 \\
1.22 + 1.50 \cdot (U - 0.80), & 0.80 < U \le 0.95 \\
1.45 + 6.00 \cdot (U - 0.95), & U > 0.95 
\end{cases}$$

$$\text{Predicted Latency}_{P95} = (\text{Baseline Latency}_{P95} \times \text{Latency Factor}) + \Delta_{\text{latency scenario}}$$

---

## 3. Decision Safety Rules Matrix

A candidate rightsizing proposal is classified as **SAFE TO RIGHTSIZE** if and only if all of the following conditions are simultaneously satisfied:

1. **CPU Target Safety**: $\text{Predicted CPU}_{P95} \le \text{CPU Target (e.g. 75\%)}$
2. **Memory Target Safety**: $\text{Predicted Memory}_{P95} \le \text{Memory Target (e.g. 80\%)}$
3. **Latency SLA Safety**: $\text{Predicted Latency}_{P95} \le \text{Latency Target (e.g. 250 ms)}$
4. **Availability Target**: $\text{Predicted Availability} \ge \text{Min Availability (e.g. 99.90\%)}$
5. **Headroom Safety Margin**: $100\% - \max(\text{Predicted CPU}, \text{Predicted Memory}) \ge \text{Safety Margin (e.g. 15\%)}$
6. **Cost Savings Threshold**: $\text{Savings \%} \ge \text{Min Required Savings (e.g. 10\%)}$

If any performance or SLA target is violated, the system generates either **REVIEW REQUIRED**, **HIGH RISK**, or **BLOCKED** status with explicit explainability.
