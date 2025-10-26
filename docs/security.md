# Security Guide

This guide covers secure API key management and deployment practices for PromptsGenie, following industry best practices for different environments.

## 🔐 API Key Management

### Local Development

**Use `.env` file with proper exclusion:**

1. Create a `.env` file in your project root:
   ```bash
   # .env (never commit this file)
   GOOGLE_API_KEY=your_ai_studio_key_here
   IMAGE_ANALYZER_BACKEND=gemini
   ```

2. The `.env` file is already excluded in `.gitignore`
3. **Rotate the key immediately if it ever leaks**

### CI/CD Environments

**Store keys in CI secrets:**

- **GitHub Actions**: Use Repository Secrets
  ```yaml
  env:
    GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
  ```

- **GitLab CI**: Use CI/CD Variables
  ```yaml
  variables:
    GOOGLE_API_KEY: $GOOGLE_API_KEY
  ```

- **Expose secrets only to jobs that need them**
- **Pass as environment variables at runtime**

### Production Deployment

**Prefer cloud secrets managers:**

1. **GCP Secret Manager** (ideal if on GCP):
   ```bash
   gcloud secrets create google-api-key --data-file=key.txt
   ```

2. **AWS Secrets Manager**:
   ```bash
   aws secretsmanager create-secret --name google-api-key --secret-string "your-key"
   ```

3. **HashiCorp Vault**:
   ```bash
   vault kv put secret/google-api api_key="your-key"
   ```

**Container deployment:**
- Inject secrets at container startup
- Use environment variables or mounted files
- **Never bake secrets into the image**

## 🎯 Choosing AI Studio vs Vertex AI

### AI Studio (GOOGLE_API_KEY)
**Best for:**
- ✅ Rapid prototyping
- ✅ Simpler billing
- ✅ Easy setup (single API key)
- ✅ Not already on GCP infrastructure

### Vertex AI (Service Account + IAM)
**Best for:**
- ✅ Production on GCP
- ✅ Organization policies
- ✅ VPC Service Controls
- ✅ Audit logs
- ✅ Per-service permissions
- ✅ Better quota/SLA control
- ✅ Regional data controls

**Migration path:** Start with AI Studio for speed, migrate to Vertex for production.

## 🔧 Environment Variables

### Supported Variable Names

```bash
# Primary (AI Studio)
GOOGLE_API_KEY=your_ai_studio_key

# Alternative (Vite convention)
VITE_GEMINI_API_KEY=your_ai_studio_key

# Vertex AI (Service Account)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Configuration
IMAGE_ANALYZER_BACKEND=gemini
IMAGE_ANALYZER_TIMEOUT_MS=20000
```

### Example Configurations

**Local Development:**
```bash
# .env
GOOGLE_API_KEY=your_ai_studio_key
IMAGE_ANALYZER_BACKEND=gemini
VITE_DEBUG_MODE=true
```

**Production:**
```bash
# Injected at runtime
GOOGLE_API_KEY=your_production_key
IMAGE_ANALYZER_BACKEND=gemini
IMAGE_ANALYZER_TIMEOUT_MS=30000
LOG_LEVEL=warn
```

## 🚀 Deployment Examples

### Vercel
```bash
# Add to Vercel environment variables
vercel env add GOOGLE_API_KEY
```

### Netlify
```bash
# Add to Netlify environment variables
netlify env:set GOOGLE_API_KEY your_key_here
```

### Docker
```dockerfile
# Dockerfile - don't include secrets
FROM node:18-alpine
COPY . .
RUN npm ci --only=production

# Runtime injection
CMD ["sh", "-c", "npm start"]
```

```bash
# Runtime
docker run -e GOOGLE_API_KEY=$GOOGLE_API_KEY your-image
```

### Kubernetes on GCP
```yaml
# Use Workload Identity (recommended)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prompts-genie-sa
  annotations:
    iam.gke.io/gcp-service-account: prompts-genie@project.iam.gserviceaccount.com
```

### Cloud Run
```bash
# Deploy with secret
gcloud run deploy prompts-genie \
  --set-env-vars="GOOGLE_API_KEY=projects/PROJECT/secrets/google-api-key/versions/latest"
```

### GitHub Actions
```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        env:
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
        run: npm run deploy
```

## ✅ Security Checklist

### Development
- [ ] `.env` files excluded from git
- [ ] Pre-commit hooks to detect secrets
- [ ] API keys scoped to required APIs only
- [ ] Per-key quotas and alerts configured

### Production
- [ ] Secrets stored in cloud secrets manager
- [ ] Keys rotated regularly
- [ ] Minimal logging (never log keys or sensitive payloads)
- [ ] Regional endpoints configured for data controls
- [ ] Service accounts with minimal permissions

### Monitoring
- [ ] API usage alerts configured
- [ ] Quota monitoring enabled
- [ ] Error rate tracking
- [ ] Security audit logs enabled

## 🔄 Key Rotation

### Regular Rotation
```bash
# 1. Generate new key
# 2. Update in secrets manager
# 3. Deploy with new key
# 4. Verify functionality
# 5. Revoke old key
```

### Emergency Rotation
```bash
# 1. Immediately revoke compromised key
# 2. Generate new key
# 3. Emergency deploy
# 4. Audit access logs
# 5. Review security practices
```

## 📊 Monitoring & Alerts

### Recommended Alerts
- API quota approaching limits
- Unusual usage patterns
- Authentication failures
- High error rates
- Regional access violations

### Logging Best Practices
```typescript
// ✅ Good - Log metadata only
console.log('API call completed', { 
  model: 'gemini-1.5-flash', 
  duration: 1200,
  status: 'success' 
});

// ❌ Bad - Never log sensitive data
console.log('API response:', fullResponse);
```

## 🆘 Incident Response

### If API Key is Compromised
1. **Immediately revoke** the compromised key
2. **Generate and deploy** new key
3. **Audit logs** for unauthorized usage
4. **Review** how the leak occurred
5. **Update security practices** to prevent recurrence

### Contact Information
- **GCP Support**: For Vertex AI issues
- **Google AI Studio**: For API Studio issues
- **Internal Security Team**: For incident escalation

## 🔍 Secret Detection

### Pre-commit Hooks
We provide built-in secret detection to prevent accidental commits:

```bash
# Run manually
npm run check-secrets

# Set up as pre-commit hook
npm run setup-hooks
```

### Common Patterns Detected
- Google API keys (`AIza...`)
- OAuth tokens (`ya29...`)
- Private keys (`-----BEGIN...`)
- Generic API keys (long alphanumeric strings)

## 📚 Additional Resources

- [Google AI Studio Documentation](https://ai.google.dev/)
- [Vertex AI Security Best Practices](https://cloud.google.com/vertex-ai/docs/general/security)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Cloud Security Alliance Guidelines](https://cloudsecurityalliance.org/)