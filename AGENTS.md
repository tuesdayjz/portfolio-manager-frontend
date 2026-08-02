<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Guidelines

This is a Next.js + React + TypeScript application using Tailwind CSS and shadcn/ui.

When making changes, follow these rules:

### 1. Reuse First

* Always inspect existing components, hooks, utilities, and patterns before creating new code.
* Reuse existing components whenever possible.
* Avoid creating duplicate or near-duplicate components.
* If existing code is poorly structured, duplicated, or unnecessarily complex, improve it when working in that area.
* Do not introduce abstractions unless they meaningfully improve maintainability.

### 2. Use shadcn/ui

* Use existing shadcn/ui components whenever possible.
* When a required UI primitive does not exist, add it using the shadcn CLI.
* Do not manually recreate components that shadcn already provides.
* Do not introduce another UI/component library unless explicitly requested.

Example:

```bash
npx shadcn@latest add dialog
```

### 3. Follow the Design System

* Use the existing theme and semantic color tokens.
* Prefer classes such as `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, etc.
* Avoid hard-coded colors such as `#fff`, `#123456`, or arbitrary Tailwind colors unless genuinely necessary.
* Follow existing spacing, typography, radius, and component patterns.
* Use existing icons/components rather than introducing alternatives.

### 4. Strict TypeScript

All code must be strictly typed.

* Do not use `any` unless absolutely unavoidable.
* Avoid `@ts-ignore` and unsafe type assertions.
* Define proper types for component props, API responses, data models, and function parameters.
* Reuse existing types instead of duplicating them.
* Do not weaken TypeScript configuration to make code compile.
* Prefer type-safe solutions over runtime assumptions.

### 5. Security

Never introduce security vulnerabilities.

* Never hard-code secrets, API keys, passwords, or tokens.
* Never expose server-only credentials to the client.
* Treat all user/client input as untrusted.
* Do not bypass authentication or authorization.
* Avoid `dangerouslySetInnerHTML`, `eval`, unsafe redirects, and unsafe dynamic URLs unless there is a strong, reviewed reason.
* Follow existing Supabase authentication and authorization patterns.
* Use the least-privileged access possible.
* Do not expose sensitive information in errors or logs.

### 6. Next.js / React

* Follow the existing Next.js architecture and conventions.
* Avoid unnecessary `"use client"`.
* Prefer Server Components when possible.
* Reuse existing data-fetching and state-management patterns.
* Do not introduce new libraries for problems already solved by the project.

### 7. UI Quality

New UI should:

* Be responsive.
* Be accessible.
* Support appropriate loading, empty, and error states.
* Use semantic HTML.
* Be keyboard accessible.
* Follow existing UI patterns.

For financial data, format currencies, percentages, quantities, gains, and losses consistently with the rest of the application. Do not rely on color alone to communicate meaning.

### 8. Keep Changes Focused

* Do not modify unrelated files.
* Do not perform unnecessary rewrites or dependency upgrades.
* Preserve existing behavior unless the task requires changing it.
* Keep components focused and maintainable.
* Prefer small, understandable changes over clever solutions.

### 9. Validate Before Finishing

Before completing a task:

* Run lint.
* Run the TypeScript/build checks when practical.
* Test the affected functionality.
* Review the final diff for accidental or unrelated changes.
* Do not claim validation passed if it was not actually run.

### Priority

When rules conflict, prioritize:

**Security → Correctness → Strict typing → Existing architecture → Reuse → Accessibility → Maintainability → Visual consistency → Performance**

The goal is to leave the codebase **cleaner, safer, more consistent, and strictly typed** than before.
