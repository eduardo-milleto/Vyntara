# Vyntara - Setup Profissional

## 📋 Checklist de Configuração Inicial

Este documento guia você através da configuração profissional completa do projeto Vyntara.

### ✅ Passos Obrigatórios

#### 1. GitHub Repository
- [ ] Criar repositório no GitHub
- [ ] Configurar branch protection em `main`
  - [ ] Requer 1 aprovação em PR
  - [ ] Requer status checks passando
  - [ ] Requer branches atualizadas
- [ ] Configurar Dependabot para dependências
- [ ] Configurar GitHub Secrets

#### 2. GitHub Secrets
Adicionar os seguintes secrets em Settings > Secrets and variables > Actions:

```
# Deployments
STAGING_DEPLOY_KEY        # SSH private key para staging
STAGING_DEPLOY_HOST       # Host de staging
STAGING_DEPLOY_USER       # Usuário SSH de staging
PROD_DEPLOY_KEY           # SSH private key para prod
PROD_DEPLOY_HOST          # Host de produção
PROD_DEPLOY_USER          # Usuário SSH de produção

# Database
PROD_DB_HOST              # Host do banco prod
PROD_DB_USER              # Usuário do banco prod
PROD_DB_PASSWORD          # Senha do banco prod

# Container Registry
REGISTRY_USERNAME         # Username do registry (Docker Hub/ECR/etc)
REGISTRY_PASSWORD         # Password do registry

# Code Quality
SONAR_TOKEN              # SonarCloud token
SNYK_TOKEN               # Snyk security token

# Notifications
SLACK_WEBHOOK            # Slack webhook para notificações
```

#### 3. Variáveis de Ambiente
- [ ] Criar `.env.local` a partir de `.env.example`
- [ ] Preencher todas as API keys
- [ ] Testar conexão com banco de dados
- [ ] Verificar que não há `.env.local` em git

#### 4. Dependências Iniciais
```bash
# Instalar dependências globais
npm run install:all

# Instalar Git Hooks (Husky)
npm install husky --save-dev
npx husky install

# Instalar dependências de desenvolvimento
npm install --save-dev \
  eslint \
  prettier \
  jest \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  detect-secrets \
  concurrently

# Backend
npm install --prefix backend --save-dev \
  jest \
  @types/jest \
  supertest \
  dotenv

# Frontend  
npm install --prefix frontend/vyntara --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  ts-jest
```

#### 5. Database Setup
```bash
# Inicializar banco de dados local
docker-compose up -d postgres

# Criar tabelas (quando migrations forem criadas)
npm run migrate

# Seed dados de teste (opcional)
npm run seed
```

#### 6. Primeira Execução
```bash
# Instalar tudo
npm run install:all

# Verificar linting
npm run lint

# Rodar testes
npm run test

# Build
npm run build:all

# Executar localmente
docker-compose up
```

### 📊 Integrações Recomendadas

#### Code Quality
- [ ] **SonarCloud** (análise de código)
  - Conectar repositório
  - Copiar token para SONAR_TOKEN secret
  
- [ ] **Codecov** (cobertura de testes)
  - Ativar para repositório
  - Comentários automáticos em PRs

- [ ] **Snyk** (segurança)
  - Authorizar com GitHub
  - Ativar automatic fixes

#### Monitoring
- [ ] **Sentry** (error tracking)
  - Criar projeto
  - Adicionar DSN em .env

- [ ] **Datadog** ou **New Relic** (APM)
  - Configurar agentes
  - Adicionar credenciais em .env

#### CI/CD
- [ ] **GitHub Actions** (already configured)
  - Verificar workflows em `.github/workflows/`
  
- [ ] **Docker Hub** ou **ECR** (image registry)
  - Criar repositórios
  - Adicionar credenciais em secrets

### 🚀 Primeira Release

1. **Prepare Release**
   ```bash
   # Atualizar versão
   npm version minor  # ou major/patch
   
   # Push com tags
   git push origin main --tags
   ```

2. **Verify Deployment**
   - Verificar workflow em GitHub Actions
   - Monitorar health checks
   - Testar endpoints críticos

3. **Post-Deployment**
   - Verificar logs
   - Monitorar métricas
   - Comunicar ao time

### 📝 Documentação Importante

Leia estes arquivos antes de começar:

1. [README.md](../README.md) - Visão geral do projeto
2. [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitetura do sistema
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - Como contribuir
4. [SECURITY.md](../SECURITY.md) - Políticas de segurança
5. [DEPLOYMENT.md](../DEPLOYMENT.md) - Deploy em produção

### 🔐 Segurança Inicial

```bash
# Detectar secrets em histórico
npm install -g detect-secrets
detect-secrets scan --baseline .secrets.baseline

# Configurar pre-commit hooks
npm install husky lint-staged -D
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# Verificar vulnerabilidades
npm audit
npm audit fix
```

### 📌 Próximos Passos

1. Comunicar ao time o setup completo
2. Criar primeiras issues no GitHub
3. Definir sprint inicial
4. Onboarding de novos desenvolvedores
5. Configurar backups automáticos
6. Estabelecer SLAs de resposta

---

**Status**: 🟢 Pronto para produção
**Data**: 2026-01-31
