---

title: Cross_Price_Elasticity_Of_Demand
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Chapter_2.pdf]]"
source_pages:
- 35
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Income_Elasticity_Of_Demand]]"

---

# 1. Mental Model

Imagine you love peanut butter and jelly sandwiches. If the price of jelly goes up, you might buy less jelly because it's more expensive. But, you might also buy less peanut butter because the two go together - that's kind of like what [[Cross_Price_Elasticity_Of_Demand]] measures.

# 2. Economic Theory

[[Cross_Price_Elasticity_Of_Demand]] measures how much the demand for one good (X) changes when the price of another good (Y) changes, assuming [[Ceteris_Paribus]]. It's calculated as the percentage change in quantity demanded of good X in response to a 1% change in the price of good Y. This concept helps us understand how [[Market_Demand]] for related goods, like complements or substitutes, is affected by price changes.

# 3. Economic Model

```mermaid

graph LR
    A[Good X] -->|Price Change| B[Good Y]
    B -->|Affects Demand| C[Good X Quantity]
    C -->|Measured by| D[Cross Price Elasticity]
    D -->|Formula:| E[ΔQx/Qx / ΔPy/Py]

```

## 4. Walkthrough

* The model starts with Good X and Good Y, where a price change in Good Y affects the demand for Good X.
* For example, if the price of jelly (Good Y) increases, it may lead to a decrease in the quantity demanded of peanut butter (Good X).
* The cross price elasticity measures this relationship by calculating the percentage change in quantity demanded of Good X in response to a 1% change in the price of Good Y.
* The formula for cross price elasticity is: ΔQx/Qx / ΔPy/Py, which represents the percentage change in quantity demanded of Good X divided by the percentage change in price of Good Y.

## 5. Market Failures

The concept of cross price elasticity of demand may fail in cases where goods are not substitutes or complements, or when there are other factors affecting demand. Common pitfalls include ignoring the ceteris paribus assumption, which can lead to incorrect conclusions about the relationship between goods. Additionally, cross price elasticity may not account for changes in consumer preferences or income levels.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The Cross Price Elasticity Of Demand measures the change in demand for a good due to a change in its own price.",
    "answer": false,
    "explanation": "The Cross Price Elasticity Of Demand specifically measures how the demand for one good (X) changes when the price of another good (Y) changes, not due to a change in its own price. This concept assumes ceteris paribus, meaning all other factors remain constant, and it's calculated as the percentage change in quantity demanded of good X in response to a 1% change in the price of good Y."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "A local grocery store is considering increasing the price of its store-brand peanut butter by 15%. The store also sells a popular grape jelly that complements peanut butter well in sandwiches. If the cross price elasticity of demand between peanut butter and grape jelly is -0.8, and assuming the current price and quantity sold of grape jelly are $2 and 1000 units per week respectively, calculate the expected change in the quantity demanded of grape jelly in response to the 15% price increase of peanut butter.",
    "answer": "The quantity demanded of grape jelly is expected to decrease by 12%.",
    "explanation": "The cross price elasticity of demand (CPED) measures the percentage change in quantity demanded of one good in response to a 1% change in the price of another good. Given that the CPED between peanut butter and grape jelly is -0.8, this implies that for every 1% change in the price of peanut butter, the quantity demanded of grape jelly changes by -0.8%. Since the price of peanut butter is increasing by 15%, we multiply this by the CPED: 15% * -0.8 = -12%. Therefore, the quantity demanded of grape jelly is expected to decrease by 12%. The current quantity sold of grape jelly is not required for the calculation of the percentage change in quantity demanded."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain Cross Price Elasticity Of Demand and its underlying mechanism deeply.",
    "answer": "Cross Price Elasticity Of Demand measures how much the demand for one good changes when the price of another good changes. It is calculated as the percentage change in quantity demanded of one good in response to a 1% change in the price of another good. This concept helps businesses understand how changes in prices of related goods can impact their sales. For example, if the price of jelly increases, the demand for peanut butter may decrease because the two goods are complements.",
    "explanation": "The underlying mechanism of Cross Price Elasticity Of Demand is based on the concept of substitution and complementarity between goods. When the price of one good increases, consumers may switch to alternative goods that are substitutes, leading to an increase in demand for those substitutes. Conversely, if two goods are complements, an increase in the price of one good may lead to a decrease in demand for the other good, as consumers may choose to buy less of both goods. The Cross Price Elasticity Of Demand formula, which is the percentage change in quantity demanded of good X in response to a 1% change in the price of good Y, helps businesses and economists quantify these relationships and make informed decisions."
  }
]

```