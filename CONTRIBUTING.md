# BHD Oman Marketplace - Contributing Guide

<div align="center">

![Contributing](https://img.shields.io/badge/CONTRIBUTING-GUIDE-9B59B6?style=for-the-badge)
![Welcome](https://img.shields.io/badge/PRs-Welcome-2ECC71?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-E67E22?style=for-the-badge)

**Guidelines for contributing to BHD Oman Marketplace**

</div>

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How to Contribute](#-how-to-contribute)
- [Development Workflow](#-development-workflow)
- [Branch Naming Convention](#-branch-naming-convention)
- [Commit Message Format](#-commit-message-format)
- [Pull Request Process](#-pull-request-process)
- [Code Review Guidelines](#-code-review-guidelines)
- [Testing Requirements](#-testing-requirements)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Expected Behavior:**
- Be respectful and inclusive in all interactions
- Provide constructive feedback and accept it graciously
- Focus on what's best for the community and the project
- Show empathy towards others
- Be patient with newcomers
- Help others learn and grow

**Unacceptable Behavior:**
- Harassment, discrimination, or intimidation of any kind
- Trolling, insulting/derogatory comments, or personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct that could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at **conduct@bhd.om**. All complaints will be reviewed and investigated promptly and fairly.

---

## 🚀 How to Contribute

### Ways to Contribute

| Contribution Type | Description | Difficulty |
|-------------------|-------------|------------|
| 🐛 **Bug Reports** | Report issues you encounter | Easy |
| 📝 **Documentation** | Improve docs, add translations | Easy |
| 💡 **Feature Requests** | Suggest new features or improvements | Easy |
| 🔧 **Bug Fixes** | Fix existing issues | Medium |
| ✨ **New Features** | Implement new functionality | Hard |
| 🧪 **Tests** | Add or improve test coverage | Medium |
| 🎨 **UI/UX** | Improve user interface and experience | Medium |
| 🌍 **Translations** | Add or improve translations | Easy |
| ⚡ **Performance** | Optimize code performance | Hard |

### Before You Start

1. **Check existing issues**: Look at [GitHub Issues](https://github.com/bhd-oman/marketplace/issues) to avoid duplicates
2. **Start a discussion**: For major features, open a discussion first
3. **Read the docs**: Familiarize yourself with [SETUP.md](./SETUP.md) and [API.md](./API.md)
4. **Set up your environment**: Follow the setup guide

### First-Time Contributors

We welcome first-time contributors! Look for issues labeled:

- `good first issue` - Simple tasks for beginners
- `help wanted` - Tasks where we need community help
- `documentation` - Improve docs without coding

---

## 🔄 Development Workflow

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/marketplace.git
cd marketplace

# Add upstream remote
git remote add upstream https://github.com/bhd-oman/marketplace.git
```

### 2. Set Up Development Environment

```bash
# Follow the setup guide
cat SETUP.md

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Run tests to ensure everything works
npm test
```

### 3. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feat/your-feature-name
```

### 4. Make Changes

```bash
# Write code following our standards
# Write tests for new features
# Update documentation as needed

# Run tests frequently
npm run test:watch

# Check code formatting
npm run lint

# Fix any issues
npm run lint:fix
```

### 5. Commit and Push

```bash
# Stage changes
git add .

# Commit with proper format
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feat/your-feature-name
```

### 6. Create Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch and fill out the PR template
- Wait for code review

### Workflow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Fork Repo   │────▶│  Clone Fork  │────▶│  Set Up Dev  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
┌──────────────┐     ┌──────────────┐     ┌─────▼────────┐
│  PR Merged!  │────▶│  Address     │◀────│  Create      │
│  🎉          │     │  Review      │     │  Feature     │
└──────────────┘     └──────┬───────┘     │  Branch      │
                            │              └──────┬───────┘
                     ┌──────▼──────┐              │
                     │  Push &     │◀─────────────┘
                     │  Create PR  │
                     └─────────────┘
```

---

## 🌿 Branch Naming Convention

### Format

```
<type>/<short-description>
```

### Types

| Type | Prefix | Description | Example |
|------|--------|-------------|---------|
| Feature | `feat/` | New feature or capability | `feat/ai-chat-assistant` |
| Bug Fix | `fix/` | Bug fix | `fix/payment-webhook` |
| Documentation | `docs/` | Documentation changes | `docs/api-examples` |
| Style | `style/` | Code style (formatting) | `style/lint-frontend` |
| Refactor | `refactor/` | Code refactoring | `refactor/user-service` |
| Performance | `perf/` | Performance improvements | `perf/query-optimization` |
| Test | `test/` | Adding or updating tests | `test/auth-unit-tests` |
| Chore | `chore/` | Build/config changes | `chore/update-deps` |
| Security | `security/` | Security improvements | `security/jwt-validation` |
| Hotfix | `hotfix/` | Critical production fix | `hotfix/login-crash` |

### Examples

```bash
# Good branch names
git checkout -b feat/product-recommendations
git checkout -b fix/cart-coupon-calculation
git checkout -b docs/deployment-guide
git checkout -b perf/database-indexing
git checkout -b test/order-service-tests

# Bad branch names
git checkout -b my-feature          # Missing type
git checkout -b feature             # Too vague
git checkout -b fix-bug-123         # Inconsistent format
git checkout -b john-branch         # Not descriptive
```

---

## 📝 Commit Message Format

We follow the **Conventional Commits** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OTP login` |
| `fix` | Bug fix | `fix(cart): resolve coupon calculation error` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Code style | `style(frontend): format with prettier` |
| `refactor` | Refactoring | `refactor(api): simplify error handling` |
| `perf` | Performance | `perf(db): add indexes to products table` |
| `test` | Tests | `test(auth): add unit tests for JWT service` |
| `chore` | Maintenance | `chore(deps): update prisma to v5` |
| `ci` | CI/CD | `ci(github): add automated testing` |
| `build` | Build system | `build(docker): optimize image size` |
| `revert` | Revert commit | `revert: feat(auth): add OTP login` |

### Scopes

| Scope | Description |
|-------|-------------|
| `auth` | Authentication & authorization |
| `users` | User management |
| `stores` | Store management |
| `products` | Product catalog |
| `orders` | Order processing |
| `cart` | Shopping cart |
| `payments` | Payment processing |
| `shipping` | Shipping & logistics |
| `chat` | Chat system |
| `ai` | AI services |
| `api` | API general |
| `frontend` | Frontend application |
| `backend` | Backend application |
| `db` | Database |
| `ci` | CI/CD pipeline |
| `deps` | Dependencies |
| `*` | Multiple scopes |

### Examples

```bash
# Simple commit
git commit -m "feat(auth): add password reset via email"

# Commit with body
git commit -m "feat(payments): integrate Thawani payment gateway

- Add Thawani client configuration
- Implement checkout session creation
- Add webhook handler for payment status
- Add unit tests for payment flow

Closes #234"

# Commit with breaking change
git commit -m "feat(api)!: redesign product response format

BREAKING CHANGE: Product response now includes 'variants' array
instead of flat 'options' object. Update frontend accordingly."

# Commit referencing issue
git commit -m "fix(cart): resolve duplicate items on merge

Cart merge now correctly deduplicates items by variant.

Fixes #456"
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to" not "moves cursor to")
- Limit first line to 72 characters
- Reference issues and PRs in footer
- Be specific and descriptive

---

## 🔀 Pull Request Process

### PR Template

When creating a PR, fill out this template:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Fixes # (issue number)
Closes # (issue number)
Related to # (issue number)

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Browser testing

Describe the tests you ran:

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have made corresponding docs changes
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass
- [ ] Any dependent changes have been merged
```

### PR Process Steps

1. **Create PR**: Fill out the template completely
2. **Automated Checks**: CI pipeline runs tests and linting
3. **Code Review**: At least 1 approval required
4. **Address Feedback**: Make requested changes
5. **Merge**: Squash and merge by maintainer

### PR Size Guidelines

| Size | Lines Changed | Review Time |
|------|--------------|-------------|
| Small | < 100 | 15-30 min |
| Medium | 100-500 | 30-60 min |
| Large | 500-1000 | 1-2 hours |
| X-Large | > 1000 | Consider splitting |

---

## 👀 Code Review Guidelines

### For Reviewers

**Review Checklist:**
- [ ] Code follows style guidelines
- [ ] Logic is correct and efficient
- [ ] Tests are included and pass
- [ ] No security vulnerabilities
- [ ] Documentation is updated
- [ ] No console.log or debug code left
- [ ] Error handling is proper
- [ ] No hardcoded values (use env vars)

**Review Communication:**
- Be respectful and constructive
- Explain why changes are requested
- Suggest specific improvements
- Acknowledge good work
- Use "Consider..." for suggestions
- Use "Must..." for required changes

### Review Example Comments

```
✅ Good: "Clean implementation! I like the use of early returns."

⚠️ Suggestion: "Consider extracting this into a separate function 
for better readability."

❌ Required: "Need to add input validation here to prevent 
SQL injection."

💡 Question: "Why did you choose this approach over using 
the existing utility?"
```

### For Authors

- Respond to all comments
- Make requested changes promptly
- Ask questions if feedback is unclear
- Don't take feedback personally
- Learn from suggestions

---

## 🧪 Testing Requirements

### Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Backend Services | 80% |
| API Controllers | 75% |
| Database Models | 70% |
| Frontend Components | 70% |
| Utility Functions | 90% |
| Critical Paths | 100% |

### Test Types

#### Unit Tests

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, ...],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Secure123!',
        firstName: 'Test',
        lastName: 'User',
      };
      
      const result = await service.register(dto);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(dto.email);
      expect(result.user.password).not.toBe(dto.password); // Should be hashed
    });
    
    it('should throw error for duplicate email', async () => {
      await expect(service.register(existingUserDto))
        .rejects.toThrow(ConflictException);
    });
  });
});
```

#### Integration Tests

```typescript
// products.controller.spec.ts
describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = module.createNestApplication();
    await app.init();
  });
  
  it('GET /products - should return paginated products', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products?page=1&limit=10')
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(10);
  });
  
  afterAll(async () => {
    await app.close();
  });
});
```

#### Frontend Component Tests

```typescript
// ProductCard.test.tsx
describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: 'test.jpg',
    rating: 4.5,
  };
  
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('99.99 OMR')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });
  
  it('calls onAddToCart when button clicked', () => {
    const mockAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend
npm run test           # Unit tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage
npm run test:e2e       # End-to-end tests

# Frontend tests
cd frontend
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage

# All tests with coverage
npm run test:all
```

---

## 📚 Resources

### Documentation
- [SETUP.md](./SETUP.md) - Development environment setup
- [API.md](./API.md) - API documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [SECURITY.md](./SECURITY.md) - Security documentation

### Tools
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

### Community
- [Discord](https://discord.gg/bhdoman)
- [GitHub Discussions](https://github.com/bhd-oman/marketplace/discussions)

---

## ❓ Questions?

If you have questions or need help:

1. Check existing [documentation](./README.md)
2. Search [GitHub Issues](https://github.com/bhd-oman/marketplace/issues)
3. Join our [Discord](https://discord.gg/bhdoman)
4. Email: **dev@bhd.om**

---

<div align="center">

**Thank you for contributing!** 🎉

Made with ❤️ in 🇴🇲 Oman

</div>
