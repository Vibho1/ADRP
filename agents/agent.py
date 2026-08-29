import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.prebuilt import create_react_agent

# Load the environment variables from the parent folder (.env)
load_dotenv(dotenv_path="../.env")

# 1. Initialize the LLM (The Brain)
llm = ChatGoogleGenerativeAI(
    model = "gemini-3.6-flash",
    google_api_key = os.getenv("GEMINI_API_KEY")
)

# 2. Initialize the Web Search Tool (Tavily)
# Tavily searches the web and returns content specifically formatted for AI
search_tool = TavilySearchResults(
    max_results = 3,
    tavily_api_key = os.getenv("TAVILY_API_KEY")
)

tools = [search_tool]

# 3. Create the Agent Graph!
# 'create_react_agent' automatically builds the StateGraph and Nodes for us!
app = create_react_agent(llm, tools)