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

    # Create the initial State
    initial_state = {
        "messages": [request.prompt],
        "research_status": "started"
    }

    # Hand the State to the LangGraph Agent
    result = agent_app.invoke(initial_state)

    # Return the final message produced by the agent back to the user
    return {
        "status": "success",
        "data": result["messages"][-1]
    }