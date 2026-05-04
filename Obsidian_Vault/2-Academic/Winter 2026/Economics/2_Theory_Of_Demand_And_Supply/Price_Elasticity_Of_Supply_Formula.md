---

title: Price_Elasticity_Of_Supply_Formula
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Chapter_2.pdf]]"
source_pages:
- 48
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Elasticity_Of_Supply]]"

---

# 1. Mental Model

Imagine you have a lemonade stand and you're selling cups of lemonade for 50 cents each. If you raise the price to 75 cents, you might not sell as many cups, but you might still make more money because you're selling each cup for more. The question is, how much more or less will you sell when you change the price? That's basically what price elasticity of supply is - it's a measure of how much the amount of something people are willing to sell changes when the price changes.

# 2. Economic Theory

The [[Price_Elasticity_Of_Supply_Formula]] measures the responsiveness of the quantity supplied of a good to a change in its price, given [[Ceteris_Paribus]]. It is calculated as the percentage change in quantity supplied divided by the percentage change in price. The formula is: Price Elasticity of Supply = (Percentage Change in Quantity Supplied) / (Percentage Change in Price), often represented as [[Elasticity_Of_Supply]].

## 3. Economic Model

```mermaid

graph LR
    P1[Initial Price] --> Q1[Initial Quantity]
    P1 -->|Increase Price|> P2[New Price]
    P2 --> Q2[New Quantity]
    Q1 -->|Compare| Q2
    P1 --> PES[Price Elasticity of Supply]
    P2 --> PES
    Q1 --> PES
    Q2 --> PES

```

## 4. Walkthrough

* The initial price (P1) and quantity (Q1) are set, for example, at $0.50 and 100 cups of lemonade.
* The price is increased to a new price (P2), for example, $0.75, and the new quantity (Q2) sold is measured, for example, 80 cups.
* The price elasticity of supply (PES) is calculated using the formula: PES = (Q2 - Q1) / Q1 / (P2 - P1) / P1.
* The PES value indicates how responsive the quantity supplied is to the price change.

## 5. Market Failures

The concept of price elasticity of supply can fail when there are external factors affecting supply, such as changes in production costs or technology. Additionally, if the market is not competitive, firms may not respond to price changes as expected. Edge cases to watch out for include when the price change is too small or too large, leading to inaccurate estimates of elasticity.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The Price Elasticity Of Supply Formula is directly proportional to the change in quantity supplied.",
    "answer": false,
    "explanation": "The Price Elasticity Of Supply Formula is actually a measure of the responsiveness of the quantity supplied of a good to a change in its price, and it is calculated as the percentage change in quantity supplied divided by the percentage change in price. This means that it is not directly proportional to the change in quantity supplied, but rather a ratio of the percentage changes. Therefore, the statement is false."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "Maria owns a small bakery famous for its artisanal bread. She currently sells 200 loaves of bread per day at $2.50 each. If she increases the price to $3.00, she expects to sell 180 loaves per day. Using the Price Elasticity Of Supply Formula, calculate the price elasticity of supply and determine if the supply is elastic or inelastic.",
    "answer": "To calculate the price elasticity of supply, we use the formula: Price Elasticity of Supply (PES) = (Percentage Change in Quantity Supplied) / (Percentage Change in Price). First, we find the percentage change in quantity supplied: (New Quantity - Old Quantity) / Old Quantity * 100 = (180 - 200) / 200 * 100 = -20 / 200 * 100 = -10%. Then, we find the percentage change in price: (New Price - Old Price) / Old Price * 100 = ($3.00 - $2.50) / $2.50 * 100 = $0.50 / $2.50 * 100 = 20%. Now, we plug these into the PES formula: PES = (-10%) / (20%) = -0.5. The negative sign indicates that we are dealing with a supply curve, but for the purpose of elasticity, we consider the absolute value, which is 0.5. Since the PES is less than 1, the supply is inelastic.",
    "explanation": "The Price Elasticity of Supply (PES) measures how responsive the quantity supplied of a good is to changes in the price of the good. It is calculated as the percentage change in quantity supplied divided by the percentage change in price. In this scenario, Maria's bakery experiences a 10% decrease in the quantity supplied of bread when the price increases by 20%. The PES value of 0.5 indicates that for every 1% increase in price, the quantity supplied increases by 0.5%. A PES value less than 1 signifies that the supply is inelastic, meaning that changes in price have a relatively small effect on the quantity supplied. This is typical for goods with limited production flexibility, such as artisanal bread, where increasing production may not be feasible in the short term."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain the concept of price elasticity of supply and its underlying mechanism deeply.",
    "answer": "The price elasticity of supply is a measure of how much the quantity supplied of a good changes when its price changes. It is calculated using the formula: Price Elasticity of Supply = (Percentage Change in Quantity Supplied) / (Percentage Change in Price). A high price elasticity of supply indicates that the quantity supplied is very responsive to price changes, while a low price elasticity of supply indicates that the quantity supplied is not very responsive to price changes. The underlying mechanism is based on the law of supply, which states that as the price of a good increases, the quantity supplied also increases, as producers are incentivized to produce more.",
    "explanation": "The price elasticity of supply formula is based on the concept of responsiveness of suppliers to changes in price. When the price of a good increases, producers are incentivized to produce more, as they can earn higher revenues. This leads to an increase in the quantity supplied. The formula calculates the percentage change in quantity supplied in response to a percentage change in price, providing a measure of the responsiveness of suppliers. This concept is crucial in understanding how markets adjust to changes in price and how producers make decisions about production levels."
  }
]

```