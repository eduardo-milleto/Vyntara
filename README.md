# Vyntara - Professional Investigation Platform

[![CI/CD Pipeline](https://github.com/eduardo-milleto/Vyntara/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardo-milleto/Vyntara/actions)
[![Code Quality](https://github.com/eduardo-milleto/Vyntara/actions/workflows/quality.yml/badge.svg)](https://github.com/eduardo-milleto/Vyntara/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-PROPRIETARY-red)](LICENSE)

## 📋 Description

Vyntara is a professional investigation and research platform integrated with multiple data sources, including:
- Google Search API
- Escavador
- Vertex AI
- Meta Ads
- Datajud
- Mercado Pago (Payments)

## 🚀 Key Features

- **Advanced Search**: Integration with multiple search engines
- **Data Analysis**: Information processing with AI (Gemini)
- **Reports**: HTML report generation with evidence filtering
- **Payments**: Mercado Pago integration
- **WhatsApp**: WhatsApp integration for notifications
- **Cache**: Caching system for performance optimization
- **Security**: Sensitive data redaction in logs

## 📦 Project Structure

```
vyntara/
├── backend/                 # Node.js API
│   ├── integrations/       # External integrations
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── package.json
├── frontend/
│   ├── vyntara/            # Main app
│   ├── pagamento/          # Payment module
│   └── meta/               # Meta Ads integration
├── public/                 # Compiled static files
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/eduardo-milleto/Vyntara.git
cd Vyntara

# Install all dependencies
npm run install:all

# Configure environment variables
cp .env.example .env.local
```

## 📖 Documentation

See the following documents for more information:

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [SECURITY.md](SECURITY.md) - Security policies
- [API.md](docs/API.md) - API documentation

## 🧪 Tests

```bash
# Run all tests
npm run test

# Tests with coverage
npm run test -- --coverage

# Tests in watch mode
npm run test -- --watch

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## 🔍 Linting & Formatting

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

## 🚢 Build & Deployment

```bash
# Build all packages
npm run build:all

# Specific build
npm run build --prefix backend
npm run build --prefix frontend/vyntara
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Never commit `.env` - use `git-secrets` or `pre-commit` hooks to prevent leaks.

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for:
- ✅ Automated tests on each PR
- ✅ Linting and code analysis
- 📊 Coverage reports
- 🚀 Automatic deployment to staging and production
- 🔒 Security verification (SAST)

See [.github/workflows](.github/workflows/) for detailed configuration.

## 📊 Monitoring

- **Logs**: CloudWatch / ELK Stack
- **Metrics**: Prometheus / Datadog
- **Errors**: Sentry
- **Performance**: New Relic

## 🐛 Report Issues

Open an issue at [GitHub Issues](https://github.com/eduardo-milleto/Vyntara/issues) with:
- Clear problem description
- Steps to reproduce
- Node.js version
- Relevant logs (with sensitive data removed)

## 📝 License

PROPRIETARY - All rights reserved

## 👥 Contributors

- Vyntara Team

---

**Last updated**: 2026-01-31

