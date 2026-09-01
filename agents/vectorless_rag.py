import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool

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
    model = "gemini-3.5-flash",
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


@tool
def analyze_document(target_title: str) -> str:
    """Use this tool to extract specific sections from the internal Nexus AI Pitch Deck."""
    print("Reading uploaded document...")
    try:
        with open("uploaded_document.txt", "r", encoding="utf-8") as f:
            document_content = f.read()
    except FileNotFoundError:
        return "Error: No document was uploaded by the user."

    print("Building Vectorless Index...")

    # We pass the document to our structured LLM
    result = structured_llm.invoke(f"Extract the sections from this document: {document_content}")

    # 2. Retrieve the specific section
    return retrieve_section(result, target_title)