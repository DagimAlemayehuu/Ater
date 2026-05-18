import pytest
from src.domains.ater.validator import AterValidator

def test_validator_perfect_note():
    """String A: Perfect v33.0 format. (Should Pass)"""
    perfect_content = """---
title: Test_Concept
type: Atomic Note
course: Computer_Science
semester: Spring_2026
unit: "1"
---

## Mental Model

The [[CPU]] is like a conductor in an orchestra, directing the [[Data_Stream]] to various instruments while maintaining the [[Clock_Sync]].

## Processor Core (domain.h1)

The [[Processor_Core]] executes instructions by cycling through the [[Fetch_Decode_Execute]] loop. It coordinates with the [[Control_Unit]] to maintain state.

## Formal Definition (domain.h2)

A computational unit capable of executing logic gates at high frequency.

> **Execution Pipeline (artifact)**

```cpp
void execute() {
    // Instruction cycle
}
```

This code represents the instruction cycle logic.

---

## The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "recall",
    "difficulty": "L1",
    "question": "What is the CPU compared to in the mental model?",
    "answer": "A conductor",
    "explanation": "The analogy maps the CPU to an orchestra conductor."
  },
  {
    "id": "q2",
    "type": "apply",
    "difficulty": "L2",
    "question": "Apply the fetch-decode-execute loop to a jump instruction.",
    "answer": "The program counter updates.",
    "explanation": "Jump instructions modify the PC during the execute phase."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Fix this infinite loop.",
    "content": "while(true) { ; }",
    "answer": "Add a break condition.",
    "explanation": "Infinite loops need escape conditions."
  }
]
```
"""
    is_valid, errors = AterValidator.validate_structure(perfect_content, course="Computer_Science")
    assert is_valid, f"Expected perfect note to pass, but got errors: {errors}"

def test_validator_hard_failure_marker():
    """String B: Contains the phrase 'Error generating content'. (Should Fail)"""
    failed_content = """---
title: Error_Note
type: Atomic Note
course: CS
---

## Mental Model
Error generating content.
"""
    is_valid, errors = AterValidator.validate_structure(failed_content)
    assert not is_valid
    assert any("HARD_FAILURE_MARKER" in e for e in errors)


def test_validator_latex_math_blocks():
    """Test that notes containing math blocks with leading minus/bullet characters do not trigger BULLET_POINTS_DETECTED."""
    math_content = """---
title: Math_Concept
type: Atomic Note
course: Computer_Science
semester: Spring_2026
unit: "1"
---

## Mental Model

The [[CPU]] manages operations like standard addition and subtraction of [[State_Variables]].

## Math Core (domain.h1)

We represent equations inline as $ -x + y = z $ or inside math blocks:

$$
- x_1 + x_2 = 0
- y_1 + y_2 = 0
$$

The above equation describes the basic system state.

## Formal Definition (domain.h2)

A mathematical definition containing [[Control_Unit]] and [[Clock_Sync]] concepts.

> **Execution Pipeline (artifact)**

```cpp
void execute() {}
```

This code represents the logic.

---

## The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "recall",
    "difficulty": "L1",
    "question": "What is the CPU compared to in the mental model?",
    "answer": "A conductor",
    "explanation": "The analogy maps the CPU to an orchestra conductor."
  }
]
```
"""
    is_valid, errors = AterValidator.validate_structure(math_content, course="Computer_Science")
    assert is_valid, f"Expected note with math blocks to pass, but got errors: {errors}"
