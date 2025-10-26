# GitHub MCP Server Setup

## Required: GitHub Personal Access Token

To enable GitHub integration, you need to create a Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select these scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
   - `read:user` (Read user profile data)
   - `user:email` (Access user email addresses)

4. Copy the generated token
5. Replace `YOUR_GITHUB_TOKEN_HERE` in `mcp.json` with your actual token

## Security Note
- Never commit your actual token to version control
- Consider using environment variables for production setups
- The token gives access to your GitHub repositories, so keep it secure

## Alternative: Environment Variable Setup
You can also set the token as an environment variable:
```bash
$env:GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
```

Then update the mcp.json to use the environment variable directly.