---
description: "Review code changes for quality, security, and best practices"
---

# Code Review

Review the current code changes following BeachBum engineering standards.

## Steps

1. **Check for changes to review:**
   - First check for staged changes using `git diff --cached`
   - If no staged changes, check for unstaged changes using `git diff`
   - If no uncommitted changes at all, review the most recent commit using `git show HEAD`

2. **Analyze the changes across these dimensions:**

   **Code Quality**
   - Look for bugs, logic errors, and unhandled edge cases
   - Check for off-by-one errors, null/undefined access, and race conditions
   - Verify error handling is present and meaningful

   **Readability**
   - Assess naming clarity for variables, functions, and types
   - Check for overly complex or deeply nested logic
   - Verify comments exist for non-obvious business logic

   **Best Practices and Conventions**
   - Ensure consistent code style with the rest of the codebase
   - Check for proper use of TypeScript types (no unnecessary `any`)
   - Verify imports are organized and unused imports are removed
   - Look for DRY violations and opportunities to extract shared logic

   **Security Concerns**
   - Check for hardcoded secrets, tokens, or credentials
   - Verify input validation and sanitization
   - Look for SQL injection, XSS, or other injection vulnerabilities
   - Check that sensitive data is not logged or exposed

   **Performance Issues**
   - Identify unnecessary re-renders, redundant computations, or N+1 queries
   - Check for missing pagination on large data sets
   - Look for synchronous operations that should be async
   - Verify proper cleanup of resources (listeners, timers, connections)

3. **Provide feedback:**
   - Reference specific file paths and line numbers
   - Explain the issue clearly and why it matters
   - Suggest a concrete fix or improvement for each finding
   - Categorize findings by severity: critical, warning, suggestion
   - Summarize with an overall assessment and top priorities
