import re

FILE_PATH = "apps/api/src/domains/oka/service.py"

with open(FILE_PATH, "r") as f:
    content = f.read()

OLD_IMPORT = "from .agents import ArchitectAgent, TheoryAgent, PractitionerAgent, ExaminerAgent, CriticAgent, HubAgent, VerifierAgent, QuizAuditorAgent, DOMAIN_MATRIX"
NEW_IMPORT = "from .agents import ArchitectAgent, TheoryAgent, PractitionerAgent, QuestionAgent, CriticAgent, HubAgent, VerifierAgent, QuizAuditorAgent, DOMAIN_MATRIX"
content = content.replace(OLD_IMPORT, NEW_IMPORT)

OLD_EXAMINER_INIT = "                            examiner_agent = ExaminerAgent(self.llm_creative, domain)"
NEW_EXAMINER_INIT = "                            # examiner removed, dynamic QuestionAgents used"
content = content.replace(OLD_EXAMINER_INIT, NEW_EXAMINER_INIT)

OLD_EXAMINER_PASS = """                            # Pass 3: Examiner
                            await self.governor.acquire(expected_tokens=2500)
                            theory_summary = theory[:600] # simple summary
                            quiz_json_str = await examiner_agent.generate(note_schema.title, theory_summary, primary_language)

                            # Repair Quiz JSON if needed
                            quiz_json_str = quiz_json_str.strip()
                            quiz_json_str = re.sub(r"^```[a-z]*\\n?", "", quiz_json_str)
                            quiz_json_str = re.sub(r"\\n?```$", "", quiz_json_str).strip()"""

NEW_EXAMINER_PASS = """                            # Pass 3: Examiner (Dedicated Agents)
                            await self.governor.acquire(expected_tokens=2500)
                            theory_summary = theory[:600] # simple summary
                            
                            types = [domain.get('l1', 'mcq'), domain.get('l2', 'true_false'), domain.get('l3', 'debug')]
                            diffs = ["L1", "L2", "L3"]
                            tasks = []
                            for qt, diff in zip(types, diffs):
                                agent = QuestionAgent(self.llm_creative, qt)
                                tasks.append(agent.generate(note_schema.title, theory_summary, diff))
                            
                            questions = await asyncio.gather(*tasks)
                            for i, q in enumerate(questions):
                                q["id"] = f"q{i+1}"
                                
                            quiz_json_str = json.dumps(questions, indent=2)"""

content = content.replace(OLD_EXAMINER_PASS, NEW_EXAMINER_PASS)

# Also update Practice Generation
OLD_PRACTICE_GEN_LOOP = """        while sum(target_distribution.values()) > 0:
            # Cooldown to avoid hitting TPM limits (especially on Groq/Free tiers)
            if all_questions:
                OkaService._status[session_id] = f"Cooling down for Rate Limits (TPM)... ({len(all_questions)}/{total_q})"
                await asyncio.sleep(25)

            # Determine batch distribution
            current_batch_count = 0
            batch_dist = {}
            for q_type, count in target_distribution.items():
                take = min(count, BATCH_SIZE - current_batch_count)
                if take > 0:
                    batch_dist[q_type] = take
                    current_batch_count += take
                if current_batch_count >= BATCH_SIZE:
                    break
            
            if current_batch_count == 0:
                break
                
            batch_dist_str = ", ".join([f"{count} {t}" for t, count in batch_dist.items()])
            OkaService._status[session_id] = f"Generating Batch ({len(all_questions)}/{total_q} complete)..."
            
            batch_prompt = prompt.replace(f"- Total Questions: {total_q}", f"- Total Questions: {current_batch_count}")
            batch_prompt = batch_prompt.replace(f"- Question Types: {dist_str}", f"- Question Types: {batch_dist_str}")
            # Ensure we don't repeat the same exact questions if we had a seed (though randomize helps)
            batch_prompt += f"\\n\\nBATCH SEED: {random.random()}"

            try:
                # Attempt structured batch
                try:
                    from .schemas import PracticeBatch
                    structured_llm = self.planner_llm.with_structured_output(PracticeBatch)
                    batch_res = await structured_llm.ainvoke(batch_prompt)
                    batch_questions = [q.model_dump() for q in batch_res.questions]
                except Exception:
                    res = await self.planner_llm.ainvoke([HumanMessage(content=batch_prompt + "\\n\\nRETURN ONLY A JSON OBJECT with a 'questions' key containing the list of questions.")])
                    content_res = res.content.strip()
                    if "```json" in content_res:
                        match = re.search(r"```json\\s*(.*?)\\s*```", content_res, re.DOTALL)
                        content_res = match.group(1) if match else content_res
                    elif "```" in content_res:
                        match = re.search(r"```\\s*(.*?)\\s*```", content_res, re.DOTALL)
                        content_res = match.group(1) if match else content_res
                    
                    data = json.loads(content_res)
                    batch_questions = data["questions"] if isinstance(data, dict) and "questions" in data else (data if isinstance(data, list) else [])

                # Add to total and decrement target
                for q in batch_questions:
                    all_questions.append(q)
                    q_type_raw = (q.get("type") or q.get("questionType") or "writing").lower().replace("_", "")
                    # Try to find which target bucket this fits into
                    # This is imprecise because LLM might return 'multiple_choice' instead of 'mcq'
                    for t_key in target_distribution.keys():
                        if t_key.replace("_", "") in q_type_raw or q_type_raw in t_key.replace("_", ""):
                            target_distribution[t_key] = max(0, target_distribution[t_key] - 1)
                            break
                
                # Safety break if LLM is looping or failing to decrement
                if not batch_questions:
                    break
                    
            except Exception as e:
                print(f"[Practice Generation] Batch failed: {e}")
                break"""

NEW_PRACTICE_GEN_LOOP = """        OkaService._status[session_id] = "Generating Practice Questions..."
        
        tasks = []
        for q_type, count in target_distribution.items():
            for _ in range(count):
                agent = QuestionAgent(self.planner_llm, q_type)
                # We inject random seed logic directly into context to prevent duplicate questions
                import random
                seed = random.random()
                tasks.append(agent.generate(hub['title'], f"SEED: {seed}\\n" + full_context, config.difficulty))
                
        # Limit concurrency to 5 to avoid groq/ollama rate limits
        semaphore = asyncio.Semaphore(5)
        
        async def run_agent(agent_task):
            async with semaphore:
                await asyncio.sleep(0.5) # Slight pacing
                return await agent_task
                
        results = await asyncio.gather(*(run_agent(t) for t in tasks), return_exceptions=True)
        
        all_questions = []
        for idx, res in enumerate(results):
            if isinstance(res, dict):
                res["id"] = idx + 1
                all_questions.append(res)
            else:
                print(f"Failed to generate a question: {res}")"""

# Because the file is large, I'm replacing the loop block dynamically
# Find where the while loop starts and ends.
start_idx = content.find("        while sum(target_distribution.values()) > 0:")
end_idx = content.find("        questions = all_questions", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + NEW_PRACTICE_GEN_LOOP + "\n\n" + content[end_idx:]

with open(FILE_PATH, "w") as f:
    f.write(content)

print("Updated service.py")
