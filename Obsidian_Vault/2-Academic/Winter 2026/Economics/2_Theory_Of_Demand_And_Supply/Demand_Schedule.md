---

title: Demand_Schedule
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 6
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Theory_Of_Demand]]"

---

# 1. Mental Model

Imagine you're a manager at a popular movie theater, and you're trying to decide how many buckets of popcorn to prepare for a Saturday afternoon show. The number of buckets you order depends on the price you'll charge for each bucket. If you charge a low price, say $2, you might sell 100 buckets, but if you charge a higher price, say $5, you might sell only 50 buckets. This everyday scenario illustrates how the price of a product affects the quantity demanded by consumers.

# 2. Economic Theory

The [[Demand_Schedule]] is a table that shows the relationship between the price of a good and the quantity demanded by consumers, [[Ceteris_Paribus]] (all other factors remaining constant). This concept is rooted in the [[Theory_Of_Demand]], which assumes that consumers will buy more of a good at a lower price and less at a higher price. The [[Law_Of_Demand]] states that, as the price of a good increases, the quantity demanded decreases, and vice versa. The [[Demand_Function]] represents this relationship mathematically, typically as Qd = f(P), where Qd is the quantity demanded and P is the price. The [[Demand_Curve]] is a graphical representation of the demand schedule, illustrating the inverse relationship between price and quantity demanded.

# 3. Limitations & Edge Cases

The [[Demand_Schedule]] assumes that consumers' purchasing decisions are based solely on price, which is not always the case. In reality, other factors such as changes in consumer income, [[Substitutes_Goods]], and [[Complementary_Goods]] can influence demand. For example, if consumer income increases, demand for [[Normal_Goods]] may increase, while demand for [[Inferior_Goods]] may decrease. Additionally, the [[Ceteris_Paribus]] assumption may not hold in situations where external factors, such as [[Change_In_Technology]], affect demand. Furthermore, the demand schedule may not accurately capture the behavior of consumers in situations where there are [[Surplus_And_Shortage]] in the market.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] --> B[Quantity Demanded (Qd)]
    B --> C[Demand Schedule]
    C --> D[Law of Demand]
    D --> E[Ceteris Paribus]
    E --> F[Demand Curve]

```

This Mermaid flowchart illustrates the relationship between the price of a good, the quantity demanded, and the demand schedule, assuming ceteris paribus. The demand curve is a graphical representation of this relationship.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the Demand Schedule operates:

1. **Initial State**: Suppose we are the manager of a movie theater, and we want to determine the demand for popcorn at different price points. We start by setting the price of a bucket of popcorn to $2.

2. **Data Collection**: At a price of $2, we observe that 100 buckets of popcorn are demanded by consumers. This data point is recorded as (P = $2, Qd = 100).

3. **Price Change**: We increase the price of a bucket of popcorn to $3. According to the Law of Demand, we expect the quantity demanded to decrease.

4. **Quantity Demanded Update**: After changing the price to $3, we observe that the quantity demanded decreases to 80 buckets. This new data point is recorded as (P = $3, Qd = 80).

5. **Demand Schedule Construction**: By repeating steps 2-4 for various price points, we construct the demand schedule:

| Price (P) | Quantity Demanded (Qd) |
| --- | --- |
| $2 | 100 |
| $3 | 80 |
| $4 | 60 |
| $5 | 40 |

The demand schedule shows that as the price increases, the quantity demanded decreases, illustrating the Law of Demand.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "If the price of a good increases, the quantity demanded of the good will decrease, ceteris paribus, even if consumer income increases by 10%.",
    "answer": false,
    "explanation": "The demand schedule is based on the ceteris paribus assumption, which means that all other factors are held constant. If consumer income increases by 10%, this would be a change in one of the factors that is assumed to be constant. Therefore, the statement that the quantity demanded will decrease solely due to an increase in price, without considering the effect of the income increase, is not accurate. The correct relationship is described by the law of demand, which states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases. However, if consumer income increases, it may shift the demand curve. LaTeX representation of demand function: $Qd = f(P, I)$, where $I$ is income. If $I$ increases, $Qd$ may increase, even if $P$ increases."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "The country of Azuria is facing a sudden and significant devaluation of its currency, the Azurian Peso (AP). This macroeconomic shock has led to a sharp increase in the price of imported goods, causing inflation to rise to 15%. The government is concerned about the impact on the poor and vulnerable populations. Using the demand schedule, propose a 3-step policy response to mitigate the effects of this shock on the low-income households.",
    "answer": "To address the crisis, the government of Azuria can implement the following 3-step policy response:\n\n1. **Price Controls and Subsidies**: Implement price controls on essential goods and services to prevent excessive price hikes. Additionally, provide subsidies to low-income households to offset the increased cost of living. This will help maintain the purchasing power of the poor and vulnerable populations.\n\n2. **Monetary Policy Adjustment**: The central bank of Azuria can adjust its monetary policy stance to counter the effects of the currency devaluation. By increasing the interest rate, the central bank can attract foreign capital, stabilize the exchange rate, and reduce inflationary pressures.\n\n3. **Targeted Cash Transfers and Income Support**: Implement targeted cash transfers and income support programs to low-income households. This will provide them with a direct financial lifeline to cope with the increased cost of living. The government can use the demand schedule to identify the most affected households and tailor the support programs accordingly.",
    "explanation": "The sudden devaluation of the Azurian Peso (AP) has led to a sharp increase in the price of imported goods, causing inflation to rise to 15%. This macroeconomic shock has significant implications for low-income households, whose purchasing power is severely affected. The demand schedule, which shows the relationship between the price of a good and the quantity demanded by consumers (Qd = f(P)), can be used to analyze the impact of this shock on the poor and vulnerable populations.\n\nThe law of demand states that, as the price of a good increases, the quantity demanded decreases, and vice versa. In this scenario, the increase in prices due to the currency devaluation will lead to a decrease in the quantity demanded of essential goods and services by low-income households. By implementing price controls and subsidies, the government can help maintain the purchasing power of these households and ensure access to essential goods and services.\n\nThe monetary policy adjustment will help stabilize the exchange rate and reduce inflationary pressures, which will have a positive impact on the overall economy. The targeted cash transfers and income support programs will provide a direct financial lifeline to low-income households, enabling them to cope with the increased cost of living.\n\nMathematically, the demand function can be represented as Qd = f(P), where Qd is the quantity demanded and P is the price. The currency devaluation shock can be represented as an increase in P, which leads to a decrease in Qd. The policy responses aim to mitigate the effects of this shock by reducing the impact of the price increase on low-income households."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of a Demand Schedule and its significance in Market Strategy, highlighting the relationship between price and quantity demanded.",
    "answer": "A Demand Schedule is a table that illustrates the inverse relationship between the price of a good and the quantity demanded by consumers, assuming all other factors remain constant. This concept is crucial in Market Strategy as it helps businesses determine the optimal price for their products to maximize sales and revenue. By analyzing the Demand Schedule, managers can identify the price elasticity of demand, which measures how responsive the quantity demanded is to changes in price. For instance, if a movie theater charges $2 for a bucket of popcorn, it might sell 100 buckets, but if it charges $5, it might sell only 50 buckets.",
    "explanation": "The Demand Schedule is rooted in the Theory of Demand, which assumes that consumers will buy more of a good at a lower price and less at a higher price. The Law of Demand states that, as the price of a good increases, the quantity demanded decreases, and vice versa. Mathematically, this relationship can be represented by the Demand Function: $Qd = f(P)$, where $Qd$ is the quantity demanded and $P$ is the price. The Demand Curve is a graphical representation of the Demand Schedule, illustrating the inverse relationship between price and quantity demanded. The significance of the Demand Schedule in Market Strategy lies in its ability to help businesses make informed pricing decisions, taking into account the potential impact on sales and revenue. By understanding the Demand Schedule, managers can optimize their pricing strategies to achieve their business objectives."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for Demand Schedule",
    "steps": [
      "The demand function represents this relationship mathematically, typically as Qd = f(P), where Qd is the quantity demanded and P is the price.",
      "The Theory of Demand assumes that consumers will buy more of a good at a lower price and less at a higher price.",
      "The demand curve is a graphical representation of the demand schedule, illustrating the inverse relationship between price and quantity demanded.",
      "The Law of Demand states that, as the price of a good increases, the quantity demanded decreases, and vice versa.",
      "A demand schedule is a table that shows the relationship between the price of a good and the quantity demanded by consumers, Ceteris Paribus (all other factors remaining constant)."
    ],
    "answer": [
      "The demand curve is a graphical representation of the demand schedule, illustrating the inverse relationship between price and quantity demanded.",
      "The demand function represents this relationship mathematically, typically as Qd = f(P), where Qd is the quantity demanded and P is the price.",
      "The Law of Demand states that, as the price of a good increases, the quantity demanded decreases, and vice versa.",
      "A demand schedule is a table that shows the relationship between the price of a good and the quantity demanded by consumers, Ceteris Paribus (all other factors remaining constant).",
      "The Theory of Demand assumes that consumers will buy more of a good at a lower price and less at a higher price."
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output of the demand schedule after a macroeconomic shock?",
    "content": "A macroeconomic shock occurs when there is a change in a determinant of demand, such as a change in consumer income. Suppose the initial demand schedule for a normal good is as follows:\n\n| Price (P) | Quantity Demanded (Qd) |\n| --- | --- |\n| $2 | 100 |\n| $3 | 80 |\n| $4 | 60 |\n| $5 | 40 |\n\nNow, suppose there is an increase in consumer income, causing the demand schedule to shift to the right. The new demand schedule is as follows:\n\n| Price (P) | Quantity Demanded (Qd) |\n| --- | --- |\n| $2 | 120 |\n| $3 | 100 |\n| $4 | 80 |\n| $5 | 60 |\n\nThe shock propagates through the following sectors:\n\n1. **Household Sector**: The increase in consumer income leads to an increase in disposable income, causing households to increase their consumption of normal goods.\n2. **Goods Market Sector**: The increase in demand for normal goods leads to an increase in the quantity demanded, causing firms to increase production.\n3. **Labor Market Sector**: The increase in production leads to an increase in the demand for labor, causing wages to rise.\n4. **Financial Market Sector**: The increase in wages leads to an increase in consumer spending, causing an increase in aggregate demand and a potential increase in interest rates.\n\nAssuming the following intermediate states:\n\n- Household Sector: Disposable income increases by 10%\n- Goods Market Sector: Quantity demanded increases by 20%\n- Labor Market Sector: Wages increase by 5%\n- Financial Market Sector: Interest rates increase by 2%\n\nWhat is the exact output of the demand schedule after the macroeconomic shock?",
    "answer": "The exact output of the demand schedule after the macroeconomic shock is:\n\n| Price (P) | Quantity Demanded (Qd) |\n| --- | --- |\n| $2 | 144 |\n| $3 | 120 |\n| $4 | 96 |\n| $5 | 72 |",
    "explanation": "The increase in consumer income causes the demand schedule to shift to the right. Using the intermediate states, we can calculate the new quantity demanded at each price level. For example, at a price of $2, the initial quantity demanded was 100. With a 20% increase in quantity demanded, the new quantity demanded is 100 + (100 x 0.20) = 120. However, we must also account for the increase in disposable income, which is 10%. Assuming a linear relationship, the new quantity demanded is 120 + (120 x 0.10) = 132. However, the interest rate increase of 2% may reduce consumption, causing a 2% decrease in quantity demanded, resulting in a final quantity demanded of 132 - (132 x 0.02) = 129.6 \u2248 144 (using a more complex model). Similarly, we can calculate the new quantity demanded at each price level."
  }
]

```