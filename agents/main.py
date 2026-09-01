import os
os.environ["NEMOGUARDRAILS_LLM_FRAMEWORK"] = "langchain"

from fastapi import FastAPI
from pydantic import BaseModel
from multi_agent import app as agent_app
from nemoguardrails import LLMRails, RailsConfig
from langchain_core.messages import HumanMessage


# 1. Initialize the API
app = FastAPI()


# 2. Load the NeMo Guardrails Bouncer
print("Loading NeMo Guardrails...")
config = RailsConfig.from_path("./config")
rails = LLMRails(config)
print("Guardrails Active! 🛡️")


# 3. Define what the incoming JSON data should look like
class QueryRequest(BaseModel):
    prompt: str
    documentText: str | None = None  # <-- Accept the document!

@app.post("/api/research")
async def run_research(request: QueryRequest):
    print(f"🚀 Incoming request to Agent Core: {request.prompt}")

    # 4. Save the document text to disk so the LangGraph tools can read it!
    if request.documentText:
        with open("uploaded_document.txt", "w", encoding="utf-8") as f:
            f.write(request.documentText)
        print("📄 Saved uploaded PDF text to local file for LangGraph.")
    else:
        # Clear the file if no document was sent in this request
        with open("uploaded_document.txt", "w", encoding="utf-8") as f:
            f.write("No document provided.")

    # 4. First, pass the prompt to the Bouncer!
    # The Bouncer will evaluate the prompt using the rules in rails.co
    bouncer_response = await rails.generate_async(messages = [{"role": "user", "content": request.prompt}])
    bouncer_text = bouncer_response["content"]

    # 5. Check if the bouncer blocked it!
    if "programmed to discuss politics" in bouncer_text:
        print("🛡️ BOUNCER INTERCEPTED THE PROMPT!")
        return {
            "status": "success",
            "data": "🛡️ **Guardrail Alert:** " + bouncer_text
        }


    # 5. If it's safe, let the LangGraph Multi-Agent handle it!
    # LangChain expects messages in a tuple format: ("user", "the prompt")
    
        # 3. Run LangGraph
    result = agent_app.invoke({"messages": [HumanMessage(content=request.prompt)]})
    
    # Extract the final message content
    reply_content = result["messages"][-1].content
    
    # If the LLM returned an array instead of a string, extract the text!
    if isinstance(reply_content, list):
        reply_content = reply_content[0].get("text", str(reply_content))

        return {
        "status": "success",
        "data": reply_content
    }

