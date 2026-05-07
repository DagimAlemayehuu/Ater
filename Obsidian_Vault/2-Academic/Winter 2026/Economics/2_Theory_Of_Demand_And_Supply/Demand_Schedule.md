---
title: Demand_Schedule
course: "[[Economics]]"
unit: '2'
semester: "[[Winter 2026]]"
mode: ECON-MICRO
type: atomic_note
date: 2026-05-07
prerequisites:
- Theory_Of_Demand
source_pages:
- 6
hub: "[[2_Theory_of_Demand_and_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
---

## 1. Mental Model

Imagine you LOVE oranges and your mom lets you buy some every week with your allowance. A demand schedule is like a list that shows how many oranges you want to buy at different prices. Let's say if oranges are super cheap, like 50 cents each, you might want to buy 6 oranges a week. But if they're a bit more expensive, like $1 each, you might only want to buy 4 oranges. And if they're really pricey, like $2 each, you might only want 2 oranges. So, your demand schedule would look like a table with prices on one side and the number of oranges you want to buy on the other. It helps your mom (or the store) know how many oranges you'll want at different prices, and it's like a special map that shows how much you love oranges at different prices!

## 2. Micro Theory

The **Demand Schedule** is a table or a list that shows the quantity of a good or service that consumers are willing and able to buy at different price levels, while holding all other influencing factors constant, as per the [[Ceteris_Paribus]] assumption. For a rigorous technical definition, consider a household's demand for oranges per week. The demand schedule for an individual household can be represented as a series of price-quantity pairs that reflect the household's willingness to pay for oranges.

Mathematically, this can be expressed as a **Demand Function**, which relates the quantity demanded of oranges (Qd) to the price of oranges (P), and other factors that influence demand, such as household income (I), prices of related goods (substitutes or complements, Ps and Pc), and consumer preferences. A general form of the demand function can be written as: Qd = f(P, I, Ps, Pc, T), where T represents taste and preferences.

The **Demand Schedule** for an individual household can be graphically represented by a **Demand Curve**, which plots the quantity demanded against the price of oranges. The demand curve typically slopes downward from left to right, illustrating the [[Law_Of_Demand]], which states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases.

The demand schedule and demand curve are essential tools in microeconomics for understanding [[Market_Demand]] and [[Market_Demand_Curve]], which are the aggregation of individual demand schedules and curves. The concept of demand schedule also helps in analyzing the [[Price_Elasticity_Of_Demand]], which measures how responsive the quantity demanded is to a change in price.

Changes in factors other than price, such as household income, prices of substitutes or complements, consumer expectations, and number of buyers, can lead to a [[Change_In_Demand]], causing the demand curve to shift. For instance, an increase in household income may lead to an increase in the demand for oranges if oranges are a Normal Goods|normal Good, or a decrease if oranges are an Normal And Inferior Goods|inferior Good.

Moreover, understanding the demand schedule and its underlying factors can provide insights into the [[Determinants_Of_Demand]], such as changes in consumer [[Taste_And_Preference]], [[Consumer_Expectations]], and [[Number_Of_Buyers]]. These factors can significantly influence the demand for a particular good or service.

The interaction between demand and supply in a market can be analyzed using the concepts of [[Market_Equilibrium]], [[Surplus_And_Shortage]], and the [[Effects_Of_Shift_In_Demand_And_Supply]]. A market equilibrium example can illustrate how the demand schedule and supply conditions interact to determine the market price and quantity of oranges.

In conclusion, the demand schedule is a fundamental concept in microeconomics that provides a framework for analyzing the relationship between the price of a good and the quantity demanded by consumers. By understanding the demand schedule and its underlying factors, economists can gain insights into consumer behavior and the workings of markets.

## 3. Limitations & Edge Cases

The demand schedule assumes a direct relationship between the price of a good, such as oranges, and the quantity demanded by an individual household, but it has limitations. For instance, it does not account for changes in household income, tastes, or prices of related goods, which can shift the demand curve. Additionally, it assumes that the household has perfect knowledge of prices and can make instantaneous adjustments to consumption, which may not be realistic. Furthermore, the demand schedule may not accurately capture the behavior of households at extreme price levels, such as very high or very low prices, where demand may be more inelastic or even non-responsive. Moreover, it also neglects the possibility of quantity discounts, bundle purchases, or non-linear pricing, which can distort the relationship between price and quantity demanded. Lastly, the demand schedule is often estimated using historical data, which may not reflect current market conditions or future expectations, potentially rendering it less reliable for forecasting purposes.

## 4. Market Graph

```mermaid

graph LR
    A[Price of Oranges (P)] -->|Influences| B[Quantity Demanded (Qd)]
    B -->|Affected by| C[Household Income (I)]
    B -->|Affected by| D[Prices of Substitutes (Ps) and Complements (Pc)]
    B -->|Affected by| E[Consumer Preferences (T)]
    A -->|Shown in| F[Demand Schedule Table]
    F -->|Graphical Representation| G[Demand Curve]

```

The demand schedule is a crucial concept in microeconomics and game theory, representing the relationship between the price of a good and the quantity demanded by consumers. By analyzing the demand schedule, businesses and policymakers can understand how changes in price and other factors influence consumer behavior and make informed decisions.

## 5. Walkthrough

**Step 1: Define the Demand Function**

The demand function for an individual household's demand for oranges is defined as:

Qd = f(P, I, Ps, Pc, T)

Where:
- Qd = quantity demanded of oranges
- P = price of oranges
- I = household income
- Ps = price of substitutes (e.g., apples)
- Pc = price of complements (e.g., orange juice)
- T = taste and preferences

For simplicity, assume a linear demand function:

Qd = α - βP + γI + δPs - εPc + ζT

Where α, β, γ, δ, ε, and ζ are parameters.

**Step 2: Construct the Demand Schedule**

Create a table with - Price of Oranges (P)
- Quantity Demanded (Qd)

Assume α = 100, β = 2, γ = 0.1, δ = 0.05, ε = 0, and ζ = 0 (for simplicity)

Hold all variables constant except for P. For example:
- I = $1000
- Ps = $1 (price of apples)
- Pc = $2 (price of orange juice)
- T = 0 (neutral taste)

Vary P from $0 to $10 and calculate Qd for each P.

**Step 3: Calculate Quantity Demanded (Qd) for Each Price Level**

Using the demand function, calculate Qd for each price level:

| P | Qd |
| --- | --- |
| $0 | 100 - 2(0) + 0.1(1000) + 0.05(1) = 110 |
| $1 | 100 - 2(1) + 0.1(1000) + 0.05(1) = 108 |
| $2 | 100 - 2(2) + 0.1(1000) + 0.05(1) = 106 |
| ... | ... |
| $10 | 100 - 2(10) + 0.1(1000) + 0.05(1) = 70 |

**Step 4: Analyze the Demand Schedule**

The resulting demand schedule shows the quantity of oranges demanded at each price level. Analyze the schedule to identify:
- The law of demand: as P increases, Qd decreases
- The price elasticity of demand: responsiveness of Qd to changes in P

**Step 5: Derive the Demand Curve**

Plot the demand schedule on a graph with P on the vertical axis and Qd on the horizontal axis. The resulting curve represents the demand curve, which shows the relationship between P and Qd. The demand curve can be used for further analysis, such as:
- Finding the equilibrium price and quantity
- Calculating consumer surplus
- Analyzing the impact of changes in influencing factors (e.g., income, prices of related goods) on demand.

---

## Review & Practice

```interactive-quiz

[
  {
    "id": "generate_unique_id",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the relationship between the price elasticity of demand and the demand schedule, according to the law of demand in microeconomics, specifically in the context of game theory applications?",
    "options": {
      "A": "The price elasticity of demand measures the responsiveness of the quantity supplied to a change in price.",
      "B": "The price elasticity of demand is calculated as the percentage change in quantity demanded in response to a 1% change in price, which can be derived from the demand schedule.",
      "C": "The demand schedule is a graphical representation of the price elasticity of demand, which is always inelastic.",
      "D": "The law of demand states that as the price of a good increases, the quantity supplied also increases, which is reflected in the demand schedule."
    },
    "answer": "B",
    "explanation": "The price elasticity of demand is a measure of how responsive the quantity demanded of a good is to a change in its price, while holding all other influencing factors constant. It is calculated as the percentage change in quantity demanded in response to a 1% change in price. This concept can be derived from the demand schedule, which shows the quantity of a good or service that consumers are willing and able to buy at different price levels. The formula for price elasticity of demand is $E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$. A demand schedule can be used to compute this elasticity by examining the changes in quantity demanded in response to price changes, thus option B is correct."
  },
  {
    "id": "demand_schedule_1",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "Fill in the blank.",
    "textWithBlanks": "The Blank is a table or a list that shows the quantity of a good or service that consumers are willing and able to buy at different price levels, while holding all other influencing factors constant, as per the ceteris paribus assumption.",
    "answer": [
      "demand schedule"
    ],
    "explanation": "The demand schedule is a fundamental concept in microeconomics that represents the relationship between the price of a good and the quantity demanded by consumers. It is typically expressed as a table or list of price-quantity pairs. The mathematical representation of demand can be expressed as a demand function: $Q_d = f(P, I, P_s, P_c, T)$, where $Q_d$ is the quantity demanded, $P$ is the price of the good, $I$ is household income, $P_s$ and $P_c$ are prices of substitutes and complements, and $T$ represents taste and preferences."
  },
  {
    "id": "Q1234",
    "type": "debug",
    "difficulty": "L2",
    "question": "Find the bug in the demand schedule formula: Qd = f(P, I, Ps, Pc) + T",
    "content": "The demand schedule for an individual household can be represented as a series of price-quantity pairs that reflect the household's willingness to pay for oranges. A general form of the demand function can be written as: Qd = f(P, I, Ps, Pc, T). However, a researcher wrote the formula as Qd = f(P, I, Ps, Pc) + T.",
    "answer": "The bug is that the taste and preference variable T should be inside the function f, not added outside.",
    "required_keywords": [
      "fix_syntax"
    ],
    "explanation": "The correct demand function should be Qd = f(P, I, Ps, Pc, T). The variable T represents taste and preferences, which is a factor that influences demand. By writing the formula as Qd = f(P, I, Ps, Pc) + T, the researcher incorrectly implies that T is an exogenous variable that affects demand additively, rather than being a factor that is already accounted for within the function f. Mathematically, this can be represented as $Qd = f(P, I, Ps, Pc, T) = \\alpha + \\beta P + \\gamma I + \\delta Ps + \\epsilon Pc + \\zeta T$, where $\\alpha, \\beta, \\gamma, \\delta, \\epsilon,$ and $\\zeta$ are parameters of the demand function."
  },
  {
    "id": "Demand_Schedule_Trace",
    "type": "trace",
    "difficulty": "L2",
    "question": "What is the exact output of the total revenue after a 20% increase in the cost of production causes a supply curve shift, leading to a new equilibrium price and quantity in the market for oranges, given an initial demand schedule Qd = 100 - 2P and an initial supply schedule Qs = 50 + 3P?",
    "content": "The demand schedule is Qd = 100 - 2P and the initial supply schedule is Qs = 50 + 3P. To find the initial equilibrium price and quantity, we equate Qd and Qs: 100 - 2P = 50 + 3P. Solving for P, we get 5P = 50, P = 10. Substituting P back into either equation, Q = 100 - 2*10 = 80. The initial total revenue is P * Q = 10 * 80 = 800. A 20% increase in the cost of production shifts the supply curve to Qs = 50 + 3(P - 0.2*P) = 50 + 3*0.8P = 50 + 2.4P. Equating the new Qs to Qd: 100 - 2P = 50 + 2.4P. Solving for P, we get 4.4P = 50, P = 50 / 4.4 = 11.36. Substituting P back into either equation, Q = 100 - 2*11.36 = 77.28. The new total revenue is 11.36 * 77.28 = 878.05.",
    "answer": "878.05",
    "explanation": "The initial equilibrium is found by solving the equation $100 - 2P = 50 + 3P$. This yields $5P = 50$ or $P = 10$. Substituting $P$ back into the demand equation gives $Q = 100 - 2*10 = 80$. The total revenue is $TR = P * Q = 10 * 80 = 800$. After the increase in production costs, the new supply curve is $Qs = 50 + 3(P - 0.2P) = 50 + 2.4P$. Setting $Qd = Qs$, we have $100 - 2P = 50 + 2.4P$. Solving for $P$ yields $4.4P = 50$ or $P = 50 / 4.4 = 11.36$. Substituting $P$ into the demand equation gives $Q = 100 - 2*11.36 = 77.28$. The new total revenue is $TR = 11.36 * 77.28 = 878.05$."
  }
]

```