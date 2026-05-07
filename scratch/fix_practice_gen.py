import re

FILE_PATH = "apps/api/src/domains/oka/service.py"

with open(FILE_PATH, "r") as f:
    content = f.read()

# 1. Update the System Prompt in generate_practice
OLD_RULES_PATTERN = r'"STRICT OPERATIONAL RULES:\\n".*?"EXECUTION: Generate the session now. Follow the distribution strictly."'
NEW_RULES = '''"STRICT OPERATIONAL RULES:\\n"
            "1. SOLE SOURCE ADHERENCE: Generate questions EXCLUSIVELY from the [GROUND TRUTH SOURCE MATERIAL]. If a concept is not in the text, it does not exist.\\n"
            "2. NO ANALOGY TESTING (CRITICAL): NEVER test the user on the 'Mental Model' or analogies. Test ONLY technical definitions, code syntax, and real-world application.\\n"
            "3. ALLOWED MODALITIES (Strict JSON structures):\\n"
            "   - 'mcq': `question` (String), `options` (A,B,C,D), `answer` (Key only), `explanation` (Mechanism of the answer).\\n"
            "   - 'true_false': `question` (String), `answer` (Boolean), `explanation` (Why it is true/false).\\n"
            "   - 'fill_in': `question` (String: The prompt or instruction), `textWithBlanks` (with [[blank]] markers), `answer` (List of strings).\\n"
            "   - 'writing': `question` (String: The prompt or question to answer), `answer` (Model answer).\\n"
            "   - 'matching': `question` (String), `pairs` (List of objects with `left` and `right` keys).\\n"
            "   - 'order': `question` (String), `steps` (List of strings in random order), `answer` (List of strings in CORRECT order).\\n"
            "   - 'debug': `question` (String: 'Find the bug.'), `content` (buggy code/logic snippet), `answer` (fix and explanation).\\n"
            "   - 'synthesis': `question` (String: Complex scenario), `answer` (Model response).\\n"
            "4. EVERY QUESTION MUST HAVE A 'question' FIELD: You must include a `question` key for every single modality.\\n"
            "5. EXPLANATIONS: Every `explanation` MUST explain the underlying mechanism. Do NOT just repeat the mental model. It must be technical.\\n"
            "6. DISTRIBUTION ADHERENCE: Generate EXACTLY the counts requested.\\n"
            "7. NO TOPIC BLEED: Stay 100% within the scope of the selected notes.\\n\\n"
            "EXECUTION: Generate the session now. Follow the distribution strictly."'''

content = re.sub(OLD_RULES_PATTERN, NEW_RULES, content, flags=re.DOTALL)


# 2. Update the Markdown Generation
OLD_MD_PATTERN = r'# Create Readable Markdown\n        md_content = f"# {quiz_title}\\n\\n"\n        for idx, q in enumerate\(questions, 1\):\n            md_content \+= f"### Q{idx} \[\{q\.get\(\'type\'\)\}\]: \{q\.get\(\'question\', \'\'\)\}\\n"\n            if q\.get\(\'type\'\) == \'mcq\' and q\.get\(\'options\'\):\n                options = q\.get\(\'options\'\)\n                if isinstance\(options, dict\):\n                    for k, v in options\.items\(\):\n                        md_content \+= f"- \*\*\{k\}\)\*\* \{v\}\\n"\n                elif isinstance\(options, list\):\n                    for i, v in enumerate\(options\):\n                        label = chr\(65 \+ i\) # A, B, C\.\.\.\n                        md_content \+= f"- \*\*\{label\}\)\*\* \{v\}\\n"\n            elif q\.get\(\'type\'\) == \'code\'\:\n                md_content \+= f"```\\n\{q\.get\(\'codeSnippet\', \'\'\)\}\\n```\\n"\n            md_content \+= "\\n\*\*\*\\n\\n"'

NEW_MD_GEN = '''# Create Readable Markdown
        md_content = f"# {quiz_title}\\n\\n"
        for idx, q in enumerate(questions, 1):
            # Resolve question text
            q_text = q.get('question', '')
            if not q_text and q.get('type') == 'writing':
                q_text = q.get('answer', 'Answer the following:')
            
            md_content += f"### Q{idx} [{q.get('type')}]: {q_text}\\n"
            
            if q.get('type') == 'mcq' and q.get('options'):
                options = q.get('options')
                if isinstance(options, dict):
                    for k, v in options.items():
                        md_content += f"- **{k})** {v}\\n"
                elif isinstance(options, list):
                    for i, v in enumerate(options):
                        label = chr(65 + i) # A, B, C...
                        md_content += f"- **{label})** {v}\\n"
            elif q.get('type') == 'fill_in':
                md_content += f"\\n{q.get('textWithBlanks', '')}\\n"
            elif q.get('type') == 'debug':
                md_content += f"\\n```\\n{q.get('content', '')}\\n```\\n"
            elif q.get('type') == 'order' and q.get('steps'):
                for i, step in enumerate(q.get('steps')):
                    md_content += f"- [ ] {step}\\n"
            elif q.get('type') == 'matching' and q.get('pairs'):
                lefts = [p.get('left') for p in q.get('pairs') if p.get('left')]
                rights = [p.get('right') for p in q.get('pairs') if p.get('right')]
                import random
                random.shuffle(rights)
                for left, right in zip(lefts, rights):
                    md_content += f"- {left}  <-->  {right}\\n"
            elif q.get('type') == 'code':
                md_content += f"\\n```\\n{q.get('codeSnippet', '')}\\n```\\n"
            md_content += "\\n***\\n\\n"'''

content = re.sub(OLD_MD_PATTERN, NEW_MD_GEN, content, flags=re.DOTALL)

with open(FILE_PATH, "w") as f:
    f.write(content)
print("Updated service.py for practice generation.")
