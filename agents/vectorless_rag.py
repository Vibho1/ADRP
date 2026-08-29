import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(dotenv_path="../.env")

# 1. Define what our JSON tree should look like
class DocumentSection(BaseModel):
    title: str = Field(description = "The title of this section of the document.")
    summary: str = Field(description = "A 2-sentence summary of what this section contains.")
    content: str = Field(description = "The full text content of this section.")

class DocumentIndex(BaseModel):
    sections: list[DocumentSection] = Field(description = "The list of all major sections in the document.")

# 2. Initialize the LLM
llm = ChatGoogleGenerativeAI(
    model = "gemini-3.6-flash",
    google_api_key = os.getenv("GEMINI_API_KEY")
)

# 3. Force the LLM to strictly follow our JSON structure!
structured_llm = llm.with_structured_output(DocumentIndex)

def retrieve_section(index: DocumentIndex, target_title: str):
    print(f"\n🔍 Searching tree index for: '{target_title}'...")
    for section in index.sections:
        # We do a simple text match against the titles in our JSON!
        if target_title.lower() in section.title.lower():
            return section.content

    return "Section not found."


if __name__ == "__main__":
    fake_document = """
    Ather Energy Q3 Report.
    Financials: We made a lot of money. Revenue is up 50%.
    Risks: The supply chain for batteries is getting expensive.
    Future Plans: We are launching a new scooter next year.
    """

    print("Building Vectorless Index...")

    # We pass the document to our structured LLM
    result = structured_llm.invoke(f"Extract the sections from this document: {fake_document}")

    for section in result.sections:
        print(f"📌 {section.title}: {section.summary}")

    # Let's pretend our Agent decided it needs to read the full text about Risk
    agent_query = "Risks"

    # We pull the exact content from our structured tree!
    pulled_content = retrieve_section(result, agent_query)
    print(f"📖 Pulled Content: {pulled_content}")