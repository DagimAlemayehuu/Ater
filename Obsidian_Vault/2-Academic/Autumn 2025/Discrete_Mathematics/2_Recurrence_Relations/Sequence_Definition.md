---
title: Sequence_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 4
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a never-ending staircase where each step has a number on it. A sequence definition is like a rule that tells you how to find the number on any given step, starting from a certain step number, usually step 1. Just as you can find the number on any step using the rule, a sequence definition allows you to determine any term in the sequence.

# 2. Derivation & Logical Trace
A sequence definition mechanically works by specifying a [[Domain]] of integers $n \geq n_0$, typically $n_0 = 1$, and a [[Codomain]] of values that the sequence can take. The sequence is a function that maps each integer $n$ in its domain to a unique value, often denoted as $a_n$. This mapping is achieved through a [[Recursive Formula]] or an [[Explicit Formula]], which defines how to compute $a_n$ for any given $n$. For instance, the sequence of natural numbers can be defined explicitly as $a_n = n$, where $n \geq 1$. The evaluation of a sequence at a particular $n$ involves substituting $n$ into the formula to obtain $a_n$.

# 3. Theorem Constraints & Incompleteness
The definition of a sequence imposes certain constraints, particularly regarding its [[Convergence]] and [[Boundedness]]. A sequence may or may not converge to a limit, and it may or may not be bounded. For example, the sequence defined by $a_n = 1/n$ for $n \geq 1$ converges to 0 but is bounded above by 1. On the other hand, the sequence $a_n = n$ does not converge and is not bounded. The [[Axiom Of Infinity]] is implicitly invoked when dealing with infinite sequences, ensuring that there are enough distinct elements in the domain to support the sequence's definition. Sequence definitions must also adhere to the [[Peano Axioms]] when dealing with sequences of natural numbers, ensuring that the sequence respects the fundamental properties of natural numbers.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\begin{document}

\section{Sequence Definition Proof}

Given a sequence defined by $a_n = f(n)$, where $f(n)$ is an explicit formula.

\subsection*{Theorem:} 
For all $n \geq 1$, $a_n$ is uniquely determined by $f(n)$.

\subsection*{Proof:}

\subsubsection*{Base Case:}
For $n = 1$, $a_1 = f(1)$. This establishes the base case.

\subsubsection*{Inductive Step:}
Assume for some $k \geq 1$, $a_k = f(k)$. We must show that $a_{k+1} = f(k+1)$.

By definition of the sequence, $a_{k+1} = f(k+1)$. Thus, if $a_k = f(k)$, then $a_{k+1} = f(k+1)$.

\subsubsection*{Conclusion:}
By mathematical induction, for all $n \geq 1$, $a_n = f(n)$.

\end{document}
```
To read this LaTeX code: This is a formal proof that a sequence defined by an explicit formula $f(n)$ uniquely determines each term $a_n$ for $n \geq 1$. The proof uses mathematical induction, starting with a base case and an inductive step.

## 5. Walkthrough
Consider a sequence defined by the explicit formula $a_n = 2n + 1$ for $n \geq 1$.

1. **Identify the Formula**: The given sequence is defined by $a_n = 2n + 1$.
2. **Calculate Initial Terms**: For $n = 1$, $a_1 = 2(1) + 1 = 3$. For $n = 2$, $a_2 = 2(2) + 1 = 5$.
3. **Verify the Sequence**: To verify that the sequence starts with 3, 5, ..., we substitute $n = 1, 2, ...$ into the formula.
4. **Find a Specific Term**: Find $a_{10}$. Substituting $n = 10$ into the formula yields $a_{10} = 2(10) + 1 = 21$.
5. **Generalize**: For any $n$, the $n$-th term is given by $a_n = 2n + 1$. This confirms that the sequence definition mechanically generates each term.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary purpose of a sequence definition?",
    "options": {
      "A": "To list all terms of a sequence",
      "B": "To provide a rule for finding any term in a sequence",
      "C": "To graph the sequence",
      "D": "To find the sum of the sequence"
    },
    "answer": "B",
    "explanation": "A sequence definition provides a rule or formula to find any term in the sequence."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "A sequence is defined by $a_n = [[Blank1]] + 1$ for $n \\geq 1$. If $a_1 = 3$, then the value of [[Blank2]] is",
    "textWithBlanks": "A sequence is defined by $a_n = [[Blank1]] + 1$ for $n \\geq 1$. If $a_1 = 3$, then the value of [[Blank2]] is",
    "answer": [
      "2",
      "2"
    ],
    "explanation": "Given $a_1 = 3$ and $a_n = 2n + 1$, for $n=1$, $a_1 = 2(1) + 1 = 3$. So, [[Blank1]] should be $2n$ and [[Blank2]] should be $2$."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code that is supposed to calculate the nth term of the sequence $a_n = 2n + 1$.",
    "content": "def calculate_nth_term(n):\n  return 2 * (n - 1) + 1",
    "answer": "The bug is in the line 'return 2 * (n - 1) + 1'. It should be 'return 2 * n + 1'.",
    "explanation": "The code incorrectly subtracts 1 from $n$ before multiplying by 2 and adding 1, which changes the sequence definition."
  }
]
```