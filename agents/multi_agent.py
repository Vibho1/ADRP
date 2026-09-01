import os
import time
from typing import Annotated, Sequence, TypedDict, Literal
from dotenv import load_dotenv
import operator
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

# Import your custom RAG tool!
from vectorless_rag import analyze_document

load_dotenv(dotenv_path="../.env")

# 1. Initialize the Brain
llm = ChatGoogleGenerativeAI(
    model = "gemini-3.5-flash",
    google_api_key = os.getenv("GEMINI_API_KEY")
)



# 2. Define the State
# The state is passed between supervisor and the workers
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str


# 3. Create Worker 1: The Web Researcher
search_tool = TavilySearchResults(
    max_results = 3,
    tavily_api_key = os.getenv("TAVILY_API_KEY")
)
researcher_agent = create_react_agent(
    llm,
    tools = [search_tool],
    prompt = """You are a VC Investigative Researcher. Your job is to search the web for news, competitors, 
    and market data about startups. Be brutally objective."""
    )

def researcher_node(state: AgentState):
    print("🤖 Researcher is searching the web...")
    time.sleep(4) # <-- Take a breath
    result = researcher_agent.invoke({"messages": state["messages"]})
    return {"messages": [result["messages"][-1]]}


# 4. Create Worker 2: The RAG Analyst
analyst_agent = create_react_agent(
    llm,
    tools = [analyze_document],
    prompt="""You are a VC Financial Analyst. 
    Your job is to read internal pitch decks and extract traction, valuation, and competitor data."""
    )

def analyst_node(state: AgentState):
    print("🧠 Analyst is reading internal documents...")
    time.sleep(4) # <-- Take a breath
    result = analyst_agent.invoke({"messages": state["messages"]})
    return {"messages": [result["messages"][-1]]}


# 5. Create the Supervisor Node
# The Supervisor MUST choose one of these three options
class SupervisorDecision(BaseModel):
    next: Literal["Researcher", "Analyst", "FINISH"]

supervisor_chain = llm.with_structured_output(SupervisorDecision)

def supervisor_node(state: AgentState):
    print("👔 Supervisor is deciding the next step...")
    time.sleep(4) # <-- Take a breath
    prompt = f"""You are the Lead Partner at a Venture Capital firm managing a due-diligence team. Based on the user's request, who should act next? 
    If you need web search on competitors, news, or market size, use the Researcher. 
    If you need to analyze the internal Nexus AI Pitch Deck, use the Analyst. 
    If you have combined both external news and internal data into a full Investment Memo, choose FINISH.\n\nConversation:\n{state['messages']}"""
    decision = supervisor_chain.invoke(prompt)
    return {"next": decision.next}
    

# 6. Build the Organizationzal Chart (Graph)
workflow = StateGraph(AgentState)

# Add the nodes
workflow.add_node("Supervisor", supervisor_node)
workflow.add_node("Researcher", researcher_node)
workflow.add_node("Analyst", analyst_node)

# Connect workers back to Supervisor
workflow.add_edge("Researcher", "Supervisor")
workflow.add_edge("Analyst", "Supervisor")

# Connect Supervisor to workers (Conditional Routing)
workflow.add_conditional_edges(
    "Supervisor",
    lambda x: x["next"],
    {
        "Researcher": "Researcher",
        "Analyst": "Analyst",
        "FINISH": END
    }
)

workflow.set_entry_point("Supervisor")

# Compile the Graph
app = workflow.compile()