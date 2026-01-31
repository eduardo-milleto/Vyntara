# Vyntara

Vyntara is a professional investigation and research platform designed for comprehensive data gathering and analysis. The system integrates with multiple external data sources to provide accurate, verified information for investigative purposes.

[![CI/CD Pipeline](https://github.com/eduardo-milleto/Vyntara/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardo-milleto/Vyntara/actions)
[![Code Quality](https://github.com/eduardo-milleto/Vyntara/actions/workflows/quality.yml/badge.svg)](https://github.com/eduardo-milleto/Vyntara/actions)

---

## Overview

The platform connects to the following services:

- Google Search API and Custom Search Engine
- Escavador (Brazilian legal and business data)
- Google Vertex AI for natural language processing
- Meta Ads API for advertising insights
- Datajud (Brazilian judicial records)
- Mercado Pago for payment processing
- WhatsApp Business API for notifications

## Features

**Search and Data Collection**
The system performs advanced searches across multiple engines simultaneously, aggregating results from various sources into a unified report.

**AI-Powered Analysis**
Integration with Google Gemini enables intelligent processing of collected data, identifying patterns and generating structured insights.

**Report Generation**
Automated HTML report generation with evidence filtering, confidence scoring, and source attribution.

**Payment Processing**
Full integration with Mercado Pago supporting credit cards, PIX, and boleto payment methods.

**Notification System**
WhatsApp Business integration for real-time status updates and report delivery.

**Performance Optimization**
Built-in caching layer to reduce API calls and improve response times for repeated queries.

**Security**
Automatic redaction of sensitive data in logs and audit trails.

## Project Structure

```
vyntara/
├── backend/
│   ├── integrations/       External API adapters
│   ├── routes/             HTTP endpoint definitions
│   ├── services/           Core business logic
│   └── package.json
├── frontend/
│   ├── vyntara/            Main application
│   ├── pagamento/          Payment interface
│   └── meta/               Meta Ads dashboard
├── public/                 Static assets
└── .github/workflows/      CI/CD configuration
```

## Requirements

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/eduardo-milleto/Vyntara.git
cd Vyntara
npm run install:all
```

Copy the environment template and configure your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys and database connection strings. This file is excluded from version control.

## Development

Start the development server with hot reloading:

```bash
npm run dev
```

Run the test suite:

```bash
npm run test
npm run test -- --coverage
```

Check code quality:

```bash
npm run lint
npm run format:check
```

## Build and Deployment

Generate production builds:

```bash
npm run build:all
```

For detailed deployment instructions, including Docker configuration and cloud provider setup, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and component overview
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guidelines for contributors
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment procedures
- [SECURITY.md](SECURITY.md) - Security policies and best practices

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- Automated test execution on all pull requests
- Static code analysis and linting
- Test coverage reporting
- Automated deployment to staging on merge to main
- Production deployment on tagged releases
- Security scanning with SAST tools

Configuration files are located in `.github/workflows/`.

## Monitoring

The application supports integration with common monitoring tools:

- Logging: CloudWatch, ELK Stack
- Metrics: Prometheus, Datadog
- Error Tracking: Sentry
- APM: New Relic

## Support

For bug reports and feature requests, open an issue at [GitHub Issues](https://github.com/eduardo-milleto/Vyntara/issues).

Include the following information:
- Description of the issue
- Steps to reproduce
- Node.js and npm versions
- Relevant log output (with sensitive data removed)

## License

Proprietary. All rights reserved.

---

Last updated: January 2026

