import os
import re

directory = 'apps/desktop/src/routes'

classes_to_remove = [
    r'\banimate-in\b',
    r'\bfade-in\b',
    r'\bzoom-in\b',
    r'\bzoom-in-95\b',
    r'\bslide-in-from-bottom-4\b',
    r'\bslide-in-from-top-2\b',
    r'\bslide-in-from-left-2\b',
    r'\bslide-in-from-top-1\b',
    r'\bduration-200\b(?! ease-in-out)', # ignore toggle durations
    r'\bduration-300\b',
    r'\bduration-500\b',
    r'\bduration-700\b(?! ease-in-out)', # ignore progress bar durations
]

pattern = re.compile('|'.join(classes_to_remove))

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # We want to replace these classes and clean up extra spaces
            # Since classes can be anywhere in a string, we just remove the word
            new_content = pattern.sub('', content)
            
            # Clean up double spaces inside className strings
            # This is a bit brute force but works for generic strings
            new_content = re.sub(r' +', ' ', new_content)
            new_content = new_content.replace('className=" "', 'className=""')
            new_content = new_content.replace(' }', '}')
            new_content = new_content.replace('{ ', '{')
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
