---
name: summarize
description: >
  Automatically activated when the user asks to summarize, explain,
  or get an overview of a project. Trigger phrases include:
  "summarize this project", "explain the codebase", "give me an overview",
  "what does this repo do", "describe this project", "walk me through the code".
version: 0.1.0
---

# Project Summarization Skill

When the user asks for a project summary or overview, provide a structured
analysis of the repository by following these steps.

## Steps

1. **Identify the project purpose:**
   - Read the top-level README, package.json, or equivalent manifest
   - Check for a description, homepage, or repository URL
   - Summarize what the project does in 1-2 sentences

2. **Determine the tech stack:**
   - Identify the primary language(s) from file extensions and config files
   - List frameworks and major libraries from dependency manifests
   - Note the build system, test framework, and CI/CD setup if present

3. **Map the project structure:**
   - List top-level directories with a brief description of each
   - Identify the entry point(s) for the application
   - Note any monorepo structure, workspaces, or sub-packages

4. **Highlight key files:**
   - Configuration files (tsconfig, eslint, docker, etc.)
   - Main source entry points
   - Database schemas or migrations
   - API route definitions or endpoint handlers
   - Shared types, utilities, or constants

5. **Provide getting started instructions:**
   - Prerequisites (runtime, tools, environment variables)
   - Installation steps
   - How to run the project locally
   - How to run tests
   - Key development commands

## Output Format

Present the summary using clear headings:

- **Purpose** -- what the project does and why
- **Tech Stack** -- languages, frameworks, tools
- **Project Structure** -- directory layout overview
- **Key Files** -- important files to understand first
- **Getting Started** -- steps to run locally
