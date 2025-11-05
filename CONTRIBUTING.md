# Contributing to Salesforce CLI Dotenv Plugin

Thank you for your interest in contributing to the Salesforce CLI Dotenv Plugin! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Salesforce CLI installed globally

### Development Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/yourusername/sf-dotenv-cli-plugin.git
   cd sf-dotenv-cli-plugin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run compile
   ```

4. Link the plugin locally:

   ```bash
   npm link
   ```

5. Test the installation:
   ```bash
   sf dotenv --help
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Build the project:

   ```bash
   npm run compile
   ```

4. Run tests:

   ```bash
   npm test
   ```

5. Run linting:

   ```bash
   npm run lint
   ```

6. Format code:
   ```bash
   npm run format
   ```

### Testing

The project uses Jest for testing. Test files should be placed in `src/**/*.test.ts`.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in debug mode
npm run test:debug
```

### Code Quality

- Run ESLint to check code quality:

  ```bash
  npm run lint
  npm run lint:fix
  ```

- Run Prettier to format code:
  ```bash
  npm run format
  npm run format:check
  ```

## Project Structure

```
sf-dotenv-cli-plugin/
├── src/
│   ├── commands/
│   │   ├── dotenv.ts              # Main command implementation
│   │   └── __tests__/
│   │       └── dotenv.test.ts     # Tests for the command
│   └── index.ts                   # Plugin entry point
├── scripts/
│   ├── install.js                 # Development installation script
│   └── demo.js                    # Demo script
├── package.json                   # Project configuration
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── jest.config.js                  # Jest configuration
├── README.md                      # Project documentation
├── LICENSE                        # Apache 2.0 license
└── CONTRIBUTING.md                # This file
```

## Pull Request Guidelines

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run the test suite** and ensure all tests pass
6. **Submit a pull request** with a clear description of your changes

### Pull Request Checklist

- [ ] Code follows the project's coding standards
- [ ] Tests are included and pass
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with the main branch

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Follow strict TypeScript configuration
- Use proper type annotations
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Use trailing commas in objects and arrays
- Maximum line length of 100 characters

### Git Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build or tool changes

## Issues and Bug Reports

When reporting issues:

1. Use the GitHub issue template
2. Provide clear steps to reproduce the issue
3. Include relevant environment information
4. Add error messages and logs if applicable

## Questions and Support

- Create an issue for questions or support
- Check existing issues before creating new ones
- Be respectful and helpful in discussions

## License

By contributing to this project, you agree that your contributions will be licensed under the Apache 2.0 License.

Thank you for contributing! 🎉
