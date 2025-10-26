## 📋 Pull Request Checklist

### 🎯 **Change Summary**
<!-- Provide a brief description of what this PR accomplishes -->

**Type of Change:**
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test coverage improvement

### 🔗 **Related Issues**
<!-- Link to related issues using "Closes #123" or "Fixes #123" -->
- Closes #
- Related to #

---

## ✅ **Quality Gates Checklist**

### 🧪 **Testing Requirements**
- [ ] All existing tests pass (`npm test`)
- [ ] New tests added for new functionality
- [ ] Test coverage meets minimum threshold (80%)
- [ ] Manual testing completed for UI changes
- [ ] Edge cases and error scenarios tested

### 🔍 **Code Quality**
- [ ] ESLint passes with zero warnings (`npm run lint`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Code follows project conventions and style guide
- [ ] Functions and components are properly documented
- [ ] No console.log statements in production code

### 🔒 **Security & Privacy**
- [ ] No secrets or API keys in code
- [ ] Gitleaks scan passes (`npm run audit:secrets`)
- [ ] npm audit shows no high-severity vulnerabilities
- [ ] User input is properly validated and sanitized
- [ ] No PII (Personally Identifiable Information) logged

### 🚀 **Performance & Accessibility**
- [ ] Bundle size analysis passes (`npm run analyze:bundle`)
- [ ] No performance regressions introduced
- [ ] Lighthouse scores meet thresholds (A11y ≥90%, Perf ≥75%)
- [ ] Accessibility tests pass (`npm run test:a11y`)
- [ ] Keyboard navigation works properly
- [ ] Screen reader compatibility verified

### 🎨 **Visual & UX**
- [ ] UI changes reviewed in multiple browsers
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Visual regression tests pass (Chromatic)
- [ ] Loading states and error handling implemented
- [ ] User feedback mechanisms in place

### 📝 **Documentation**
- [ ] README updated if needed
- [ ] API documentation updated for new endpoints
- [ ] Storybook stories added for new components
- [ ] Changelog entry added (if applicable)

### 🔄 **CI/CD Requirements**
- [ ] All CI checks pass
- [ ] Environment variables documented
- [ ] Database migrations included (if applicable)
- [ ] Deployment considerations documented

---

## 🧪 **Testing Instructions**

### **Local Testing Steps:**
1. 
2. 
3. 

### **Expected Behavior:**
<!-- Describe what should happen when testing this change -->

### **Screenshots/Videos:**
<!-- Add screenshots or videos demonstrating the changes -->

---

## 🚀 **Deployment Notes**

### **Environment Variables:**
<!-- List any new environment variables needed -->
- `NEW_VAR_NAME`: Description of what it does

### **Database Changes:**
<!-- Describe any database schema changes -->
- [ ] No database changes
- [ ] Migration scripts included
- [ ] Backward compatible

### **Breaking Changes:**
<!-- List any breaking changes and migration steps -->
- [ ] No breaking changes
- [ ] Breaking changes documented below

---

## 📊 **Performance Impact**

### **Bundle Size:**
- Before: X KB
- After: Y KB
- Change: +/- Z KB

### **Performance Metrics:**
<!-- Include Lighthouse scores or other performance metrics -->
- [ ] Performance impact assessed
- [ ] No significant performance degradation

---

## 🔍 **Review Focus Areas**

<!-- Highlight specific areas where you'd like focused review -->
- [ ] Algorithm efficiency in `src/components/X.tsx`
- [ ] Error handling in API integration
- [ ] Accessibility implementation
- [ ] Security considerations

---

## 📋 **Post-Merge Tasks**

<!-- Tasks to complete after merging -->
- [ ] Update production environment variables
- [ ] Monitor error rates post-deployment
- [ ] Update team documentation
- [ ] Announce feature to stakeholders

---

**Additional Notes:**
<!-- Any additional context, concerns, or considerations -->

---

### 🤖 **Automated Checks Status**
<!-- This section will be automatically updated by CI -->
- CI Pipeline: ⏳ Pending
- Code Coverage: ⏳ Pending  
- Security Scan: ⏳ Pending
- Performance Budget: ⏳ Pending
- Visual Tests: ⏳ Pending

---

**By submitting this PR, I confirm that:**
- [ ] I have read and followed the contributing guidelines
- [ ] I have tested my changes thoroughly
- [ ] I have considered the impact on existing functionality
- [ ] I am ready for code review and feedback