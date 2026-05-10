---

title: Demand_Curve
course: Economics
unit: '2'
semester: Winter 2026
mode: ECON-MICRO
type: atomic_note
hub: '[[2_Basics_Of_Economics_Hub]]'
source: '[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]'
date: '2026-05-10'
prerequisites:
- '[[Market_Equilibrium]]'
- '[[Demand_Function]]'
- '[[Substitute_Goods]]'
- '[[Normal_Goods]]'
source_pages:
- 7
generated: true

---


## 1. Mental Model

At a local farmer's market, the price of oranges varies from week to week, influencing how many kilograms of oranges customers buy. For instance, when the price is high, customers purchase fewer oranges, and when the price drops, they buy more. This everyday observation illustrates the concept of a demand curve, which graphically represents the relationship between the price of a commodity and the quantity demanded by consumers. The demand curve is typically downward sloping, indicating that as the price of the commodity increases, the quantity demanded decreases, and vice versa.

## 2. Quantitative Model

The demand curve is defined by the function $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the commodity. A common example of a demand function is the linear function $Q = a + bp$, where $a$ and $b$ are constants. The slope of the demand curve, represented by $b$, measures the change in quantity demanded in response to a change in price, calculated as $b = \frac{\Delta Q}{\Delta P}$. For example, given two points on the demand curve, $(Q_1, P_1) = (7, 4)$ and $(Q_2, P_2) = (5, 5)$, the slope $b$ can be calculated as $b = \frac{7 - 5}{4 - 5} = -2$. The intercept $a$ can then be determined by substituting $b$ and one of the points into the demand equation: $7 = a - 2 \cdot 4$, yielding $a = 15$. Thus, the demand function is $Q = 15 - 2P$. This demand curve [[Demand_Curve]] shows the relationship between the price of oranges and the quantity demanded, assuming other factors remain constant. Understanding the demand curve is crucial for analyzing [[Market_Equilibrium]] and the effects of changes in [[Demand_Function]].

### Key Takeaways:

- The slope of the demand curve, $b$, is calculated as $\frac{\Delta Q}{\Delta P}$, which in the example is $\frac{7-5}{4-5} = -2$.
- The demand function for oranges is $Q = 15 - 2P$, derived from the given points and slope.
- The demand curve is essential for understanding how changes in price affect the quantity demanded of a commodity, which is vital for businesses and policymakers.

## 3. Limitations & Edge Cases

The demand curve assumes that other factors affecting demand, such as consumer income, prices of [[Substitute_Goods]], and [[Normal_Goods]], remain constant. In reality, changes in these factors can shift the demand curve. For instance, an increase in consumer income might increase demand for [[Normal_Goods]], shifting the demand curve to the right. Additionally, the demand curve may not always be linear; it can be nonlinear, and its shape can vary depending on the commodity and market. Furthermore, the concept of a demand curve is based on the ceteris paribus assumption, which may not hold in complex real-world scenarios where multiple factors change simultaneously.

## 4. Demand Curve Analysis

$Q_d = 15 - 2P$

### Demand Curve Data Points

| Price (P) | Quantity Demanded (Q) |
|-----------|-----------------------|
| 4          | 7                     |
| 5          | 5                     |

### Demand Curve Slope Calculation

Given two points on the demand curve: $(Q_1, P_1) = (7, 4)$ and $(Q_2, P_2) = (5, 5)$, 
the slope $b$ can be calculated as $b = rac{7 - 5}{4 - 5} = -2$.

### Demand Function Derivation

Using the slope $b = -2$ and one of the points, for example, $(Q_1, P_1) = (7, 4)$,
we can derive the demand function:
$7 = a - 2 \cdot 4$

Solving for $a$:
$a = 7 + 8 = 15$

Therefore, the demand function is:
$Q_d = 15 - 2P$

## 5. Walkthrough

**Step 1:** Plot the coordinate pairs $(P, Q)$ on a two-dimensional graph to establish the downward-sloping trajectory of the curve.

**Step 2:** Recall the formula for the slope of the demand curve: $b = rac{\Delta Q}{\Delta P}$.

**Step 3:** Calculate the slope using the given data points: $b = rac{7 - 5}{4 - 5} = -2$.

**Step 4:** Use the slope and one of the data points to derive the demand function: $Q_d = a + bP$.

**Step 5:** Solve for $a$ using the point $(7, 4)$: $7 = a - 2 \cdot 4$, which yields $a = 15$.

**Step 6:** Write the final demand function: $Q_d = 15 - 2P$.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "The slope of the demand curve is calculated as [[blank]].",
    "answer": "b = \\frac{\\Delta Q}{\\Delta P}",
    "explanation": "The slope of the demand curve represents the change in quantity demanded in response to a change in price.",
    "textWithBlanks": "The slope of the demand curve is calculated as [[blank]]."
  },
  {
    "type": "mcq",
    "question": "Given two points on the demand curve, $(Q_1, P_1) = (7, 4)$ and $(Q_2, P_2) = (5, 5)$, what is the slope of the demand curve?",
    "options": {
      "a": "-1",
      "b": "-2",
      "c": "-3",
      "d": "-4"
    },
    "answer": "b",
    "explanation": "Using the formula for slope $b = \\frac{\\Delta Q}{\\Delta P}$, we find $b = \\frac{7 - 5}{4 - 5} = \\frac{2}{-1} = -2$."
  },
  {
    "type": "trace",
    "question": "Derive the demand function given that the slope of the demand curve is -2 and it passes through the point (7, 4).",
    "steps": [
      "The general form of the demand function is $Q_d = a + bP$.",
      "Given that $b = -2$, the demand function becomes $Q_d = a - 2P$.",
      "Substituting the point $(7, 4)$ into the demand function gives $7 = a - 2 \\cdot 4$.",
      "Solving for $a$, we get $7 = a - 8$, which yields $a = 15$.",
      "Therefore, the demand function is $Q_d = 15 - 2P$."
    ],
    "answer": "Q_d = 15 - 2P",
    "explanation": "By following these steps, we derive the demand function that relates the quantity demanded to the price of the commodity."
  }
]

```