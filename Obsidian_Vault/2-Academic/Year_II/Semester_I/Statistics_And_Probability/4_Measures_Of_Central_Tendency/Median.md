---
title: Median
created_at: '2025-12-04T10:03:59Z'
last_modified: '2025-12-04T10:03:59Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 403d49c7-7d4d-40a1-b91f-44783da8edda
type: Foundational
course: Statistics_And_Probability
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides_and_Course_Outline
aliases: 
- Middle_Value
- 50th_Percentile
unit: 4_Measures_Of_Central_Tendency
---

# Definition
Before proceeding, ensure you master Data_Ordering and Measures_Of_Position.
The [[Median]] is the middle value in a dataset that has been arranged in ascending or descending order. It effectively divides the data into two equal halves, with 50% of the observations falling below it and 50% falling above it. Unlike the [[Arithmetic_Mean]], the median is a positional average and is not affected by extreme values (outliers), making it a robust measure of central tendency, especially for skewed distributions. Think of it as the literal middle ground, untouched by the highest or lowest extremes.

# The Mental Model
Imagine a line of students ordered by height, from shortest to tallest. The [[Median]] height is simply the height of the student standing exactly in the middle of that line. It doesn't matter if there's one extremely tall student or one extremely short student; the middle person's height remains the middle height. This illustrates how the median is unaffected by outliers, providing a true "central" point based on position.

# Context & Framework
### How the Parts Talk to Each Other
The calculation of the [[Median]] is intrinsically linked to data ordering. The first step involves arranging all data points. This initial organization is critical because the median's definition relies solely on the position of values. Unlike the [[Arithmetic_Mean]], where every value directly contributes to a sum, the median's connection to individual data points is through their rank or order. This highlights the median's nature as a positional average, distinct from sum-based averages.

# The Mastery Deep Dive
### Anatomy of the Formula (Who is Who?)
The calculation of the [[Median]] differs based on whether the number of observations ($n$) is odd or even.

**For Ungrouped Data:**
1.  **Arrange the data** in ascending or descending order.
2.  **Identify the position:**
    *   **If $n$ is odd:** The median is the value at the $\left(\frac{n+1}{2}\right)^{\text{th}}$ position.
        $$ \boxed{\displaystyle \text{Median Position} = \frac{n+1}{2}} $$
    *   **If $n$ is even:** The median is the average of the values at the $\left(\frac{n}{2}\right)^{\text{th}}$ and $\left(\frac{n}{2} + 1\right)^{\text{th}}$ positions.
        $$ \boxed{\displaystyle \text{Median} = \frac{\left(\frac{n}{2}\right)^{\text{th}} \text{value} + \left(\frac{n}{2} + 1\right)^{\text{th}} \text{value}}{2}} $$

**For Grouped Frequency Distribution (GFD):**
1.  **Calculate the cumulative frequencies.**
2.  **Find the median position:** $\text{Median Position} = \frac{N}{2}$, where $N$ is the total frequency.
3.  **Identify the median class:** This is the class interval where the median position falls (i.e., the first class whose cumulative frequency is greater than or equal to the median position).
4.  **Apply the interpolation formula:**
    $$ \boxed{\displaystyle \text{Median} = L + \left(\frac{\frac{N}{2} - cf}{f}\right) \times h} $$
    Where:
    *   $L$: Lower class boundary of the median class.
    *   $N$: Total frequency.
    *   $cf$: Cumulative frequency of the class *preceding* the median class.
    *   $f$: Frequency of the median class.
    *   $h$: Class interval (width) of the median class.

This multi-faceted approach ensures accurate median calculation across various data structures.

### The "Duh!" Moment (Intuitive Proof)
The concept of the [[Median]] is intuitively appealing because it directly addresses the idea of "middle." If you arrange anything in order, the item in the exact center is unequivocally the middle one. This "middle-ness" is robust because it doesn't care about the actual *values* of the items at the extremes, only their position relative to the center. So, if you're looking for a representative "middle" that isn't swayed by unusually large or small values, the median naturally serves this purpose.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A common mistake when calculating the [[Median]] for ungrouped data is *failing to arrange the data in order first*. If the data is not sorted, identifying the middle value will be incorrect, leading to a false median. For grouped data, errors often arise from misidentifying the median class (e.g., using the class *containing* the median position instead of the first class whose cumulative frequency *exceeds* or equals it), or incorrectly using the cumulative frequency *of* the median class instead of the cumulative frequency *of the preceding class* ($cf$) in the interpolation formula. These steps are crucial for accuracy.

# Significance & Application
The [[Median]] is a highly significant measure of central tendency, particularly robust against outliers, making it invaluable in fields where data distributions are often skewed. It is widely used in:
*   **Economics and Finance:** For analyzing income, wealth, or house prices, where extreme values can distort the [[Arithmetic_Mean]].
*   **Sociology and Demographics:** For median age or household size.
*   **Healthcare:** For typical patient recovery times, which might be affected by a few prolonged cases.
*   **Environmental Science:** For average pollution levels that might have occasional spikes.
Its ability to provide a representative "middle" without being swayed by extremes offers a more accurate picture of typical values in many real-world datasets.

# The Worked Example
*Test your mastery. Cover the solutions below to test yourself first.*

**Example 1: Ungrouped Data (Odd number of items)**
Data set: 2, 3, 11, 13, 26, 34, 47 (already sorted). Number of observations $n=7$.
**Step 1: Arrange data (already done).**
**Step 2: Find median position.**
Median Position = $\frac{n+1}{2} = \frac{7+1}{2} = \frac{8}{2} = 4^{\text{th}}$ position.
**Step 3: Identify the value at the median position.**
The 4th value in the sorted list is 13.
Therefore, the [[Median]] = 13.

**Example 2: Ungrouped Data (Even number of items)**
Data set: 5, 8, 10, 12, 15, 18. Number of observations $n=6$.
**Step 1: Arrange data (already sorted).**
**Step 2: Find median positions.**
$\frac{n}{2} = \frac{6}{2} = 3^{\text{rd}}$ position.
$\left(\frac{n}{2} + 1\right)^{\text{th}} = \left(3 + 1\right)^{\text{th}} = 4^{\text{th}}$ position.
**Step 3: Identify values at median positions and average them.**
Value at 3rd position = 10.
Value at 4th position = 12.
[[Median]] = $\frac{10 + 12}{2} = \frac{22}{2} = 11$.

**Example 3: Grouped Frequency Distribution**
The following GFD refers to the weight (to the nearest Kg) of a sample of students. Find the median weight.

| Weight (in Kg) | Number of students (f) | Cum. Frequency (Less than type) (cf) |
| :
------------- | :
--------------------- | :
----------------------------------- |
| 35 - 43        | 8                      | 8                                    |
| 44 - 52        | 11                     | 19                                   |
| 53 - 61        | 16                     | 35                                   |
| 62 - 70        | 19                     | 54 $\leftarrow$ Median Class         |
| 71 - 79        | 14                     | 68                                   |
| 80 - 88        | 9                      | 77                                   |

**Step 1: Calculate cumulative frequencies (already done).** Total frequency $N = 77$.
**Step 2: Find the median position.**
Median Position = $\frac{N}{2} = \frac{77}{2} = 38.5^{\text{th}}$ position.
**Step 3: Identify the median class.**
The 38.5th position falls in the class 62 - 70, as its cumulative frequency (54) is the first to exceed 38.5.
**Step 4: Identify values for the interpolation formula.**
*   $L$ (Lower class boundary of median class) = 61.5 (Since the preceding class ends at 61, and current starts at 62, the boundary is 61.5).
*   $N$ (Total frequency) = 77.
*   $cf$ (Cumulative frequency of preceding class) = 35.
*   $f$ (Frequency of median class) = 19.
*   $h$ (Class interval) = 70 - 62 + 1 = 9 (or $61.5 - 52.5 = 9$).

**Step 5: Apply the interpolation formula.**
$$ \begin{aligned}
\displaystyle \text{Median} &= L + \left(\frac{\frac{N}{2} - cf}{f}\right) \times h \\
&= 61.5 + \left(\frac{38.5 - 35}{19}\right) \times 9 \\
&= 61.5 + \left(\frac{3.5}{19}\right) \times 9 \\
&= 61.5 + 0.1842 \times 9 \\
&= 61.5 + 1.6578 \\
&\approx 63.16 \text{ Kg}
\end{aligned} $$
The median weight is approximately 63.16 Kg. Interpretation: About 50% of the students weigh less than or equal to 63.16 Kg, and about 50% weigh more than or equal to 63.16 Kg.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** For the dataset 1, 3, 7, 10, 12, 15, 18, 20. Calculate the [[Median]].
> **Solution:** The data is already sorted, and $n=8$ (even).
> Values at $\frac{8}{2} = 4^{\text{th}}$ position (10) and $\frac{8}{2}+1 = 5^{\text{th}}$ position (12).
> Median = $\frac{10+12}{2} = \frac{22}{2} = 11$.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a grouped frequency distribution for monthly household electricity consumption (in kWh):

| Consumption (kWh) | Number of Households |
| :
---------------- | :
------------------- |
| 50 - 99           | 15                   |
| 100 - 149         | 25                   |
| 150 - 199         | 30                   |
| 200 - 249         | 20                   |
| 250 - 299         | 10                   |

1.  Calculate the [[Median]] monthly electricity consumption for these households.
2.  If the number of households in the "250 - 299" class suddenly doubled, explain how this change would (or would not) affect the median class and the calculated median value, without performing a full recalculation.
> **Solution:**
> 1.  **Calculate Cumulative Frequencies:**
>     | Consumption (kWh) | f  | cf |
>     | :
---------------- | :
--- | :
--- |
>     | 50 - 99           | 15 | 15 |
>     | 100 - 149         | 25 | 40 |
>     | 150 - 199         | 30 | 70 $\leftarrow$ Median Class |
>     | 200 - 249         | 20 | 90 |
>     | 250 - 299         | 10 | 100 |
>     Total Frequency $N = 100$.
>     Median Position = $\frac{N}{2} = \frac{100}{2} = 50^{\text{th}}$ position.
>     The 50th position falls in the class 150 - 199.
>     **Identify values for interpolation formula:**
>     $L = 149.5$ (lower class boundary)
>     $N = 100$
>     $cf = 40$ (cumulative frequency of preceding class)
>     $f = 30$ (frequency of median class)
>     $h = 199 - 150 + 1 = 50$ (class interval; or $149.5 - 99.5 = 50$)
>     **Apply interpolation formula:**
>     Median = $149.5 + \left(\frac{50 - 40}{30}\right) \times 50$
>     Median = $149.5 + \left(\frac{10}{30}\right) \times 50$
>     Median = $149.5 + \frac{1}{3} \times 50$
>     Median = $149.5 + 16.67 \approx 166.17$ kWh.
> 2.  If the number of households in the "250 - 299" class doubled (from 10 to 20), the **total frequency ($N$) would increase from 100 to 110**.
>     The new Median Position would be $\frac{110}{2} = 55^{\text{th}}$ position.
>     Looking at the original cumulative frequencies:
>     50 - 99: cf = 15
>     100 - 149: cf = 40
>     150 - 199: cf = 70
>     The 55th position would *still fall within the 150 - 199 class*. Therefore, the **median class would not change**.
>     However, the values for $N$ (now 110) and potentially $cf$ and $f$ (if the doubling affected a class below the original median class) used in the interpolation formula would change. Specifically, $L$, $h$, and $f$ (of the median class) would remain the same, but $N$ would be 110, and $N/2$ would be 55. The `cf` for the preceding class would still be 40. This would lead to a *different calculated median value*, even though the median class itself remains the same, demonstrating that the median's sensitivity to the overall distribution (through $N$) and not just its class boundaries.

# Key Takeaways
*   The [[Median]] is the middle value in an ordered dataset, robust against extreme values.
*   For ungrouped data, its calculation depends on whether the number of observations is odd or even.
*   For grouped frequency distributions, an interpolation formula is used, requiring careful identification of the median class and its properties.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| Data_Ordering           | The foundational step for calculating the median is ordering the data.                     |
| Measures_Of_Position    | The median is a specific type of positional measure, dividing data into two halves.         |
| [[Arithmetic_Mean]]         | Often contrasted with the arithmetic mean due to its insensitivity to outliers.           |
| Data_Skewness           | It is a preferred measure for central tendency in skewed distributions.                     |
| Grouped_Frequency_Distribution | A specific formula and method exist for calculating the median for grouped data.          |
---