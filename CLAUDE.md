# Claude Code Rules for PromptsGenie

## Git Workflow Rules

### Always Push After Commits
**IMPORTANT:** After creating any git commit, ALWAYS push the changes to the remote repository immediately.

Workflow:
1. Make code changes
2. Run build to verify
3. Create git commit
4. **IMMEDIATELY push to remote** using `git push`

Do not wait for user confirmation to push - pushing should be automatic after every successful commit.

## Project-Specific Notes

- Orange theme color: `#F77000` (brand-accent)
- Use existing UI components from `src/components/ui/`
- Follow TypeScript strict mode conventions
- Use Tailwind CSS for styling
- Prefer Framer Motion for animations