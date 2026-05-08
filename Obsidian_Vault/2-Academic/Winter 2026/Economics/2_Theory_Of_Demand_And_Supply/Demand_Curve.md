---

title: Demand_Curve
course: "Economics"
unit: '2'
semester: "Winter 2026"
mode: ECON-MICRO
type: atomic_note
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
date: '2026-05-08'
prerequisites:
- "[[Demand_Schedule]]"
source_pages:
- 7
generated: true

---

## 1. Mental Model

Imagine you're at a candy store and you love their super yummy chocolates! The owner, Mr. Sweet, sells each chocolate for $1. You really want 5 chocolates, but if he raises the price to $2, you might only want 3 chocolates. If he charges $3, you might only buy 1 chocolate. This is like your own 'demand curve'! It shows how many chocolates you're willing to buy (demand) at different prices. When the price is low ($1), you're willing to buy more (5 chocolates), but when the price is high ($3), you're willing to buy less (1 chocolate). That's basically what a demand curve does - it shows how the price of something affects how much of it you want to buy!

## 2. Micro Theory

The demand curve is a fundamental concept in microeconomics that illustrates the relationship between the price of a good and the quantity demanded by consumers. It is a graphical representation of the demand schedule, which is a table that shows the quantity demanded of a good at various price levels. The demand curve is typically downward sloping, indicating that as the price of the good increases, the quantity demanded decreases, and vice versa.

The demand curve is derived from the [[Demand_Function]], which expresses the quantity demanded as a function of the price of the good, income, and other factors that influence demand. The demand function can be represented as Qd = f(P, I, T, Psub, Pcom), where Qd is the quantity demanded, P is the price of the good, I is the income of consumers, T is the taste and preference of consumers, Psub is the price of substitutes, and Pcom is the price of complements.

The [[Law_Of_Demand]] states that, ceteris paribus (all other things being equal), an increase in the price of a good leads to a decrease in the quantity demanded. This is reflected in the downward slope of the demand curve. The [[Ceteris_Paribus]] assumption is crucial in understanding the demand curve, as it implies that all other factors that influence demand are held constant.

The demand curve can be shifted by changes in [[Determinants_Of_Demand]], such as income, taste and preference, price of substitutes and complements, and [[Consumer_Expectations]]. For example, an increase in income can lead to an increase in the quantity demanded at each price level, resulting in a rightward shift of the demand curve. Similarly, a change in [[Taste_And_Preference]] can also lead to a shift in the demand curve.

The [[Market_Demand_Curve]] is the aggregation of individual demand curves, and it represents the total quantity demanded by all consumers in the market at each price level. The market demand curve is also downward sloping, but it is less elastic than individual demand curves.

The elasticity of the demand curve can be measured by [[Price_Elasticity_Of_Demand]], which shows the responsiveness of the quantity demanded to a change in price. The price elasticity of demand is influenced by the availability of [[Substitutes_And_Complements]], [[Income_Elasticity_Of_Demand]], and the [[Number_Of_Buyers]].

Changes in the demand curve can lead to changes in [[Market_Equilibrium]], resulting in either a surplus or a shortage. A [[Surplus_And_Shortage]] occurs when the quantity supplied exceeds the quantity demanded or vice versa. The [[Effects_Of_Shift_In_Demand_And_Supply]] on market equilibrium can be analyzed by examining the changes in the demand and supply curves.

In conclusion, the demand curve is a graphical representation of the relationship between the price of a good and the quantity demanded. It is influenced by various factors, including [[Determinants_Of_Demand]], [[Change_In_Demand]], and [[Market_Demand]]. Understanding the demand curve is crucial in analyzing [[Market_Equilibrium]] and the effects of changes in market conditions.

## 3. Limitations & Edge Cases

The individual demand curve, a fundamental concept in microeconomics, has several limitations. It assumes that consumers have perfect information about the market, and their preferences are well-defined and stable. However, in reality, consumers' tastes and preferences can change over time, and they may not have complete knowledge about the market. Additionally, the individual demand curve does not account for the effects of advertising, social influences, and other external factors that can impact consumer behavior. Furthermore, the curve assumes a continuous and smooth relationship between price and quantity demanded, which may not hold in cases where consumers have lumpy or indivisible demands, or where there are threshold effects, such as a minimum purchase requirement. Moreover, the individual demand curve may not be well-defined for very low or very high prices, as consumers may not be able to afford a good at a very high price or may not perceive value at a very low price, leading to a lack of data in these regions.

## 4. Market Graph

```mermaid

graph LR
    P[Price] -->|increases| Qd[Quantity Demanded]
    P -->|decreases| Qd
    Qd -->|decreases| D[Demand Curve]
    Qd -->|increases| D
    D -->|Downward Sloping| LR[Law of Demand]

```

The demand curve illustrates the inverse relationship between the price of a good and the quantity demanded by consumers, with a downward slope indicating that as price increases, quantity demanded decreases. The individual demand curve represents a single consumer's demand for a good, showing how their purchasing decisions change in response to changes in price.

## 5. Walkthrough

Here is the 5-step technical walkthrough of how the Demand Curve operates:

**Step 1: Define the Demand Function**
The demand function is represented as Qd = f(P, I, T, Psub, Pcom), where Qd is the quantity demanded, P is the price of the good, I is the income of consumers, T is the taste and preference of consumers, Psub is the price of substitutes, and Pcom is the price of complements.

**Step 2: Create a Demand Schedule**
Create a table that shows the quantity demanded of a good at various price levels. For example, assume the demand schedule is:

| Price (P) | Quantity Demanded (Qd) |
| --- | --- |
| $5 | 100 |
| $4 | 120 |
| $3 | 150 |
| $2 | 200 |

**Step 3: Plot the Demand Curve**
Plot the demand schedule on a graph, with the price of the good on the vertical axis and the quantity demanded on the horizontal axis. The resulting curve is typically downward sloping.

**Step 4: Apply the Law of Demand**
According to the Law of Demand, ceteris paribus (all other things being equal), as the price of the good increases, the quantity demanded decreases, and vice versa. For example, if the price increases from $4 to $5, the quantity demanded decreases from 120 to 100.

**Step 5: Analyze the Demand Curve**
Analyze the demand curve to understand the relationship between the price of the good and the quantity demanded. For instance, if the price is $3, the quantity demanded is 150. If the price decreases to $2, the quantity demanded increases to 200, illustrating the downward-sloping nature of the demand curve.

---

## Review & Practice

```interactive-quiz

[
  {
    "type": "mcq",
    "difficulty": "L1",
    "question": "In the context of Game Theory Application, what is the primary effect of an increase in the price of a good on the demand curve, assuming all other factors remain constant?",
    "options": {
      "A": "The demand curve shifts to the right.",
      "B": "The demand curve shifts to the left.",
      "C": "There is a movement up along the demand curve.",
      "D": "The demand curve becomes more elastic."
    },
    "answer": "C",
    "explanation": "According to the Law of Demand, an increase in the price of a good leads to a decrease in the quantity demanded, assuming all other factors remain constant. This is represented by a movement up along the demand curve, not a shift of the curve itself. The curve's position is determined by factors such as income, taste, and prices of substitutes and complements. Therefore, the correct answer is that there is a movement up along the demand curve."
  },
  {
    "type": "fill_in",
    "difficulty": "L2",
    "question": "Fill in the blank.",
    "textWithBlanks": "The demand curve is a graphical representation of the relationship between the price of a good and the Blank.",
    "answer": [
      "quantity demanded"
    ],
    "explanation": "The demand curve illustrates the relationship between the price of a good and the quantity demanded by consumers. It is a graphical representation of the demand schedule, which is a table that shows the quantity demanded of a good at various price levels. The demand curve is typically downward sloping, indicating that as the price of the good increases, the quantity demanded decreases, and vice versa. This relationship can be expressed using the LaTeX equation: $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the good."
  },
  {
    "type": "debug",
    "difficulty": "L2",
    "question": "Find the bug in the demand curve formula: Qd = 100 - 2P + 0.5I + 0.2Psub - 0.1Pcom. The price elasticity of demand is given as: Ed = (dQd/dP) * (P/Qd).",
    "content": "The demand curve for a good is given by Qd = 100 - 2P + 0.5I + 0.2Psub - 0.1Pcom, where Qd is the quantity demanded, P is the price of the good, I is the income of consumers, Psub is the price of substitutes, and Pcom is the price of complements. The price elasticity of demand is Ed = (dQd/dP) * (P/Qd).",
    "answer": "The derivative of Qd with respect to P is -2, but it should be a negative value with a specific condition.",
    "required_keywords": [
      "fix_this_keyword"
    ],
    "explanation": "The demand curve formula provided is Qd = 100 - 2P + 0.5I + 0.2Psub - 0.1Pcom. Taking the derivative of Qd with respect to P, we get dQd/dP = -2. However, the price elasticity of demand formula Ed = (dQd/dP) * (P/Qd) assumes that dQd/dP is a constant. In reality, dQd/dP may vary depending on the specific values of P, I, Psub, and Pcom. A more accurate representation would be to include the condition that the derivative is only valid when the other variables are held constant, i.e., dQd/dP = -2 | I, Psub, Pcom = constant. The bug can be fixed by adding this condition. LaTeX representation: $\\frac{\\partial Q_d}{\\partial P} = -2$."
  },
  {
    "type": "trace",
    "difficulty": "L2",
    "question": "What is the exact output of the demand curve when the price of a good increases from $10 to $15, given that the demand function is Qd = 100 - 2P, and the initial quantity demanded is 80 units?",
    "content": "The demand function is Qd = 100 - 2P. Initially, when P = $10, Qd = 100 - 2($10) = 80 units. When the price increases to $15, Qd = 100 - 2($15) = 70 units.",
    "answer": "70 units",
    "explanation": "The demand curve is a graphical representation of the relationship between the price of a good and the quantity demanded. The demand function Qd = 100 - 2P shows that the quantity demanded decreases by 2 units for every $1 increase in price. Using this function, we can calculate the quantity demanded at different price levels. When the price increases from $10 to $15, the quantity demanded decreases from 80 units to 70 units. This can be represented as a movement along the demand curve. The exact output of the demand curve in this scenario is 70 units."
  }
]

```