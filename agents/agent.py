from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
import operator

# 1. Define the State
class AgentState(TypedDict):
    # 'operator.add' means whenever we return new messages, they get appended to the list, not overwritten!
    messages: Annotated[list, operator.add]
    research_status: str

# 2. Define a Node
def research_node(state: AgentState):
    print(f"🤖 Agent received prompt: {state['messages'][-1]}")

    # TODO: In Phase 3, this is where we will hook up our LLM and Web Search tools!
    # For now, we'll pretend we did the research.
    mock_report = "I have researched the topic thoroughly! This is a highly detailed due diligence report."

    # We return what we want to ADD to the state
    return {
        "messages": [mock_report],
        "research_status": "completed"
    }

# 3. Build the Graph
workflow = StateGraph(AgentState)

# Add our node to the graph
workflow.add_node("researcher", research_node)

# Set the Edges: Start -> Research -> End
workflow.set_entry_point("researcher")
workflow.add_edge("researcher", END)

# Compile it into a runnable AI app!
app = workflow.compile()