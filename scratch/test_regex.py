import re
import json

quiz_str = r"""
{
  "q": "What is \frac{1}{2} \rightarrow \n \t \begin{equation} x \end{equation}?"
}
"""
print("Original:")
print(quiz_str)

# We want to escape \frac, \rightarrow, \begin, \end, but NOT \n, \t
# If we do r'\\(?=[a-zA-Z])', we escape \n and \t too!
# Let's match \ followed by any letter EXCEPT n, t, r, f, b ?
# No, \frac starts with f! \rightarrow starts with r!
# How can we distinguish \frac from \f (form feed)?
# \frac is followed by 'rac'. \rightarrow is followed by 'ightarrow'.
# \f is usually just \f. Wait, JSON doesn't use \f anyway. The LLM never generates \f.
# What if we just match \ followed by 2 or more letters? LaTeX macros are usually >1 letter!
# e.g. \frac, \rightarrow, \begin.
# EXCEPT \a, \b, \c... wait, \n is 1 letter. \t is 1 letter.
# So if we match \ followed by TWO OR MORE letters:
# r'\\(?=[a-zA-Z]{2,})'
# This matches \frac, \rightarrow, \begin, \ldots
# But it does NOT match \n, \t, \r!
# Wait! Does \n followed by a letter match?
# "word\nnext" -> \n is followed by 'n', 'e', 'x', 't'. So it IS followed by 2 or more letters!
# Ah! \n is just a backslash and an 'n'. The next character is 'e'. So it's \ followed by 'n', 'e', 'x', 't'.

# Let's test r'\\(?=[a-zA-Z]{2,})'
quiz_str2 = re.sub(r'\\(?=[a-zA-Z]{2,})', r'\\\\', quiz_str)
print("Replaced:")
print(quiz_str2)

try:
    print("Parsed:")
    print(json.loads(quiz_str2))
except Exception as e:
    print("Error:", e)
