# Autonomous Deep Research Platform (ADRP)

This is a production-grade system using Deep Agents, Vectorless RAG, and an LLM Gateway, wrapped in a full-stack application.

## Architecture

1. **Frontend (Next.js):** React-based UI for users to submit complex research prompts and view due diligence reports.
2. **LLM Gateway (NestJS):** Node.js backend that acts as the API server, routing simple tasks to smaller models (e.g., Gemini Flash) and complex reasoning to heavier models to optimize cost and performance. Implements caching.
3. **Agent Core (LangGraph Python):** The orchestration layer that plans research, creates task lists, and coordinates sub-agents.
4. **Sub-Agents:**
   - **Web Researcher:** Performs live web searches and saves findings to the local file system.
   - **Document Analyzer:** Uses Vectorless RAG to navigate massive structured documents via a JSON tree index.

## Project Structure
- `/backend` - NestJS LLM Gateway & API (Coming Soon)
- `/frontend` - Next.js Application (Coming Soon)
- `/agents` - LangGraph Python Core (Coming Soon)
