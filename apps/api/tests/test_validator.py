from src.domains.ater.validator import AterValidator

def test_validator_perfect_note():
    """String A: Perfect 3-Section Sandwich format. (Should Pass)"""
    perfect_content = """---
title: Test_Concept
type: Atomic Note
course: Computer_Science
semester: Spring_2026
unit: "1"
---

# 1. The Intuitive Analogy

The [[CPU]] is like a conductor in an orchestra, directing the [[Data_Stream]] to various instruments while maintaining the [[Clock_Sync]].

# 2. The Core Execution

The [[Processor_Core]] executes instructions by cycling through the [[Fetch_Decode_Execute]] loop. It coordinates with the [[Control_Unit]] to maintain state.

# 3. The Proving Grounds

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

# 1. The Intuitive Analogy

Error generating content.

# 2. The Core Execution

Prose here. [[Concept_1]], [[Concept_2]], [[Concept_3]].

# 3. The Proving Grounds

```interactive-quiz
[
  {
    "type": "recall",
    "question": "q",
    "answer": "a",
    "explanation": "e",
    "explanation_page": 1
  }
]
```
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

# 1. The Intuitive Analogy

The [[CPU]] manages operations like standard addition and subtraction of [[State_Variables]].

# 2. The Core Execution

We represent equations inline as $ -x + y = z $ or inside math blocks:

$$
- x_1 + x_2 = 0
- y_1 + y_2 = 0
$$

The above equation describes the basic system state.

# 3. The Proving Grounds

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
    "type": "recall",
    "difficulty": "L1",
    "question": "What are operations managed by the CPU?",
    "answer": "Addition and subtraction",
    "explanation": "The text states the CPU manages addition and subtraction."
  }
]
```
"""
    is_valid, errors = AterValidator.validate_structure(math_content, course="Computer_Science")
    assert is_valid, f"Expected note with math blocks to pass, but got errors: {errors}"

def test_check_section_duplication_dynamic_scaling():
    """Test that check_section_duplication tolerates high similarity in short definitions but flags actual copy-pastes."""
    # Scenario A: Short conceptual definition with some vocabulary overlap (Similarity ~ 0.88, under 150 chars). Should NOT be flagged.
    s1 = "Programming paradigms are fundamental styles of computer programming. They define how programmers construct and execute code, including object-oriented and functional approaches."
    s2 = "A programming paradigm represents the model of program execution. Object-oriented and functional styles are common paradigms defining how programmers construct code."
    
    note_a = f"""---
title: Paradigms
---
## Mental Model
{s1}

## Walkthrough
{s2}
"""
    assert not AterValidator.check_section_duplication(note_a)

    # Scenario B: High similarity (identical text blocks) over 150 chars. Should BE flagged.
    s3 = "Object-oriented programming is a programming paradigm based on the concept of objects, which can contain data and code. Objects are instances of classes, which define their structure and behavior."
    note_b = f"""---
title: Duplicate
---
## Mental Model
{s3}

## Walkthrough
{s3}
"""
    assert AterValidator.check_section_duplication(note_b)

    # Scenario C: Long sections with high overall similarity ratio (> 0.82) over 300 chars. Should BE flagged.
    s4_base = "This is a very long section designed to exceed three hundred characters. It introduces various programming patterns and explains them in detail. It will be duplicated in the next section to trigger the similarity ratio check."
    s4_var = "This is a very long section designed to exceed three hundred characters. It introduces various programming patterns and explains them in detail. It will be duplicated in the next section to trigger the similarity ratio check with minor variations."
    note_c = f"""---
title: RatioCheck
---
## Mental Model
{s4_base}

## Walkthrough
{s4_var}
"""
    assert AterValidator.check_section_duplication(note_c)


def test_validator_markdown_artifacts_truncation():
    """Test that markdown artifacts (---, ***, ___) are stripped but valid trailing markdown (e.g. **bold**) is preserved."""
    # A valid note ending in a horizontal rule.
    note_with_hr = """---
title: HR Note
type: Atomic Note
course: General
---

# 1. Mental Model
This is a complete sentence ending with a horizontal rule.
---

# 2. Section Two
This is section two. [[Concept_1]]

# 3. Proving Grounds
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
    "question": "Apply it.",
    "answer": "Like this.",
    "explanation": "Because."
  }
]
```
"""
    is_valid, errors = AterValidator.validate_structure(note_with_hr, course="General")
    # If the horizontal rule was incorrectly handled, we might get a SECTION_TRUNCATION error.
    assert is_valid, f"Expected note with horizontal rule to pass, got: {errors}"

    # A valid note ending with **bold** text which lacks terminal punctuation like a period.
    note_with_bold = """---
title: Bold Note
type: Atomic Note
course: General
---

# 1. Mental Model
This section ends with **bold text**

# 2. Section Two
This is section two. [[Concept_2]]

# 3. Proving Grounds
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
    "question": "Apply it.",
    "answer": "Like this.",
    "explanation": "Because."
  }
]
```
"""
    # Previously, \-\*_+$ would strip ** and cause "bold text" to be evaluated as a truncated string
    # (since the terminal check might fail, although "t" is at the end, but wait, if it ends with "text",
    # 't' is not a valid terminal, and it matches [A-Za-z], so it would be flagged as truncated).
    # Wait, the valid_terminal check includes `*`, but if `**` was stripped, it ends in `t` and is flagged!
    # Let's verify that bold text is correctly processed now.
    is_valid, errors = AterValidator.validate_structure(note_with_bold, course="General")
    # "bold text**" ends with "*", which is in valid_terminal!
    # With the fix, `**` is NOT stripped, so last char is `*`, which is valid.
    # Without the fix, `**` WAS stripped, last char was `t`, so it WAS flagged as truncated.
    assert is_valid, f"Expected note ending in **bold** to pass, got: {errors}"
