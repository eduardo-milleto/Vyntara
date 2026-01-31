# Arquitetura do Sistema Vyntara

## 🏗️ Visão Geral

Vyntara é uma arquitetura de três camadas (3-tier) com separação clara entre frontend, backend e serviços:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Layer                         │
│  ┌──────────┬──────────────┬────────────┐               │
│  │ Vyntara  │  Pagamento   │ Meta Ads   │               │
│  │ (Vite)   │  (Vite)      │ (Vite)     │               │
│  └──────────┴──────────────┴────────────┘               │
├─────────────────────────────────────────────────────────┤
│                   Backend Layer                          │
│  ┌──────────────────────────────────────────┐           │
│  │    Node.js/Express API Server            │           │
│  │  ┌──────────┬──────────────┬──────────┐  │           │
│  │  │ Routes   │ Services     │ Auth     │  │           │
│  │  └──────────┴──────────────┴──────────┘  │           │
│  └──────────────────────────────────────────┘           │
├─────────────────────────────────────────────────────────┤
│              External Integrations                       │
│  ┌─────────┬─────────┬──────────┬──────────┐            │
│  │ Google  │Escavador│ Mercado  │ Meta Ads │            │
│  │ Search  │         │ Pago     │          │            │
│  └─────────┴─────────┴──────────┴──────────┘            │
└─────────────────────────────────────────────────────────┘
```

## 📦 Componentes Principais

### Frontend (3 aplicações Vite)

#### 1. **Vyntara (App Principal)**
- **Tecnologia**: React + TypeScript + Vite
- **UI Framework**: Radix UI + Tailwind CSS
- **Funcionalidades**:
  - Interface de busca avançada
  - Exibição de resultados
  - Filtragem de evidências
  - Relatórios

#### 2. **Pagamento (E-commerce)**
- **Tecnologia**: React + TypeScript + Vite
- **Integração**: Mercado Pago
- **Componentes**:
  - Formulário de Crédito
  - Formulário de PIX
  - Boleto
  - Status de pagamento

#### 3. **Meta Ads**
- **Tecnologia**: React + TypeScript + Vite
- **Funcionalidade**: Integração com Meta Ads API

### Backend (Node.js)

#### Estrutura de Diretórios

```
backend/
├── integrations/          # Adaptadores para APIs externas
│   ├── escavador/
│   ├── google-search/
│   ├── mercadopago/
│   ├── meta/
│   └── vertex/
├── routes/                # Definição de rotas HTTP
│   ├── meta-ads.js
│   └── vyntara.js
└── services/              # Lógica de negócio
    ├── confidence.js      # Cálculo de score de confiança
    ├── config.js          # Configurações
    ├── datajud.js         # Integração Datajud
    ├── escavador.js       # Integração Escavador
    ├── evidenceFilter.js  # Filtro de evidências
    ├── fetchPage.js       # Download de páginas
    ├── gemini.js          # IA (Google Gemini)
    ├── googleAdvancedSearch.js
    ├── redact.js          # Redação de dados sensíveis
    ├── report.js          # Geração de relatórios
    ├── reverseImageSearch.js
    ├── searchCse.js       # Google Custom Search
    ├── transparencia.js   # Dados públicos
    ├── visionSearch.js    # Análise de imagens
    └── vyntara-whatsapp.js # Integração WhatsApp
```

## 🔄 Fluxo de Dados

### Fluxo de Busca Principal

```
1. Frontend → POST /api/search
   ├─ CPF/CNPJ validado
   └─ Enviado para backend

2. Backend → Processamento
   ├─ Verifica Cache (Supabase)
   ├─ Se em cache → retorna
   └─ Se não →

3. Buscas Paralelas
   ├─ Google Search API
   ├─ Escavador
   ├─ Datajud
   ├─ Vertex
   └─ Vision Search

4. Enriquecimento
   ├─ Processamento com Gemini
   ├─ Cálculo de confiança
   └─ Filtragem de evidências

5. Relatório
   ├─ Geração HTML
   └─ Cache + Resposta

6. Frontend → Renderização
   └─ Exibição ao usuário
```

## 🔐 Segurança

### Camadas de Segurança

1. **Autenticação**
   - JWT tokens
   - Session management
   - OAuth2 (Meta, Google)

2. **Autorização**
   - Role-based access control (RBAC)
   - API key management
   - Rate limiting

3. **Dados**
   - Criptografia em trânsito (HTTPS)
   - Criptografia em repouso
   - PII redaction
   - Audit logs

4. **Código**
   - SAST (SonarQube)
   - Dependency scanning
   - Secret scanning

## 📊 Banco de Dados

### Supabase (PostgreSQL)

**Tabelas Principais**:
- `cache_results` - Cache de buscas
- `audit_logs` - Logs de auditoria
- `users` - Dados de usuários
- `subscriptions` - Planos de assinatura
- `payments` - Histórico de pagamentos

## 🚀 Deployment

### Ambientes

- **Development**: Local
- **Staging**: Branch `main` → deploy automático
- **Production**: Tag `v*` → deploy manual com aprovação

### Infraestrutura

```
┌─────────────────────────────────────────┐
│         GitHub Actions CI/CD             │
├─────────────────────────────────────────┤
│  • Build & Test (PR)                    │
│  • Quality Gates                        │
│  • Deploy Staging (push main)           │
│  • Deploy Production (tag v*)           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│       Cloud Provider (AWS/GCP/Azure)     │
├─────────────────────────────────────────┤
│  • Docker Containers                    │
│  • Load Balancer                        │
│  • Auto-scaling                         │
│  • CDN (CloudFront/CloudFlare)          │
└─────────────────────────────────────────┘
```

## 🔧 Tecnologias

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (opcional)
- **Auth**: JWT + OAuth2
- **APIs Externas**: Google, Escavador, Mercado Pago, Meta

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Radix UI
- **Styling**: Tailwind CSS
- **State**: React Context / TanStack Query
- **Testing**: Vitest + React Testing Library

### DevOps
- **CI/CD**: GitHub Actions
- **Container**: Docker
- **Orchestration**: Kubernetes (opcional)
- **Monitoring**: CloudWatch / Datadog
- **Logging**: ELK Stack / CloudWatch

## 📈 Performance

### Otimizações

1. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching estratégico

2. **Backend**
   - Connection pooling
   - Query optimization
   - Redis caching
   - Async/await patterns
   - Rate limiting

3. **API**
   - Pagination
   - Compression (gzip)
   - CDN
   - Parallel requests

## 🧪 Testes

### Estratégia de Testes

```
Unit Tests (70%)
├─ Services
├─ Utilities
└─ Components

Integration Tests (20%)
├─ API routes
├─ Database operations
└─ External API mocks

E2E Tests (10%)
├─ Critical user flows
├─ Payment flow
└─ Search flow
```

## 📝 Versionamento

Segue [Semantic Versioning](https://semver.org/):

```
v{MAJOR}.{MINOR}.{PATCH}
  │       │       └─ Bug fixes
  │       └────── New features
  └───────────── Breaking changes
```

## 🤝 Escalabilidade

### Horizontal

- Stateless backend (horizontally scalable)
- Load balancing
- Database replication

### Vertical

- Caching
- Query optimization
- Async processing
- Worker queues (Bull/BullMQ)

---

**Última atualização**: 2026-01-31
