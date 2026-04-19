from langchain_core.prompts import ChatPromptTemplate
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema

ARCHITECT_SYSTEM_PROMPT = """
You are the OKA Architect. Your SOLE purpose is to deconstruct academic text into a SovereignPlan by CALLING THE PROVIDED TOOL.

CRITICAL MANDATES:
1. YOU MUST NOT EMIT MARKDOWN. Do not use headers like '## SovereignPlan'.
2. YOU MUST ONLY RESPOND BY CALLING THE `SovereignPlan` TOOL.
3. Maps concepts to exactly 15-25 atomic notes.
4. For EACH note, extract the exact 1-3 paragraphs of source text (source_context) and identify the page numbers (source_pages) using the [PAGE X] markers.
5. NO PREAMBLE. NO EXPLANATION. ONLY THE TOOL CALL.
"""

class ArchitectAgent:
    def __init__(self, llm: BaseChatModel):
        # Bind the Pydantic schema to the LLM
        # Using with_structured_output which is the modern path for Pydantic enforcement
        self.llm_with_plan = llm.with_structured_output(SovereignPlan)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", ARCHITECT_SYSTEM_PROMPT),
            ("human", "Here is the source text to be processed:\n\n---\n\n{document_text}")
        ])
        self.chain = self.prompt | self.llm_with_plan

    async def generate_plan(self, document_text: str) -> SovereignPlan:
        """
        Invokes the agent to generate a structured SovereignPlan from raw text.
        
        Returns:
            A Pydantic object of the SovereignPlan, not a raw string.
        """
        return await self.chain.ainvoke({"document_text": document_text})

WRITER_SYSTEM_PROMPT = """
You are a Sovereign Writer. Your SOLE purpose is to generate pedagogical content by CALLING THE `NoteContent` TOOL.

CRITICAL MANDATES:
1. YOU MUST NOT EMIT RAW MARKDOWN. Do not start with headers.
2. YOU MUST ONLY RESPOND BY CALLING THE `NoteContent` TOOL.
3. IRON LAW: Use ONLY these four H2 headers in order inside the `markdown_body` field:
## Definition & Mechanics
## Worked Example / Visible Artifact (MUST include Table/Mermaid/Code)
## Edge Case Analysis
## Relational Connections (Connect to: {prerequisites})

4. NO PREAMBLE. NO CONVERSATIONAL FILLER. ONLY THE TOOL CALL.
"""

PQ_WRITER_SYSTEM_PROMPT = """
You are a Socratic question generator for the OKA system. Your SOLE purpose is to formulate interrogation nodes by CALLING THE `NoteContent` TOOL.

CRITICAL MANDATES:
1. YOU MUST NOT EMIT RAW MARKDOWN.
2. YOU MUST ONLY RESPOND BY CALLING THE `NoteContent` TOOL.
3. IRON LAW: Use ONLY these three H2 headers in order inside the `markdown_body` field:
## The Scenario (L1)
## The Implementation (L2) (MUST include a visible artifact)
## The Debug (L3)

4. Include a visible artifact in the implementation section. NO PREAMBLE. ONLY THE TOOL CALL.
"""

class WriterAgent:
    def __init__(self, llm: BaseChatModel):
        # Use a slightly higher temperature for nuanced writing as requested
        self.llm_with_content = llm.with_structured_output(NoteContent)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", WRITER_SYSTEM_PROMPT),
            ("human", "Source Text:\n---\n{source_text}\n---\n\nPlease generate the content for the note titled '{note_title}'.")
        ])
        self.chain = self.prompt | self.llm_with_content

    async def generate_content(self, note_schema: AtomicNoteSchema, source_text: str) -> NoteContent:
        """
        Invokes the agent to write the body of a single atomic note.
        """
        prereq_titles = ", ".join(note_schema.prerequisites) if note_schema.prerequisites else "None"
        
        return await self.chain.ainvoke({
            "note_title": note_schema.title,
            "note_description": note_schema.description,
            "prerequisites": prereq_titles,
            "source_text": source_text
        })

    async def generate_pq_content(self, note_schema: NoteSchema, source_text: str) -> NoteContent:
        """
        Invokes the agent to write a "Possible Question" note.
        """
        pq_prompt = ChatPromptTemplate.from_messages([
            ("system", PQ_WRITER_SYSTEM_PROMPT),
            ("human", "Source Text:\n---\n{source_text}\n---\n\nPlease generate the question and answer for the concept '{note_title}'.")
        ])
        
        pq_chain = pq_prompt | self.llm_with_content
        
        return await pq_chain.ainvoke({
            "note_title": note_schema.title,
            "source_text": source_text
        })
