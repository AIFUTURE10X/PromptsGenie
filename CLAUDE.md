# Claude Code Rules for PromptsGenie

## Git Workflow Rules

### Always Push and Create Pull Requests
**IMPORTANT:** After creating any git commit, ALWAYS push the changes to the remote repository immediately, then automatically create a pull request.

Workflow:
1. Make code changes
2. Run build to verify
3. Create git commit
4. **IMMEDIATELY push to remote** using `git push`
5. **AUTOMATICALLY create pull request** to main branch using `gh pr create`

Do not wait for user confirmation - pushing and PR creation should be automatic after every successful commit.

When creating PRs, use this format:
- **Title**: Brief description of the feature/fix
- **Body**: Summary section with bullet points, Test plan checklist, and "🤖 Generated with Claude Code" footer

## Project-Specific Notes

- Orange theme color: `#F77000` (brand-accent)
- Use existing UI components from `src/components/ui/`
- Follow TypeScript strict mode conventions
- Use Tailwind CSS for styling
- Prefer Framer Motion for animations