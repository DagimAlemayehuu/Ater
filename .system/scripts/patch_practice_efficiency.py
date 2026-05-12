import sys

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in patches:
        if old not in content:
            print(f"Error: Could not find snippet in {path}\nSnippet:\n{old[:100]}")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

service_patches = [
(
r'''            for i in range(count):
                agent = QuestionAgent(self.planner_llm, q_type)
                import random
                seed = random.random()
                
                # To prevent redundancy, physically shuffle the context for each agent
                shuffled_parts = list(context_parts)
                random.shuffle(shuffled_parts)
                tight_context = "\n\n".join(shuffled_parts)
                
                hint = hints[i % len(hints)]
                
                # Assign professional domain dynamically
                prof_domain = get_professional_domain(hub['title'] + str(q_type) + str(i), mode=hub_mode)
                
                # Bloom's Adaptive Schedule for Practice mode
                diff_schedule = ["L1", "L2", "L3"]
                current_diff = config.difficulty if config.difficulty != "Mixed" else diff_schedule[i % 3]

                tasks.append(lambda a=agent, h=hub, c=tight_context, d=current_diff, m=hub_mode, p=prof_domain, idx=i+1, hint=hint, qt=q_type: a.generate(
                    h['title'], 
                    f"SEED: {seed}\n" + c, 
                    d,
                    mode=m,
                    prof_domain=p,
                    index=idx,
                    num_questions=1,
                    topic_hint=hint,
                    q_type=qt
                ))''',
r'''            if count > 0:
                agent = QuestionAgent(self.planner_llm, q_type)
                import random
                seed = random.random()
                
                shuffled_parts = list(context_parts)
                random.shuffle(shuffled_parts)
                tight_context = "\n\n".join(shuffled_parts)
                
                hint = "Generate a diverse set of distinct questions covering different subtopics."
                prof_domain = get_professional_domain(hub['title'] + str(q_type), mode=hub_mode)
                current_diff = config.difficulty if config.difficulty != "Mixed" else "Mixed"

                tasks.append(lambda a=agent, h=hub, c=tight_context, d=current_diff, m=hub_mode, p=prof_domain, c_out=count, hint=hint, qt=q_type: a.generate(
                    h['title'], 
                    f"SEED: {seed}\n" + c, 
                    d,
                    mode=m,
                    prof_domain=p,
                    index=1,
                    num_questions=c_out,
                    topic_hint=hint,
                    q_type=qt
                ))'''
)
]
patch_file("apps/api/src/domains/ater/service.py", service_patches)
