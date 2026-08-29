from fastapi import FastAPI
from pydantic import BaseModel
from agent import app as agent_app

# Initialize the API
app = FastAPI()

# Define what the incoming JSON data should look like
class QueryRequest(BaseModel):
    prompt: str

@app.post("/api/research")
async def run_research(request: QueryRequest):
    print(f"🚀 Incoming request to Agent Core: {request.prompt}")

    # Hand the prompt to the LangGraph Agent
    # LangChain expects messages in a tuple format: ("user", "the prompt")
    
    result = agent_app.invoke({"messages": [("user", request.prompt)]})

    # The result contains a list of complex LangChain message objects. 
    # We grab the very last message in the list and extract its text content.
    final_message = result["messages"][-1].content

    return {
        "status": "success",
        "data": final_message
    }