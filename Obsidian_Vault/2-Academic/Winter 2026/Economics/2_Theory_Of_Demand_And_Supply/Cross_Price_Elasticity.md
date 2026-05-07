---

title: Cross_Price_Elasticity
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 23
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Price_Elasticity_Of_Demand]]"

---

# 1. Mental Model

Imagine you have a lemonade stand and a cookie stand. If you raise the price of lemonade, you might sell fewer lemons, but you might also sell more cookies because people who like lemonade also like cookies. The cross price elasticity measures how much the demand for one good (cookies) changes when the price of another good (lemonade) changes. It's like a seesaw: when the price of lemonade goes up, the demand for cookies might go up too.

# 2. Economic Theory

The [[Cross_Price_Elasticity]] measures the responsiveness of the demand for one good to a change in the price of another good. It is calculated as the percentage change in the quantity demanded of one good in response to a 1% change in the price of another good, and can be expressed as: $$E_{XY} = \frac{\% \Delta Q_X}{\% \Delta P_Y}$$. This concept relies on the [[Theory_Of_Demand]] and [[Law_Of_Demand]], assuming [[Ceteris_Paribus]], and is closely related to [[Substitute_Goods]] and [[Complementary_Goods]]. For [[Substitute_Goods]], the [[Cross_Price_Elasticity]] is positive, indicating that an increase in the price of one good leads to an increase in demand for the other good. Conversely, for [[Complementary_Goods]], the [[Cross_Price_Elasticity]] is negative, indicating that an increase in the price of one good leads to a decrease in demand for the other good.

# 3. Market Failures

The [[Cross_Price_Elasticity]] concept has limitations, particularly when dealing with [[Market_Equilibrium]] and [[Surplus_And_Shortage]]. For instance, it assumes that consumers' preferences and incomes remain constant, which might not always be the case. Additionally, the concept might not accurately capture the effects of [[Change_In_Technology]] or [[Shift_In_Supply_Curve]] on demand. Furthermore, the [[Cross_Price_Elasticity]] can be influenced by [[Determinants_Of_Demand]], such as changes in consumer tastes or population demographics. In some cases, the [[Cross_Price_Elasticity]] might not be a reliable indicator of the relationship between two goods, especially if they are not close substitutes or complements. 

Technical Question: What is the formula for calculating the cross price elasticity of demand for good X with respect to the price of good Y?

Debug Section: A common error is to assume that a positive cross price elasticity always indicates that two goods are substitutes. However, this can be misleading if the goods are not close substitutes or if other factors are influencing demand.

Mathematical Formula: 
$$E_{XY} = \frac{\% \Delta Q_X}{\% \Delta P_Y} = \frac{\Delta Q_X / Q_X}{\Delta P_Y / P_Y}$$ 

Example: Suppose the price of lemonade increases by 10%, and as a result, the quantity demanded of cookies increases by 15%. The cross price elasticity would be: 
$$E_{cookies,lemonade} = \frac{15\%}{10\%} = 1.5$$ 
This indicates that cookies and lemonade are substitutes.

# 4. Economic Model

```mermaid

graph LR
    A[Good X (Cookies)] -->|Demand| B(Cross Price Elasticity)
    C[Good Y (Lemonade)] -->|Price Change| B
    B -->|% ΔQX| D[Quantity Demanded of Cookies]
    B -->|% ΔPY| E[Price of Lemonade]
    D -->|E = (% ΔQX / % ΔPY)| F(Elasticity Coefficient)
    F -->|Interpretation| G[Substitutes or Complements]

```

This Mermaid flowchart illustrates the concept of Cross Price Elasticity, showing how the demand for Good X (cookies) is affected by a change in the price of Good Y (lemonade). The elasticity coefficient is calculated as the percentage change in quantity demanded of cookies in response to a 1% change in the price of lemonade.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the concept of Cross Price Elasticity operates:

1. **Initial State**: Suppose the price of lemonade (Good Y) is $1 per cup, and the quantity demanded of cookies (Good X) is 100 units per day.
2. **Price Change**: The price of lemonade increases to $1.20 per cup, a 20% change (% ΔPY = 20%).
3. **Demand Response**: As a result, the quantity demanded of cookies increases to 120 units per day, a 20% change (% ΔQX = 20%).
4. **Elasticity Calculation**: The Cross Price Elasticity is calculated as: $$E_{XY} = \frac{\% \Delta Q_X}{\% \Delta P_Y} = \frac{20\%}{20\%} = 1$$.
5. **Interpretation**: Since the elasticity coefficient is 1, which is positive, cookies and lemonade are substitute goods. This means that an increase in the price of lemonade leads to an increase in demand for cookies.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The Cross Price Elasticity between two goods is always positive if they are substitutes.",
    "answer": false,
    "explanation": "The Cross Price Elasticity ($$E_{XY} = \\frac{\\% \\Delta Q_X}{\\% \\Delta P_Y}$$) measures the responsiveness of the demand for one good to a change in the price of another good. For substitute goods, an increase in the price of one good leads to an increase in demand for the other good, resulting in a positive Cross Price Elasticity. However, for complementary goods, an increase in the price of one good leads to a decrease in demand for the other good, resulting in a negative Cross Price Elasticity. Therefore, stating that the Cross Price Elasticity between two goods is always positive if they are substitutes overlooks the scenario of complementary goods but is technically correct in that context. However, the statement could be misleading because it implies an absolute condition ('always positive') without acknowledging that this positivity is a defining characteristic of substitutes, not a universal truth across all goods. The critical failure point here is assuming all goods with positive Cross Price Elasticity are substitutes without considering the broader implications of elasticity values."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "In an aerospace engineering project, the demand for titanium alloys (used in aircraft frames) is affected by the price of aluminum alloys (used in aircraft skin). Suppose the price of aluminum alloys increases by 10%, and as a result, the demand for titanium alloys increases by 15%. What is the cross price elasticity of titanium alloys with respect to aluminum alloys, and how should this inform the procurement strategy for titanium alloys to prevent system failure?",
    "answer": "1.5",
    "explanation": "The cross price elasticity of titanium alloys with respect to aluminum alloys can be calculated using the formula: $$E_{XY} = \\frac{\\% \\Delta Q_X}{\\% \\Delta P_Y}$$. Given that the demand for titanium alloys increases by 15% when the price of aluminum alloys increases by 10%, we can substitute these values into the formula: $$E_{XY} = \\frac{15\\%}{10\\%} = 1.5$$. This positive cross price elasticity indicates that titanium alloys and aluminum alloys are substitute goods in the context of aircraft manufacturing. A procurement strategy that takes this into account might involve stockpiling titanium alloys or negotiating flexible supply contracts to ensure a stable supply in case of price fluctuations in aluminum alloys, thereby preventing system failure due to material shortages."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of Cross Price Elasticity in a Quantitative Finance & High-Frequency Trading scenario, and provide a mathematical expression for it.",
    "answer": "The Cross Price Elasticity measures the responsiveness of the demand for one good to a change in the price of another good. In a Quantitative Finance & High-Frequency Trading scenario, this concept can be applied to understand how changes in the price of one asset affect the demand for another asset. For instance, if we consider two assets, X and Y, the Cross Price Elasticity of asset X with respect to asset Y can be calculated as: $$E_{XY} = \frac{\\% \\Delta Q_X}{\\% \\Delta P_Y}$$. A high positive value indicates that the two assets are substitutes, while a high negative value indicates that they are complements.",
    "explanation": "The Cross Price Elasticity is calculated as the percentage change in the quantity demanded of one good in response to a 1% change in the price of another good. Mathematically, it can be expressed as: $$E_{XY} = \frac{\\% \\Delta Q_X}{\\% \\Delta P_Y} = \frac{\\Delta Q_X / Q_X}{\\Delta P_Y / P_Y}$$. This concept is essential in Quantitative Finance & High-Frequency Trading as it helps traders and investors understand the relationships between different assets and make informed decisions. For instance, if the Cross Price Elasticity between two assets is high, it may indicate that a change in the price of one asset will have a significant impact on the demand for the other asset."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for Cross Price Elasticity",
    "steps": [
      "Calculate the percentage change in the quantity demanded of one good",
      "Calculate the percentage change in the price of another good",
      "Apply the Cross Price Elasticity formula"
    ],
    "answer": [
      "Calculate the percentage change in the price of another good",
      "Calculate the percentage change in the quantity demanded of one good",
      "Apply the Cross Price Elasticity formula"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output for Cross Price Elasticity in Global Supply Chain & Maritime Logistics?",
    "content": "The cross price elasticity of demand measures the responsiveness of the quantity demanded of one good to a change in the price of another good. It is calculated using the formula: $E_{XY} = \\frac{\\% \\Delta Q_X}{\\% \\Delta P_Y}$. For instance, if the price of shipping containers from Asia to Europe increases by 10% and the demand for imported electronics decreases by 15%, the cross price elasticity would be $E_{XY} = \\frac{-15%}{10% } = -1.5$. A negative value indicates that the goods are complements, while a positive value suggests they are substitutes.",
    "answer": "-1.5",
    "explanation": "The cross price elasticity $E_{XY}$ is given by the formula: $E_{XY} = \\frac{\\% \\Delta Q_X}{\\% \\Delta P_Y}$. Assuming a 10% increase in $P_Y$ (price of shipping containers) leads to a 15% decrease in $Q_X$ (demand for imported electronics), we compute $E_{XY}$ as: $E_{XY} = \\frac{-15}{10} = -1.5$. The negative sign implies that the goods are complementary, meaning as the price of one good increases, the demand for the other decreases."
  }
]

```