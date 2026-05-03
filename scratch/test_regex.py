
import re

content = """---
Course: "[[Database Systems]]"
Unit: "[[7]]"
Status: "[[Not Started]]"
Confidence: ''
Study Date: ''
---

# 7 Relational Algebra and Calculus Hub

## Overview
Hub note for Database Systems - 7 Relational Algebra and Calculus Hub

## Unit Objectives
- [ ] Master all core technical definitions.
- [ ] Internalize the mental models for each concept.
- [ ] Trace and understand every worked example.
- [ ] Complete all Socratic Probes and verify with the Answer Key.

## Connections
- [ ] [[Relational_Algebra]]
    - [ ] [[Unary_Relational_Operations]]
        - [ ] [[Select_Operation]]
        - [ ] [[Project_Operation]]
        - [ ] [[Rename_Operation]]
    - [ ] [[Relational_Algebra_Operations_From_Set_Theory]]
    - [ ] [[Union_Operation]]
    - [ ] [[Intersection_Operation]]
    - [ ] [[Difference_Operation]]
    - [ ] [[Cartesian_Product_Operation]]
    - [ ] [[Binary_Relational_Operations]]
        - [ ] [[Join_Operation]]
        - [ ] [[Theta_Join]]
        - [ ] [[Equijoin_Operation]]
        - [ ] [[Natural_Join_Operation]]
        - [ ] [[Division_Operation]]
    - [ ] [[Additional_Relational_Operations]]
- [ ] [[Relational_Calculus]]
    - [ ] [[Tuple_Relational_Calculus]]
    - [ ] [[Domain_Relational_Calculus]]
- [ ] [[Aggregate_Functions]]
    - [ ] [[Grouping_With_Aggregation]]
- [ ] [[Outer_Join_Operation]]
- [ ] [[Outer_Union_Operation]]
- [ ] [[Complete_Set_Of_Relational_Operations]]
- [ ] [[Query_Tree]]
"""

def extract_section(content):
    if not content: return None
    # Strip YAML
    clean_content = re.sub(r'^\s*---[\s\S]*?---', '', content).strip()
    if not clean_content: return None

    # Strategy 1: Specific Headers
    section_regex = r'#+\s*(?:Connections|Core Topologies|Structure|Nav|Outline|Course Map|Curriculum|Roadmap|Units|Topics|Concepts|Plan|Map|Index|Table of Contents|TOC)[^\n]*\n+([\s\S]*?)(?=\r?\n#+|$)'
    match = re.search(section_regex, clean_content, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    return None

print(f"Extracted: '{extract_section(content)}'")
