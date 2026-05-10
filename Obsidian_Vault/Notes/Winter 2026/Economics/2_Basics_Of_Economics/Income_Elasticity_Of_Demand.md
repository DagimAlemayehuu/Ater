---
title: Income_Elasticity_Of_Demand
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
- "Normal_Goods"
- "Inferior_Goods"
source_pages:
- 33
- 34
generated: true
---

## 1. Mental Model

Imagine your monthly allowance doubles. You probably won't double your consumption of ramen noodles; in fact, you might stop buying them entirely and start buying steak instead. The "responsiveness" of your shopping list to your new wealth is what economists call Income Elasticity.

## 2. Causal Mechanism

Income Elasticity of Demand ($E_i$) measures the degree of responsiveness of the quantity demanded of a good to a change in the consumer's income.

### The Formula:
$E_i = \frac{\% \Delta Q_d}{\% \Delta I} = \frac{\Delta Q}{\Delta I} \times \frac{I}{Q}$

### Classification of Goods:
The sign and magnitude of $E_i$ reveal the nature of the good:

1.  **Normal Goods ($E_i > 0$)**: Demand increases as income increases.
    - **Necessities ($0 < E_i < 1$)**: Demand grows slower than income (e.g., bread, salt).
    - **Luxuries ($E_i > 1$)**: Demand grows faster than income (e.g., gold, fine jewelry).
2.  **Inferior Goods ($E_i < 0$)**: Demand decreases as income increases (e.g., low-quality grains, second-hand clothes).

### Key Takeaways:
- Positive $E_i$ means the good is **Normal**.
- Negative $E_i$ means the good is **Inferior**.
- The value tells us if the good is a **Necessity** or a **Luxury** relative to the consumer's budget.

## 3. Limitations & Edge Cases

- **Income Levels**: A good can be a luxury at low income levels (e.g., a bicycle in a poor village) but become a necessity or even an inferior good at very high income levels (e.g., when everyone owns a car).
- **Ceteris Paribus**: The measure assumes prices of the good and its substitutes remain constant while income changes.

## 4. Summary Table

| Elasticity Value ($E_i$) | Interpretation | Type of Good |
| :--- | :--- | :--- |
| **Negative** ($< 0$) | Inverse relationship | Inferior Good |
| **Positive** ($> 0$) | Direct relationship | Normal Good |
| **$0 < E_i < 1$** | Income-Inelastic | Necessity |
| **$E_i > 1$** | Income-Elastic | Luxury |

## 5. Walkthrough (Numerical Example)

**Scenario**: Initially, a consumer earns 1000 Birr and demands 50 units of Good X. Income increases to 1500 Birr, and demand becomes 70 units.

**Step 1:** Calculate change in Quantity ($\Delta Q$): $70 - 50 = 20$.
**Step 2:** Calculate change in Income ($\Delta I$): $1500 - 1000 = 500$.
**Step 3:** Apply formula: $E_i = \frac{20}{500} \times \frac{1000}{50} = 0.04 \times 20 = 0.8$.
**Step 4:** **Result**: Since $0 < 0.8 < 1$, Good X is a **Normal Good** and a **Necessity**.

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "If the income elasticity of demand for a product is -1.5, how is the product classified?",
    "options": {
      "a": "Normal Good",
      "b": "Inferior Good",
      "c": "Luxury Good",
      "d": "Necessity"
    },
    "answer": "b",
    "explanation": "A negative income elasticity indicates an inferior good, where demand falls as income rises."
  },
  {
    "type": "fill_in",
    "question": "A product with an income elasticity of [[blank]] is considered a luxury good.",
    "answer": "greater than 1",
    "explanation": "Luxury goods have income-elastic demand, meaning the percentage increase in demand exceeds the percentage increase in income.",
    "textWithBlanks": "A product with an income elasticity of [[blank]] is considered a luxury good."
  },
  {
    "type": "trace",
    "question": "Trace the logic for a good whose demand falls from 100 to 80 when income rises from 500 to 600.",
    "steps": [
      "Income increased by 20% (100/500)",
      "Quantity demanded decreased by 20% (-20/100)",
      "Elasticity is -20% / 20% = -1",
      "Since value is negative, the good is inferior"
    ],
    "answer": "The good is classified as inferior",
    "explanation": "The inverse relationship between income and demand defines an inferior good."
  }
]
```
