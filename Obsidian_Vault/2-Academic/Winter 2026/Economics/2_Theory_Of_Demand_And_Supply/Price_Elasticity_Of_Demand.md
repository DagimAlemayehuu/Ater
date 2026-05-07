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

Here's a 5-step technical walkthrough of how the concept of Price Elasticity of Demand operates:

1. **Initial State**: Suppose the price of a good is $10 and the quantity demanded is 100 units. The PED is calculated as: PED = (percentage change in quantity demanded) / (percentage change in price).

2. **Price Change**: The price of the good increases to $12, resulting in a 20% increase in price. The quantity demanded decreases to 80 units, resulting in a 20% decrease in quantity demanded.

3. **PED Calculation**: Using the PED formula, we calculate: PED = (-20%) / (20%) = -1. This means that for every 1% change in price, the quantity demanded changes by 1%.

4. **Elasticity Interpretation**: Since the PED is equal to 1, the demand is said to be unit elastic. If the PED were greater than 1, the demand would be elastic, and if it were less than 1, the demand would be inelastic.

5. **Intermediate State Change**: Suppose the price increases to $15, resulting in a 50% increase in price from the original $10. The quantity demanded decreases to 60 units, resulting in a 40% decrease in quantity demanded. The PED is recalculated as: PED = (-40%) / (50%) = -0.8. This means that the demand is now inelastic, as the PED is less than 1.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The price elasticity of demand for a life-saving medication is typically elastic, meaning that a small price increase leads to a large reduction in the quantity demanded.",
    "answer": false,
    "explanation": "The price elasticity of demand for a life-saving medication is typically inelastic. This is because the demand for such a medication is less responsive to price changes, as individuals will continue to purchase it even at a higher price due to its essential nature. Mathematically, this can be represented by the price elasticity of demand formula: $E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$. For inelastic goods, $E_d < 1$, indicating that a 1% change in price leads to a less than 1% change in the quantity demanded. In the context of a life-saving medication, the demand is often characterized by $E_d < 1$, making it inelastic."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "During a severe influenza outbreak, the demand for surgical masks increases drastically. The government is concerned that if the price of masks rises too high, it may limit access for those who need it most. Suppose the initial price of a surgical mask is $1, and the quantity demanded is 100,000 units per week. If the government imposes a price ceiling of $1.20, but due to shortages, black market prices rise to $1.50. At $1.50, the quantity demanded drops to 80,000 units per week. Calculate the price elasticity of demand for surgical masks in this scenario and provide a mastery solution to prevent system failure in the public health sector.",
    "answer": "The price elasticity of demand (PED) can be calculated using the formula: PED = (\\% \\Delta Q_d) / (\\% \\Delta P). First, we need to calculate the percentage changes in quantity demanded and price. The quantity demanded changes from 100,000 to 80,000 units, which is a decrease of 20,000 units. The percentage change in quantity demanded is: (\\Delta Q_d / Q_d) * 100 = (-20,000 / 100,000) * 100 = -20%. The price changes from $1 to $1.50, which is an increase of $0.50. The percentage change in price is: (\\Delta P / P) * 100 = (0.50 / 1) * 100 = 50%. Therefore, PED = (-20%) / (50%) = -0.4. Since the PED is less than 1, the demand for surgical masks is inelastic. To prevent system failure in the public health sector, the government could implement a subsidy for surgical mask manufacturers to increase supply, or implement a rationing system to ensure equitable distribution.",
    "explanation": "The underlying mechanism of PED is based on the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, and vice versa. Mathematically, this can be represented by the demand function: Q_d = f(P), where Q_d is the quantity demanded and P is the price. The PED formula is: PED = (\\% \\Delta Q_d) / (\\% \\Delta P) = ((\\Delta Q_d / Q_d) / (\\Delta P / P)). In this scenario, the PED is -0.4, indicating that for every 1% increase in price, the quantity demanded decreases by 0.4%. To derive the PED formula, we can use the demand function and the definition of elasticity: PED = (dQ_d / dP) * (P / Q_d). Using LaTeX, we can represent the PED formula as: $PED = \\frac{\\% \\Delta Q_d}{\\% \\Delta P} = \\frac{\\frac{\\Delta Q_d}{Q_d}}{\\frac{\\Delta P}{P}} = \\frac{dQ_d}{dP} \\cdot \\frac{P}{Q_d}$."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of Price Elasticity Of Demand in the context of Global Supply Chain & Maritime Logistics, and provide a scenario where it can be applied.",
    "answer": "The Price Elasticity Of Demand measures the responsiveness of the quantity demanded of a good to a change in its price. In the context of Global Supply Chain & Maritime Logistics, it is crucial in determining the impact of price changes on the demand for shipping services or imported goods. For instance, if the price of shipping a container from Asia to Europe increases by 10%, and the quantity demanded decreases by 15%, the demand is elastic. This means that a small price change leads to a significant change in the quantity demanded, indicating that customers are highly sensitive to price changes.",
    "explanation": "The Price Elasticity Of Demand can be represented mathematically as $E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$, where $E_d$ is the price elasticity of demand, $\\% \\Delta Q_d$ is the percentage change in quantity demanded, and $\\% \\Delta P$ is the percentage change in price. In the context of Global Supply Chain & Maritime Logistics, the demand function can be represented as $Q_d = f(P, I, P_s)$, where $Q_d$ is the quantity demanded, $P$ is the price of the good or shipping service, $I$ is the income of the consumer, and $P_s$ is the price of substitutes. The demand schedule and demand curve illustrate the relationship between the price and quantity demanded, and the price elasticity of demand can be calculated using the demand function."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for calculating Price Elasticity Of Demand.",
    "steps": [
      "Calculate the percentage change in quantity demanded",
      "Calculate the percentage change in price",
      "Determine the price elasticity of demand using the formula"
    ],
    "answer": [
      "Calculate the percentage change in price",
      "Calculate the percentage change in quantity demanded",
      "Determine the price elasticity of demand using the formula"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output for the price elasticity of demand calculation in telecommunications, given a 10% increase in price results in a 20% decrease in quantity demanded?",
    "content": "The price elasticity of demand (PED) is calculated using the formula: PED = (Percentage Change in Quantity Demanded) / (Percentage Change in Price). Given a 10% increase in price and a 20% decrease in quantity demanded, we can substitute these values into the formula.",
    "answer": "-2",
    "explanation": "Using the PED formula: PED = (-20%) / (10%) = -2. The negative sign indicates that the relationship between price and quantity demanded is inverse, which is consistent with the Law of Demand. The absolute value of 2 indicates that demand is elastic, as a 1% change in price leads to a 2% change in quantity demanded. In LaTeX, the PED formula can be represented as: $PED = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$, where $\\% \\Delta Q_d$ is the percentage change in quantity demanded and $\\% \\Delta P$ is the percentage change in price. Substituting the given values: $PED = \\frac{-20}{10} = -2$."
  }
]

```