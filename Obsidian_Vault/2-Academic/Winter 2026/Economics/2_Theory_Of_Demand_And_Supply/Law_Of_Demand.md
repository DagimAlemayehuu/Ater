---
title: Law_Of_Demand
course: "[[Economics]]"
unit: '2'
semester: "[[Winter 2026]]"
mode: ECON-MICRO
type: atomic_note
date: 2026-05-07
prerequisites:
- Theory_Of_Demand
source_pages:
- 4
hub: "[[2_Theory_of_Demand_and_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
---

## 1. Mental Model

Imagine you're at a lemonade stand on a hot summer day. The owner, let's call her Emma, is selling lemonade for 50 cents a cup. You and your friends really want lemonade, so you all buy a cup each. But then, Emma puts up a new sign that says "Lemonade: 1 dollar a cup!" Suddenly, you and your friends think, "Hmm, that's too expensive!" and you decide to buy only half a cup or even go to another stand that still sells lemonade for 50 cents. This is kind of like what happens with the Law of Demand: when the price of something (like lemonade) goes up, people want to buy less of it, and when the price goes down, people want to buy more of it.

## 2. Micro Theory

The **Law of Demand** is a fundamental concept in microeconomics that describes the inverse relationship between the price of a product and the quantity demanded, ceteris paribus [[Ceteris_Paribus]]. This concept is rooted in the [[Theory_Of_Demand]], which examines how consumers make decisions about the goods and services they purchase.

Formally, the Law of Demand can be expressed The Law of Demand states that, as the price of a product increases, the quantity demanded decreases, and vice versa, assuming [[Ceteris_Paribus]].

This relationship is often illustrated graphically as a [[Demand_Curve]], which plots the quantity demanded against the price of the product. The demand curve typically slopes downward from left to right, indicating that as the price of the product increases, the quantity demanded decreases. The [[Demand_Schedule]], a table that shows the quantity demanded at different price levels, is another way to represent the Law of Demand.

The Law of Demand is influenced by various [[Determinants_Of_Demand]], including Taste And Preference|tastes And Preferences, Income Elasticity Of Demand|income, Price Elasticity Of Demand|price Elasticity Of Demand, Substitutes And Complements|substitutes And Complements, Normal And Inferior Goods|normal And Inferior Goods, Consumer Expectations|consumer Expectations, and Number Of Buyers|number Of Buyers. Changes in these determinants can lead to a [[Change_In_Demand]], which is a shift in the demand curve.

For instance, if the price of a substitute good decreases, consumers may switch to the substitute, leading to a decrease in the quantity demanded of the original product, and a leftward shift of the demand curve. Conversely, if consumer expectations about future prices change, they may increase their demand for a product today, leading to a rightward shift of the demand curve.

The [[Market_Demand_Curve]] and [[Market_Demand]] are also affected by the Law of Demand, as they represent the aggregate demand of all consumers in a market. Understanding the Law of Demand and its underlying mechanisms is essential for businesses, policymakers, and economists to analyze [[Market_Equilibrium]], [[Surplus_And_Shortage]], and the [[Effects_Of_Shift_In_Demand_And_Supply]].

In conclusion, the Law of Demand provides a fundamental understanding of how consumers respond to changes in price, and it serves

## 3. Limitations & Edge Cases

The Law of Demand has several limitations and edge cases, including the existence of Veblen goods, where demand increases with price due to their prestige or status symbol connotation; Giffen goods, which are essential goods for which there are no close substitutes, leading to an increase in demand as their price rises; and the income effect being outweighed by the substitution effect in certain cases. Additionally, the law may not hold in situations where consumers are unaware of the price or have limited information about alternatives. Furthermore, the law assumes that the price change is not accompanied by a change in consumer income or tastes, and that there are no external factors influencing demand; if these assumptions are not met, the law may not hold. Lastly, in cases of panic buying or expectation of future price increases, demand may increase even if current price increases, thereby violating the law.

## 4. Market Graph

```mermaid

graph LR
    A[Price (P)] -->|increases| B[Quantity Demanded (Qd) decreases]
    A -->|decreases| C[Quantity Demanded (Qd) increases]
    C --> D[Law of Demand: Inverse Relationship]
    B --> D

```

The provided Mermaid flowchart illustrates the Law of Demand, which states that as the price of a product increases, the quantity demanded decreases, and vice versa, assuming ceteris paribus. This inverse relationship is a fundamental concept in microeconomics and is commonly represented graphically as a downward-sloping demand curve.

## 5. Walkthrough

**Step 1: Define the Demand Function**

The demand function is defined as Qd = f(P), where Qd is the quantity demanded and P is the price of the product. For simplicity, let's assume a linear demand function: Qd = a - bP, where 'a' and 'b' are constants. This function represents the relationship between the quantity demanded and the price of the product, ceteris paribus.

**Step 2: Specify the Payoff Matrix for Game Theory Application**

In a Game Theory application, we need to specify a payoff matrix that represents the outcomes for each player. Let's assume a simple game between a monopolist (Seller) and a consumer (Buyer). The payoff matrix is as follows:

|  | Buyer Buys | Buyer Doesn't Buy |
| --- | --- | --- |
| **Seller Sets High Price (P_H)** | (U_H, V_H) | (0, 0) |
| **Seller Sets Low Price (P_L)** | (U_L, V_L) | (0, 0) |

Here, U_H and U_L are the utilities for the Seller when setting a high and low price, respectively. V_H and V_L are the utilities for the Buyer when buying at a high and low price, respectively.

**Step 3: Derive the Demand Curve**

Using the demand function Qd = a - bP, we can derive the demand curve. Let's assume a = 100 and b = 2. The demand function becomes Qd = 100 - 2P. We can plot the demand curve as follows:

| Price (P) | Quantity Demanded (Qd) |
| --- | --- |
| 10 | 80 |
| 20 | 60 |
| 30 | 40 |
| 40 | 20 |

**Step 4: Analyze the Game Theoretic Equilibrium**

Using the payoff matrix and demand curve, we can analyze the game theoretic equilibrium. Let's assume the Seller sets a high price (P_H = 30) and the Buyer buys. The payoff is (U_H, V_H) = (40, 40). If the Seller sets a low price (P_L = 10), the payoff is (U_L, V_L) = (80, 80).

**Step 5: Apply the Law of Demand**

As the price increases from P_L (10) to P_H (30), the quantity demanded decreases from 80 to 40, ceteris paribus. This illustrates the Law of Demand, which states that, as the price of a product increases, the quantity demanded decreases, and vice versa. In this game theoretic application, the Seller and Buyer make decisions based on their payoffs, and the Law of Demand influences their choices. The Seller sets a price that balances revenue and demand, while the Buyer decides whether to buy based on their utility.

---

## Review & Practice

```interactive-quiz

[
  {
    "id": "generate_unique_id",
    "type": "mcq",
    "difficulty": "L1",
    "question": "In the context of Game Theory Application and microeconomics, what is the correct interpretation of the Law of Demand in relation to elasticity calculations, specifically when analyzing the responsiveness of quantity demanded to changes in price?",
    "options": {
      "A": "The elasticity of demand is directly proportional to the price level, indicating that higher prices lead to more elastic demand.",
      "B": "The Law of Demand implies that the price elasticity of demand is typically negative, reflecting that an increase in price leads to a decrease in quantity demanded.",
      "C": "The demand curve shifts to the right when the price elasticity of demand increases, indicating a more responsive quantity demanded to price changes.",
      "D": "The elasticity of demand is constant along a linear demand curve, making it a reliable measure for predicting changes in quantity demanded."
    },
    "answer": "B",
    "explanation": "The Law of Demand states that, ceteris paribus, as the price of a product increases, the quantity demanded decreases. This inverse relationship is often represented by a downward-sloping demand curve. The price elasticity of demand (PED) measures the responsiveness of the quantity demanded to a change in price, and it is usually expressed as a negative value because of the inverse relationship between price and quantity demanded. The correct interpretation is that the Law of Demand implies that the price elasticity of demand is typically negative, reflecting that an increase in price leads to a decrease in quantity demanded. Mathematically, this can be represented as $PED = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$, which is typically negative due to the negative relationship between $P$ and $Q_d$. Therefore, option B is correct."
  },
  {
    "id": "generate_unique_id",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "Fill in the blank.",
    "textWithBlanks": "The Blank is a table that shows the quantity demanded at different price levels, representing the Law of Demand.",
    "answer": [
      "Demand Schedule"
    ],
    "explanation": "The \\textbf{Demand Schedule} is a table that shows the quantity demanded at different price levels, representing the Law of Demand. It is a tool used to illustrate the relationship between the price of a product and the quantity demanded, ceteris paribus. The demand schedule is typically used to derive the demand curve, which plots the quantity demanded against the price of the product."
  },
  {
    "id": "QOD_001",
    "type": "debug",
    "difficulty": "L2",
    "question": "Find the bug in the implementation of the Law of Demand formula: $Q_d = \\beta_0 \\cdot P^{\\beta_1} \\cdot e^{\\epsilon}$ where $Q_d$ is the quantity demanded, $P$ is the price, $\\beta_0$ and $\\beta_1$ are constants, and $\\epsilon$ is the error term.",
    "content": "The Law of Demand states that, as the price of a product increases, the quantity demanded decreases, and vice versa, assuming ceteris paribus. A common representation of the Law of Demand is through a linear demand function: $Q_d = \\alpha - \\beta \\cdot P$. However, a researcher implemented a non-linear demand function: $Q_d = \\beta_0 \\cdot P^{\\beta_1} \\cdot e^{\\epsilon}$.",
    "answer": "The bug is that the non-linear demand function $Q_d = \\beta_0 \\cdot P^{\\beta_1} \\cdot e^{\\epsilon}$ does not guarantee a downward-sloping demand curve.",
    "explanation": "The Law of Demand requires that $\\frac{\\partial Q_d}{\\partial P} < 0$. For the non-linear demand function $Q_d = \\beta_0 \\cdot P^{\\beta_1} \\cdot e^{\\epsilon}$, the derivative with respect to $P$ is $\\frac{\\partial Q_d}{\\partial P} = \\beta_0 \\cdot \\beta_1 \\cdot P^{\\beta_1 - 1} \\cdot e^{\\epsilon}$. For the demand curve to be downward-sloping, $\\beta_1$ must be negative. However, the implementation does not ensure this condition, and if $\\beta_1$ is positive, the demand curve will be upward-sloping, violating the Law of Demand. In contrast, the linear demand function $Q_d = \\alpha - \\beta \\cdot P$ inherently satisfies the Law of Demand if $\\beta > 0$.",
    "required_keywords": [
      "fix_syntax"
    ]
  },
  {
    "id": "generate_unique_id",
    "type": "trace",
    "difficulty": "L2",
    "question": "What is the exact output of the change in equilibrium price and total revenue when a cost increase, such as higher wages, impacts the supply curve, causing a shift to the left, and the demand curve remains constant, in a market with a linear demand function Qd = 100 - 2P and a linear supply function Qs = 2P - 50, assuming an initial equilibrium price of $37.50 and an initial equilibrium quantity of 25 units, and the cost increase causes a new supply function Qs = 2P - 70?",
    "content": "The market initially has a demand function Qd = 100 - 2P and a supply function Qs = 2P - 50. At equilibrium, Qd = Qs. So, 100 - 2P = 2P - 50. Solving for P, we get 4P = 150, P = $37.50. Substituting P back into either equation, Q = 25 units. If the supply function shifts to Qs = 2P - 70 due to increased costs, we solve for the new equilibrium: 100 - 2P = 2P - 70. This gives 4P = 170, P = $42.50. Substituting P back into either equation, Q = 15 units. The change in equilibrium price is $5, and the change in quantity is -10 units. The initial total revenue is $937.50, and the new total revenue is $637.50.",
    "answer": "$42.50",
    "explanation": "The mechanism underlying this change can be understood through the basic principles of microeconomics, particularly the Law of Demand and the concept of supply and demand equilibrium. Formally, the equilibrium condition can be expressed as $Qd = Qs$. For linear functions, this can be represented as $100 - 2P = 2P - 50$. Solving for $P$ yields $P = \\frac{150}{4} = 37.50$. When the supply curve shifts due to increased costs, the new equilibrium is found by solving $100 - 2P = 2P - 70$, which results in $P = \\frac{170}{4} = 42.50$. The LaTeX representation of the supply and demand equilibrium is $Qd = 100 - 2P$ and $Qs = 2P - 50$ shifting to $Qs = 2P - 70$. The total revenue $TR$ can be calculated as $TR = P \\times Q$. Initially, $TR = 37.50 \\times 25 = 937.50$. After the shift, $TR = 42.50 \\times 15 = 637.50$. The change in total revenue reflects the impact of the cost increase on market equilibrium."
  }
]

```