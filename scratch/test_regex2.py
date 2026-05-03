import re
quiz_str = r'{"q": "word\nnext"}'
quiz_str2 = re.sub(r'\\(?=[a-zA-Z]{2,})', r'\\\\', quiz_str)
print(quiz_str2)
