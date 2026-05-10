---
title: Cross_Price_Elasticity_Of_Demand
course: "Economics"
unit: '2'
semester: "Winter 2026"
mode: ECON-MICRO
type: atomic_note
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]"
date: '2026-05-10'
prerequisites:
- "Price_Elasticity_Of_Demand"
- "Substitute_Goods"
- "Complimentary_Goods"
source_pages:
- 35
generated: true
---

## 1. Mental Model

Imagine the price of gasoline doubles. You'll likely buy fewer cars, even if car prices stay the same. Now imagine the price of Pepsi doubles. You'll likely buy more Coca-Cola. The "Cross-Price Elasticity" measures how the price of one "neighboring" good affects the demand for another.

## 2. Causal Mechanism

Cross-Price Elasticity of Demand ($E_{xy}$) measures how the quantity demanded of one good (Good X) responds to a change in the price of another good (Good Y).

### The Formula:
$E_{xy} = \frac{\% \Delta Q_{dx}}{\% \Delta P_y} = \frac{\Delta Q_x}{\Delta P_y} \times \frac{P_y}{Q_x}$

### Classification of Relationship:
The sign of $E_{xy}$ determines the relationship between the two goods:

1.  **Substitutes ($E_{xy} > 0$)**: The relationship is **direct**. If the price of Y goes up, people switch to X. (e.g., Tea and Coffee).
2.  **Complements ($E_{xy} < 0$)**: The relationship is **inverse**. If the price of Y goes up, people buy less of both X and Y. (e.g., Cars and Petrol).
3.  **Independent ($E_{xy} = 0$)**: A change in the price of Y has no effect on the demand for X. (e.g., Price of shoes and demand for milk).

### Key Takeaways:
- **Positive sign** = Substitutes.
- **Negative sign** = Complements.
- The **magnitude** tells us how "close" the substitutes or complements are.

## 3. Limitations & Edge Cases

- **Asymmetry**: The relationship isn't always perfectly symmetrical. A change in the price of a primary good (cars) might affect the demand for a secondary good (tires) more than vice versa.
- **Indirect Effects**: In complex markets, price changes in one sector can ripple through the economy in ways that look like cross-elasticity but are actually driven by changes in real income.

## 4. Summary Table

| Elasticity Value ($E_{xy}$) | Relationship | Example |
| :--- | :--- | :--- |
| **Positive** ($> 0$) | Substitutes | Coke and Pepsi |
| **Negative** ($< 0$) | Complements | Printers and Ink |
| **Zero** ($= 0$) | Independent | Books and Apples |

## 5. Walkthrough (Numerical Example)

**Scenario**: The price of Good Y increases from 20 to 30 Birr. As a result, the quantity demanded of Good X increases from 400 to 700 units.

**Step 1:** Calculate $\Delta Q_x$: $700 - 400 = 300$.
**Step 2:** Calculate $\Delta P_y$: $30 = 20 = 10$.
**Step 3:** Apply formula: $E_{xy} = \frac{300}{10} \times \frac{20}{400} = 30 \times 0.05 = 1.5$.
**Step 4:** **Result**: Since $1.5$ is **positive**, Good X and Good Y are **Substitutes**.

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "If the cross-price elasticity of demand between two goods is -0.8, what is their relationship?",
    "options": {
      "a": "Substitutes",
      "b": "Complements",
      "c": "Independent",
      "d": "Inferior"
    },
    "answer": "b",
    "explanation": "A negative cross-price elasticity indicates that the goods are consumed together (complements)."
  },
  {
    "type": "fill_in",
    "question": "For substitute goods, the cross-price elasticity of demand is always [[blank]].",
    "answer": "positive",
    "explanation": "As the price of one substitute increases, consumers shift their demand toward the other substitute, creating a direct relationship.",
    "textWithBlanks": "For substitute goods, the cross-price elasticity of demand is always [[blank]]."
  },
  {
    "type": "trace",
    "question": "Trace the impact of an increase in the price of sugar on the demand for tea.",
    "steps": [
      "Price of sugar (Complement) increases",
      "Cost of consuming 'Tea with Sugar' increases",
      "Quantity demanded of sugar falls",
      "Demand for tea falls because it is used with sugar",
      "Cross-price elasticity is negative"
    ],
    "answer": "Tea and Sugar are complements",
    "explanation": "Complements show an inverse cross-price relationship."
  }
]
```
