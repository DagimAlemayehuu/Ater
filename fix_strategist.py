with open('apps/api/src/domains/ai/strategist.py', 'r') as f:
    code = f.read()

code = code.replace(
'''        properties = {}
        if title:
            properties["Name"] = {"title": [{"text": {"content": title}}]}
        if goal_type:
            properties["Type of Goal"] = {"select": {"name": goal_type}}
        if completed is not None:
            properties["Completed"] = {"checkbox": completed}
        if priority:
            properties["Priority"] = {"select": {"name": priority}}
        if due_date:
            properties["Due Date"] = {"date": {"start": due_date}}''',
'''        properties: dict = {}
        if title:
            properties["Name"] = {"title": [{"text": {"content": title}}]}
        if goal_type:
            properties["Type of Goal"] = {"select": {"name": goal_type}}
        if completed is not None:
            properties["Completed"] = {"checkbox": completed}
        if priority:
            properties["Priority"] = {"select": {"name": priority}}
        if due_date:
            properties["Due Date"] = {"date": {"start": due_date}}'''
)
with open('apps/api/src/domains/ai/strategist.py', 'w') as f:
    f.write(code)
