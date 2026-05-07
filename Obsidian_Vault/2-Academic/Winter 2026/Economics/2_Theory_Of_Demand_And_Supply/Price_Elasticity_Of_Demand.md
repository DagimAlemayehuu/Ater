---

title: Price_Elasticity_Of_Demand
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 24
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Demand_Function]]"

---

# 1. Mental Model

Imagine you're at an ice cream shop, and they raise the price of your favorite ice cream flavor. If you and many others stop buying it, demand is elastic. But if you still buy it, even though it's more expensive, demand is inelastic. The 'price elasticity of demand' measures how much the quantity demanded changes when the price changes.

# 2. Economic Theory

The [[Price_Elasticity_Of_Demand]] is a measure of the responsiveness of the quantity demanded of a good to a change in its price, while keeping [[Ceteris_Paribus]] (all other factors constant). It is calculated as the percentage change in quantity demanded in response to a 1% change in price. The underlying mechanism is based on the [[Law_Of_Demand]], which states that as the price of a good increases, the quantity demanded decreases, and vice versa. The [[Demand_Schedule]] and [[Demand_Curve]] illustrate this relationship, and the [[Demand_Function]] represents it mathematically. The formula for [[Price_Elasticity_Of_Demand]] is: PED = (percentage change in quantity demanded) / (percentage change in price). 

# 3. Market Failures

The [[Price_Elasticity_Of_Demand]] concept has limitations, particularly when dealing with [[Inferior_Goods]] or [[Complementary_Goods]], where the relationship between price and quantity demanded may be affected by changes in consumer income or the price of related goods. Additionally, the assumption of [[Ceteris_Paribus]] may not hold in real-world scenarios, where changes in [[Market_Demand]] or [[Market_Demand_Curve]] can influence the price elasticity of demand. Furthermore, the concept may not capture the full complexity of consumer behavior, particularly in situations where [[Substitute_Goods]] are not readily available or where consumers exhibit [[Normal_Goods]] preferences.

# 4. Economic Model

```mermaid

graph LR
    A[Price Elasticity of Demand] --> B[ PED = (percentage change in quantity demanded) / (percentage change in price) ]
    B --> C[Elastic Demand: PED > 1]
    B --> D[Inelastic Demand: PED < 1]
    C --> E[Perfectly Elastic Demand: PED = ∞]
    D --> F[Perfectly Inelastic Demand: PED = 0]

```

This flowchart illustrates the concept of Price Elasticity of Demand, showing how it is calculated and the different types of demand elasticity.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how **Price Elasticity of Demand** (PED) operates in the **Mobile App Market**:

1. **Initial Price-Quantity State**: A productivity app is priced at $10.00. At this price, the developer sees 10,000 downloads per month.

2. **Price Shock**: To test the market, the developer raises the price to $15.00 (a 50% increase).

3. **Observed Quantity Change**: Monthly downloads plummet to 2,000 (an 80% decrease). Consumers quickly switch to free alternatives.

4. **Coefficient Calculation**: 
   - $\% \Delta Q_d = -80\%$
   - $\% \Delta P = +50\%$
   - $PED = |-80\% / 50\%| = 1.6$

5. **Analytical Interpretation**: Since $PED > 1.0$, the demand for this app is **Elastic**. The developer concludes that a price increase is counterproductive, as the percentage drop in quantity (80%) outweighs the percentage gain in price (50%), leading to a **decrease in total revenue**.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "If a 10% increase in the price of a life-saving medicine leads to only a 1% decrease in quantity demanded, the demand is considered:",
    "options": {
      "A": "Elastic.",
      "B": "Unit Elastic.",
      "C": "Inelastic.",
      "D": "Perfectly Elastic."
    },
    "answer": "C",
    "explanation": "Demand is inelastic when the percentage change in quantity demanded is smaller than the percentage change in price ($PED < 1$)."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The Price Elasticity of Demand is typically higher (more elastic) for goods that have many close substitutes.",
    "answer": true,
    "explanation": "When substitutes are available, consumers can easily switch away from a good when its price rises, making the quantity demanded highly sensitive to price changes."
  },
  {
    "id": "q3",
    "type": "synthesis",
    "difficulty": "L3",
    "question": "A luxury brand wants to increase its total revenue. Should it raise prices if it knows the $PED$ for its handbags is 2.5? Explain why or why not.",
    "answer": "No, it should not. A $PED$ of 2.5 indicates highly elastic demand. If they raise prices, the percentage decrease in quantity demanded will be 2.5 times larger than the price increase, causing total revenue ($P \times Q$) to fall.",
    "explanation": "Synthesis requires linking the elasticity coefficient to the Total Revenue Test, a core strategic application of PED."
  },
  {
    "id": "q4",
    "type": "trace",
    "difficulty": "L2",
    "question": "Trace the movement on a graph for 'Gasoline' in the **short run** if prices rise by 20% (assume $PED = 0.2$).",
    "answer": "1) Locate original point on a very steep demand curve. 2) Move upward along the curve by 20% on the P-axis. 3) The corresponding movement left on the Q-axis is only 4% (20% * 0.2). 4) The resulting equilibrium shows much higher price with almost no change in consumption.",
    "explanation": "Tracing requires identifying the steepness of the curve (Inelastic = Steep) and the magnitude of the resulting shift along that curve."
  },
  {
    "id": "q5",
    "type": "order",
    "difficulty": "L2",
    "question": "Order these goods from **Most Inelastic** to **Most Elastic**.",
    "steps": [
      "Insulin for a Diabetic (Essential, no substitutes)",
      "A specific brand of Vanilla Ice Cream (Many substitutes)",
      "Daily Commuter Rail Pass (Few substitutes in the short run)"
    ],
    "answer": [
      "Insulin for a Diabetic (Essential, no substitutes)",
      "Daily Commuter Rail Pass (Few substitutes in the short run)",
      "A specific brand of Vanilla Ice Cream (Many substitutes)"
    ],
    "explanation": "Elasticity increases as we move from essentials with no substitutes to luxury/discretionary items with many alternatives."
  }
]
```