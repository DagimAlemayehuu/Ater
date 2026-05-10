---
title: Arc_Elasticity_Of_Demand
course: "Economics"
unit: '2'
semester: "Winter 2026"
mode: ECON-MICRO
type: atomic_note
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]"
date: '2026-05-10'
prerequisites:
- "Price Elasticity Of Demand"
source_pages:
- 27
- 28
generated: true
---

## 1. Mental Model

A Tier-1 Network Infrastructure provider (like Lumen or Zayo) is adjusting the price of 100Gbps high-bandwidth transit for enterprise clients. When the monthly price per port is increased from $4,000 to $5,000, the total number of port subscriptions across their client base drops from 120 to 90. Because this represents a significant jump (25% on the price side), the provider cannot use point elasticity (which only works for infinitesimal changes). They utilize **Arc Elasticity** to find the average responsiveness over this specific pricing "arc."

## 2. Quantitative Architecture

Arc Elasticity of Demand (the "Midpoint Method") measures the average responsiveness of quantity demanded to price changes over a non-infinitesimal range. By using the average of the starting and ending points as the denominator, it ensures that the elasticity coefficient remains consistent regardless of whether the price is increasing or decreasing—solving the "directionality problem" of simple percentage changes.

$$E_d = \frac{\frac{Q_2 - Q_1}{(Q_2 + Q_1)/2}}{\frac{P_2 - P_1}{(P_2 + P_1)/2}}$$

This metric is the gold standard for analyzing [[Demand_Curve]] segments where the slope may not be constant. It provides a more robust measure than point elasticity when data is discrete (as in the case of [[Demand_Schedule]] snapshots). In a corporate setting, understanding this coefficient allows firms to predict how price hikes will impact total revenue and whether the market is currently in an elastic ($|E_d| > 1$) or inelastic ($|E_d| < 1$) state.

### Key Takeaways:

- **Midpoint Neutrality:** Using the midpoint ensures that a price increase from $P_1$ to $P_2$ yields the same elasticity as a decrease from $P_2$ to $P_1$.
- **Range Validity:** Arc elasticity is specifically designed for "Discrete Data" where we only have two points $(P_1, Q_1)$ and $(P_2, Q_2)$ rather than a continuous [[Demand_Function]].
- **Strategic Utility:** It helps firms identify if they are operating in a region of the demand curve where price increases will lead to a disproportionate loss in quantity, potentially harming [[Market_Equilibrium]] stability.

## 3. Limitations & Future Context

The primary limitation of Arc Elasticity is that it assumes a linear relationship between the two points, potentially masking complex curvature in the actual [[Demand_Curve]]. Furthermore, it is a "static" measure; it assumes [[Ceteris_Paribus]] (all other factors constant), ignoring simultaneous shifts in [[Substitute_Goods]] pricing or [[Technological_Advancement]] in data compression that might also influence throughput demand. For very large arcs, the midpoint may no longer represent the actual behavior of consumers at either extreme.

## 4. Bandwidth Pricing Result Table

| Variable | Initial ($P_1, Q_1$) | Final ($P_2, Q_2$) | Change ($\Delta$) | Midpoint ($Avg$) | Derived Coefficient |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Price (USD)** | $4,000 | $5,000 | +$1,000 | $4,500 | $\%\Delta P = 22.2\%$ |
| **Quantity (Ports)** | 120 | 90 | -30 | 105 | $\%\Delta Q = -28.6\%$ |
| **RESULT** | | | | | **$E_d = -1.28$ (Elastic)** |

## 5. Walkthrough

1. **Parameter Identification:** Define $P_1=4000, Q_1=120, P_2=5000, Q_2=90$.
2. **Numerator Derivation:** Calculate the % change in quantity using the midpoint: $(90-120) / ((90+120)/2) = -30 / 105 \approx -0.2857$.
3. **Denominator Derivation:** Calculate the % change in price using the midpoint: $(5000-4000) / ((5000+4000)/2) = 1000 / 4500 \approx 0.2222$.
4. **Coefficient Calculation:** Divide quantity % change by price % change: $-0.2857 / 0.2222 = -1.2857$.
5. **Epistemic Conclusion:** Since $|-1.28| > 1$, the demand for high-bandwidth ports is **Price Elastic**. The 22.2% price hike caused a 28.6% drop in subscriptions, meaning total revenue will likely fall.

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "type": "fill_in",
    "question": "The primary advantage of the Arc Elasticity formula is that it eliminates the [[blank]] problem, ensuring the coefficient is the same for both price increases and decreases.",
    "answer": "directionality",
    "explanation": "Simple percentage calculations yield different results depending on the starting value. Using the midpoint (Arc Elasticity) solves this 'directionality' problem.",
    "textWithBlanks": "The primary advantage of the Arc Elasticity formula is that it eliminates the [[blank]] problem, ensuring the coefficient is the same for both price increases and decreases."
  },
  {
    "type": "mcq",
    "question": "In the Bandwidth Pricing scenario, why is the resulting coefficient of -1.28 considered 'Elastic'?",
    "options": {
      "a": "Because the absolute value is greater than 1, meaning quantity response outpaces the price change.",
      "b": "Because the price increase led to more revenue for the ISP.",
      "c": "Because the coefficient is negative, which is required for all elastic goods.",
      "d": "Because the price changed by more than $500."
    },
    "answer": "a",
    "explanation": "Elasticity is determined by the magnitude (absolute value) of the coefficient. $|-1.28| > 1$ signifies that consumers are highly responsive to price.",
    "optionsValid": [
      "Magnitude > 1",
      "Quantity response > Price response",
      "Consumer sensitivity is high"
    ]
  },
  {
    "type": "trace",
    "question": "Trace the logical steps an ISP manager takes from observing a price hike to determining the Arc Elasticity coefficient.",
    "steps": [
      "The manager records the subscription drop from 120 to 90 after raising price to $5,000",
      "The average quantity (105) and average price ($4,500) are calculated to establish the midpoint",
      "The raw quantity change (-30) is divided by the midpoint (105) to find the relative quantity shift",
      "The raw price change ($1,000) is divided by the midpoint ($4,500) to find the relative price shift",
      "The relative quantity shift is divided by the relative price shift to find the coefficient",
      "The manager concludes that demand is elastic because the resulting magnitude is 1.28"
    ],
    "answer": "Quantitative Elasticity Assessment",
    "explanation": "The manager follows a deterministic midpoint-calculation path to arrive at a coefficient that accurately reflects consumer sensitivity over the entire price range."
  }
]
```