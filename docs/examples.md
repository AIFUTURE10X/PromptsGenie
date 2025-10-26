# Spec-to-Code Autopilot Examples

This document provides comprehensive examples of using the Spec-to-Code Autopilot system for various development scenarios.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Advanced Workflows](#advanced-workflows)
3. [Real-World Scenarios](#real-world-scenarios)
4. [Integration Examples](#integration-examples)
5. [Troubleshooting Examples](#troubleshooting-examples)

## Basic Examples

### Example 1: Adding a Simple Component

**Scenario**: Add a loading spinner component to a React application.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Add loading spinner component" --type feature --priority low
```

**Generated Specification**:
```json
{
  "metadata": {
    "title": "Add Loading Spinner Component",
    "type": "feature",
    "priority": "low",
    "version": "1.0.0"
  },
  "userStory": {
    "as": "a user",
    "want": "to see a loading indicator when content is being fetched",
    "so": "I know the application is working and not frozen"
  },
  "acceptanceCriteria": [
    "Given the application is loading data, when I view the page, then I should see a spinner",
    "Given the data has loaded, when the spinner disappears, then I should see the content",
    "Given the spinner is visible, when it animates, then it should rotate smoothly"
  ]
}
```

**Generated Files**:
- `src/components/LoadingSpinner/LoadingSpinner.tsx`
- `src/components/LoadingSpinner/LoadingSpinner.module.css`
- `src/components/LoadingSpinner/LoadingSpinner.test.tsx`
- `src/components/LoadingSpinner/index.ts`

**Sample Generated Code**:
```tsx
// LoadingSpinner.tsx
import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#007bff',
  className = ''
}) => {
  return (
    <div 
      className={`${styles.spinner} ${styles[size]} ${className}`}
      style={{ borderTopColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
};
```

### Example 2: API Endpoint Creation

**Scenario**: Create a REST API endpoint for user management.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Create user management API endpoints" --type api --priority high
```

**Generated Files**:
- `src/api/routes/users.js`
- `src/api/controllers/userController.js`
- `src/api/middleware/userValidation.js`
- `src/api/models/User.js`
- `tests/api/users.test.js`

**Sample Generated Code**:
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateUserId } = require('../middleware/userValidation');

router.get('/', userController.getAllUsers);
router.get('/:id', validateUserId, userController.getUserById);
router.post('/', validateUser, userController.createUser);
router.put('/:id', validateUserId, validateUser, userController.updateUser);
router.delete('/:id', validateUserId, userController.deleteUser);

module.exports = router;
```

### Example 3: Bug Fix Implementation

**Scenario**: Fix a memory leak in a data processing component.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Fix memory leak in DataProcessor component" --type bugfix --priority high
```

**Generated Analysis**:
```json
{
  "issueAnalysis": {
    "problem": "Memory leak in DataProcessor due to uncleaned event listeners",
    "rootCause": "Event listeners not removed in component cleanup",
    "impact": "High - causes browser slowdown over time",
    "solution": "Add proper cleanup in useEffect return function"
  },
  "changes": [
    {
      "file": "src/components/DataProcessor.tsx",
      "type": "modification",
      "description": "Add cleanup for event listeners and timers"
    }
  ]
}
```

## Advanced Workflows

### Example 4: Multi-Component Feature

**Scenario**: Implement a complete user authentication system.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Implement complete user authentication system with login, register, and password reset" --type feature --priority high --interactive
```

**Interactive Prompts**:
```
? Feature type: feature
? Priority: high
? Include social login? Yes
? Include two-factor authentication? Yes
? Database type: PostgreSQL
? Frontend framework: React
? State management: Redux Toolkit
```

**Generated Task Plan**:
```json
{
  "phases": [
    {
      "name": "Backend Authentication",
      "tasks": [
        "Create user model and database schema",
        "Implement JWT authentication middleware",
        "Create auth routes (login, register, logout)",
        "Add password hashing and validation",
        "Implement password reset functionality"
      ]
    },
    {
      "name": "Frontend Components",
      "tasks": [
        "Create login form component",
        "Create registration form component",
        "Create password reset component",
        "Implement auth context and hooks",
        "Add protected route wrapper"
      ]
    },
    {
      "name": "Social Authentication",
      "tasks": [
        "Integrate Google OAuth",
        "Integrate GitHub OAuth",
        "Create social login buttons"
      ]
    }
  ],
  "estimatedHours": 24,
  "complexity": "high"
}
```

### Example 5: Database Migration

**Scenario**: Add new fields to existing database tables.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Add user preferences and notification settings to user table" --type refactor --priority medium
```

**Generated Migration**:
```sql
-- migrations/add_user_preferences.sql
ALTER TABLE users 
ADD COLUMN preferences JSONB DEFAULT '{}',
ADD COLUMN notification_settings JSONB DEFAULT '{
  "email": true,
  "push": true,
  "sms": false
}',
ADD COLUMN created_preferences_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for preferences queries
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
```

## Real-World Scenarios

### Example 6: E-commerce Product Catalog

**Scenario**: Build a product catalog with search and filtering.

**Feature Request**:
```
As an e-commerce customer, I want to browse and search products with filters 
so that I can find items that match my preferences quickly.

Requirements:
- Product grid with pagination
- Search by name and description
- Filter by category, price range, brand
- Sort by price, popularity, rating
- Responsive design for mobile
```

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Build product catalog with search and filtering" --type feature --priority high
```

**Generated Components**:
- `ProductCatalog.tsx` - Main catalog container
- `ProductGrid.tsx` - Product display grid
- `ProductCard.tsx` - Individual product card
- `SearchBar.tsx` - Search input component
- `FilterPanel.tsx` - Filtering controls
- `SortDropdown.tsx` - Sorting options
- `Pagination.tsx` - Page navigation

### Example 7: Real-time Chat System

**Scenario**: Implement a real-time chat system with WebSocket.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Implement real-time chat system with WebSocket support" --type feature --priority high
```

**Generated Architecture**:
```
Backend:
├── websocket/
│   ├── chatServer.js
│   ├── messageHandler.js
│   └── roomManager.js
├── models/
│   ├── Message.js
│   └── ChatRoom.js
└── routes/
    └── chat.js

Frontend:
├── components/
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   └── UserList.tsx
├── hooks/
│   ├── useWebSocket.ts
│   └── useChat.ts
└── context/
    └── ChatContext.tsx
```

### Example 8: Performance Optimization

**Scenario**: Optimize a slow-loading dashboard.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Optimize dashboard performance by implementing lazy loading and memoization" --type refactor --priority high
```

**Generated Optimizations**:
```tsx
// Before: Heavy dashboard component
const Dashboard = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetchAllData().then(setData);
  }, []);
  
  return (
    <div>
      {data.map(item => <ExpensiveComponent key={item.id} data={item} />)}
    </div>
  );
};

// After: Optimized with lazy loading and memoization
const Dashboard = () => {
  const [visibleItems, setVisibleItems] = useState(10);
  const { data, loading } = useInfiniteQuery('dashboard-data');
  
  const MemoizedComponent = useMemo(() => 
    React.memo(ExpensiveComponent), []
  );
  
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <VirtualizedList
          items={data.slice(0, visibleItems)}
          renderItem={(item) => (
            <MemoizedComponent key={item.id} data={item} />
          )}
          onLoadMore={() => setVisibleItems(prev => prev + 10)}
        />
      </Suspense>
    </div>
  );
};
```

## Integration Examples

### Example 9: Third-Party API Integration

**Scenario**: Integrate with Stripe payment processing.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Integrate Stripe payment processing with subscription management" --type feature --priority high
```

**Generated Integration**:
```javascript
// services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createCustomer(email, name) {
    return await stripe.customers.create({
      email,
      name,
      metadata: { source: 'autopilot-integration' }
    });
  }
  
  async createSubscription(customerId, priceId) {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });
  }
  
  async handleWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}
```

### Example 10: Microservice Communication

**Scenario**: Add service-to-service communication with message queues.

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Implement microservice communication using RabbitMQ message queues" --type feature --priority medium
```

**Generated Message Queue Setup**:
```javascript
// services/messageQueue.js
const amqp = require('amqplib');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
  }
  
  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    // Declare exchanges and queues
    await this.channel.assertExchange('user.events', 'topic', { durable: true });
    await this.channel.assertQueue('user.created', { durable: true });
    await this.channel.bindQueue('user.created', 'user.events', 'user.created');
  }
  
  async publishUserCreated(userData) {
    const message = JSON.stringify({
      event: 'user.created',
      data: userData,
      timestamp: new Date().toISOString()
    });
    
    return this.channel.publish(
      'user.events',
      'user.created',
      Buffer.from(message),
      { persistent: true }
    );
  }
  
  async subscribeToUserEvents(callback) {
    await this.channel.consume('user.created', async (msg) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        await callback(data);
        this.channel.ack(msg);
      }
    });
  }
}
```

## Troubleshooting Examples

### Example 11: Debugging Failed Validation

**Scenario**: Validation pipeline fails during code generation.

**Problem**:
```bash
❌ Validation failed: ESLint errors found
❌ Validation failed: Tests not passing
```

**Solution Steps**:

1. **Check validation details**:
```bash
node scripts/autopilot-cli.mjs validate --detailed
```

2. **Review specific errors**:
```bash
# Check ESLint errors
npx eslint src/components/NewComponent.tsx

# Run specific tests
npm test -- NewComponent.test.tsx
```

3. **Fix and regenerate**:
```bash
# Fix the issues manually or regenerate with fixes
node scripts/autopilot-cli.mjs code --plan .autopilot/task-plan.json --fix-validation
```

### Example 12: Handling Complex Dependencies

**Scenario**: Generated code has circular dependencies.

**Problem**:
```
Error: Circular dependency detected:
  ComponentA -> ComponentB -> ComponentC -> ComponentA
```

**Solution**:

1. **Analyze dependency graph**:
```bash
node scripts/autopilot-cli.mjs plan --analyze-dependencies
```

2. **Refactor with dependency injection**:
```typescript
// Before: Circular dependency
// ComponentA imports ComponentB
// ComponentB imports ComponentC  
// ComponentC imports ComponentA

// After: Dependency injection pattern
interface ComponentDependencies {
  componentB: ComponentBInterface;
  componentC: ComponentCInterface;
}

class ComponentA {
  constructor(private deps: ComponentDependencies) {}
  
  render() {
    return this.deps.componentB.render();
  }
}
```

### Example 13: Performance Issues

**Scenario**: Generated code causes performance problems.

**Problem**:
```
Warning: Component re-renders too frequently
Warning: Large bundle size detected
```

**Solution**:

1. **Run performance analysis**:
```bash
node scripts/autopilot-cli.mjs validate --gates performance
```

2. **Apply optimizations**:
```typescript
// Add memoization
const OptimizedComponent = React.memo(OriginalComponent, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// Implement code splitting
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

## Best Practices

### 1. Feature Request Writing

**Good Example**:
```
As a user, I want to filter products by multiple criteria simultaneously 
so that I can find exactly what I'm looking for quickly.

Acceptance Criteria:
- Given I'm on the product page, when I select multiple filters, then products should update in real-time
- Given I have filters applied, when I clear them, then all products should be shown again
- Given I'm on mobile, when I open filters, then they should be in a slide-out panel

Technical Requirements:
- Use URL parameters to maintain filter state
- Implement debounced search for performance
- Support keyboard navigation
- Ensure accessibility compliance
```

**Poor Example**:
```
Add filters to products
```

### 2. Iterative Development

**Approach**:
```bash
# Start with basic functionality
node scripts/autopilot-cli.mjs run --feature "Basic product filtering by category"

# Add more features incrementally  
node scripts/autopilot-cli.mjs run --feature "Add price range filter to existing product filters"

# Enhance with advanced features
node scripts/autopilot-cli.mjs run --feature "Add search suggestions and autocomplete to product filters"
```

### 3. Testing Strategy

**Generated Test Structure**:
```typescript
describe('ProductFilter', () => {
  describe('Category Filtering', () => {
    it('should filter products by selected category', () => {
      // Test implementation
    });
    
    it('should handle multiple category selection', () => {
      // Test implementation  
    });
  });
  
  describe('Price Range Filtering', () => {
    it('should filter products within price range', () => {
      // Test implementation
    });
  });
  
  describe('Integration Tests', () => {
    it('should work with search functionality', () => {
      // Test implementation
    });
  });
});
```

---

These examples demonstrate the versatility and power of the Spec-to-Code Autopilot system across different development scenarios. Each example shows how the system adapts to different requirements and generates appropriate code structures, tests, and documentation.

For more examples and use cases, check the `examples/` directory in the project repository.