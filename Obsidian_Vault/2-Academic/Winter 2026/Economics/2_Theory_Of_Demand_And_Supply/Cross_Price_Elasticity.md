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

Here's a 5-step technical walkthrough of how Cross-Price Elasticity operates in the Smartphone Ecosystem:

1. **Initial State**: Consider the market for **iOS Devices (Good X)** and **Android Devices (Good Y)**. They are **Substitute Goods**. Initially, a standard Android flagship costs $800, and Apple sells 1 million iPhones per quarter.

2. **Price Change**: A major Android manufacturer drops its flagship price to $600 (a 25% decrease, % ΔPY = -25%).

3. **Demand Response**: Consumers perceive Android as a more attractive alternative. Consequently, iPhone sales drop to 800,000 units (a 20% decrease in quantity demanded for Good X, % ΔQX = -20%).

4. **Elasticity Calculation**: The Cross-Price Elasticity is calculated as: $$E_{XY} = \frac{-20\%}{-25\%} = +0.8$$.

5. **Interpretation**: Since $E_{XY}$ is positive (+0.8), the goods are confirmed as **Substitutes**. If the price of Good Y falls, the demand for Good X also falls (and vice versa).

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "If the Cross-Price Elasticity of Demand between Good A and Good B is -2.5, this indicates that the two goods are:",
    "options": {
      "A": "Strong substitutes.",
      "B": "Weak substitutes.",
      "C": "Strong complements.",
      "D": "Independent goods with no relationship."
    },
    "answer": "C",
    "explanation": "A negative cross-price elasticity indicates complements. The magnitude (2.5) suggests a strong relationship where a 1% price increase in one leads to a 2.5% demand drop in the other."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A positive $E_{XY}$ coefficient between two goods implies that as the price of one good rises, consumers switch to the other good to maintain utility.",
    "answer": true,
    "explanation": "This is the definition of the substitution effect. When the price of your preferred good rises, the relative price of the substitute falls, making it more attractive."
  },
  {
    "id": "q3",
    "type": "synthesis",
    "difficulty": "L3",
    "question": "A nation subsidizes Public Transit, effectively lowering the 'price' of commuting by bus. Analyze the impact on the Demand Curve for Private Automobiles. What does this suggest about the cross-price relationship?",
    "answer": "Public transit and private cars are substitutes. A lower price for transit shifts the demand curve for private automobiles to the left. The Cross-Price Elasticity would be positive. Policymakers use this relationship to reduce urban congestion and carbon emissions.",
    "explanation": "Synthesis requires applying elasticity theory to a macro-policy scenario (Public Transit vs. Private Cars)."
  },
  {
    "id": "q4",
    "type": "trace",
    "difficulty": "L2",
    "question": "Trace the impact of a 10% price increase in 'Cloud Computing Credits' on the demand for 'On-Premise Server Hardware', assuming $E_{XY} = 1.2$.",
    "answer": "1) Price of Cloud increases by 10%. 2) Quantity demanded of Cloud decreases. 3) Demand for On-Premise Hardware shifts right by 12% (10% * 1.2). 4) Market price for servers likely increases due to the demand surge.",
    "explanation": "Tracing the logic through the coefficient to calculate the specific percentage shift in the substitute market."
  },
  {
    "id": "q5",
    "type": "order",
    "difficulty": "L2",
    "question": "Order the steps for determining if two products in a portfolio are cannibalizing each other (substitutes).",
    "steps": [
      "Raise the price of Product B intentionally",
      "Observe the resulting sales change in Product A",
      "Calculate the percentage change in sales of Product A",
      "Calculate the Cross-Price Elasticity coefficient",
      "Verify if the coefficient is positive (substitutes) or negative (complements)"
    ],
    "answer": [
      "Raise the price of Product B intentionally",
      "Observe the resulting sales change in Product A",
      "Calculate the percentage change in sales of Product A",
      "Calculate the Cross-Price Elasticity coefficient",
      "Verify if the coefficient is positive (substitutes) or negative (complements)"
    ],
    "explanation": "The empirical test starts with a price change (variable) and ends with the verification of the elasticity sign."
  }
]
```