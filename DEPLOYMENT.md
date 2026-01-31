# 🚀 Guia de Deployment

## Ambientes

O projeto segue um modelo de 3 ambientes:

| Ambiente | Branch | Trigger | Aprovação |
|----------|--------|---------|-----------|
| **Development** | `develop` | Local | N/A |
| **Staging** | `main` | Push | Automático |
| **Production** | Tags `v*` | Manual | Requerida |

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (para containerização)
- AWS CLI / GCP CLI / Azure CLI (conforme provider)
- Git

## 🏗️ Preparação da Aplicação

### 1. Build

```bash
# Instalar dependências
npm run install:all

# Build de todos os pacotes
npm run build:all

# Verificar se algum erro ocorreu
echo $?
```

### 2. Testes

```bash
# Rodar suite completa de testes
npm run test -- --coverage

# Verificar cobertura mínima (80%)
# Report em coverage/ directory
```

### 3. Lint e Qualidade

```bash
# Verificar linting
npm run lint

# Verificar formatting
npm run format:check

# Verificar vulnerabilidades
npm audit
```

## 🐳 Docker Deployment

### Build da Imagem

```bash
# Backend
docker build -f backend/Dockerfile -t vyntara-backend:latest .
docker tag vyntara-backend:latest vyntara-backend:v1.0.0

# Frontend
docker build -f frontend/vyntara/Dockerfile -t vyntara-frontend:latest .
docker tag vyntara-frontend:latest vyntara-frontend:v1.0.0
```

### Push para Registry

```bash
# AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/vyntara-backend:v1.0.0
```

### Run Local

```bash
# Com docker-compose
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

## ☁️ Deployment em Cloud

### AWS (ECS/EKS)

```bash
# Update ECS task definition
aws ecs register-task-definition \
  --family vyntara-backend \
  --container-definitions file://task-def.json \
  --region us-east-1

# Update service
aws ecs update-service \
  --cluster vyntara-prod \
  --service vyntara-backend \
  --force-new-deployment \
  --region us-east-1
```

### GCP (Cloud Run)

```bash
# Deploy Backend
gcloud run deploy vyntara-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated

# Deploy Frontend
gcloud run deploy vyntara-frontend \
  --source frontend/vyntara \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Azure (App Service)

```bash
# Deploy via Azure CLI
az webapp deployment source config-zip \
  --resource-group vyntara-rg \
  --name vyntara-backend \
  --src-path dist.zip

az webapp deployment source config-zip \
  --resource-group vyntara-rg \
  --name vyntara-frontend \
  --src-path dist.zip
```

## 🔧 Configuração de Produção

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/vyntara
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# API Keys
JWT_SECRET=your-very-long-secret-key-here
API_KEY_GOOGLE=...
API_KEY_ESCAVADOR=...
API_KEY_VERTEX=...
API_KEY_META=...

# URLs
APP_URL=https://app.vyntara.com
API_BASE_URL=https://api.vyntara.com
FRONTEND_URL=https://app.vyntara.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=https://...

# Monitoring
DATADOG_API_KEY=...
NEW_RELIC_LICENSE_KEY=...

# Environment
NODE_ENV=production
```

## 🔒 Segurança em Produção

### SSL/TLS

```bash
# Gerar certificado (Let's Encrypt)
certbot certonly --standalone -d api.vyntara.com

# Configurar em nginx
server {
  listen 443 ssl http2;
  server_name api.vyntara.com;

  ssl_certificate /etc/letsencrypt/live/api.vyntara.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.vyntara.com/privkey.pem;
  
  # Strong SSL config
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### Database

```bash
# Backup antes de deploy
pg_dump -h prod-db.example.com -U postgres vyntara > backup-$(date +%Y%m%d-%H%M%S).sql

# Configurar replicação
# Disaster recovery plan

# Encryption at rest
# Enable encryption in cloud provider
```

### Secrets Management

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name vyntara/prod/db_password \
  --secret-string mypassword

# Referência no código
const secret = await secretsManager.getSecret('vyntara/prod/db_password');
```

## 📊 Health Checks

### Configurar Endpoints

```javascript
// backend/routes/health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: process.env.npm_package_version,
  });
});

app.get('/health/deep', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkRedis(),
    externalAPIs: await checkExternalAPIs(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  res.status(healthy ? 200 : 503).json(checks);
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Veja [.github/workflows/](.github/workflows/) para configuração detalhada.

**Fluxo**:

1. **PR**: Testes + Lint + Build
2. **Merge main**: Deploy Staging automático
3. **Tag v***: Build + Push Docker + Deploy Prod com aprovação

## 🔙 Rollback

### Automático

Se health checks falham após deploy:

```bash
# Revert automaticamente
git revert HEAD
npm run build:all
# Re-deploy
```

### Manual

```bash
# Identifique versão anterior
docker images | grep vyntara-backend

# Revert para versão anterior
docker tag vyntara-backend:v1.0.0 vyntara-backend:latest

# Re-deploy com versão anterior
docker-compose up -d
```

## 📈 Monitoring Pós-Deploy

### Verificações Importantes

```bash
# Aplicação rodando
curl https://api.vyntara.com/health

# Métricas
# Acessar Datadog / New Relic dashboard

# Logs
# Acessar CloudWatch / ELK

# Performance
# Verificar P95 latency, error rate, etc.
```

### Alertas

Configure alertas para:
- Error rate > 1%
- Response time > 2s (p95)
- CPU > 80%
- Memory > 85%
- Database connection pool > 80%

## 📝 Runbook de Deploy

### Checklist Pré-Deploy

- [ ] Testes passam 100%
- [ ] Coverage >= 80%
- [ ] Lint clean
- [ ] npm audit sem críticos
- [ ] Backup database realizado
- [ ] Rollback plan pronto
- [ ] Comunicação à equipe
- [ ] Aprovação obtida (prod)

### Checklist Pós-Deploy

- [ ] Health checks OK
- [ ] Aplicação respondendo
- [ ] Logs sem erros críticos
- [ ] Performance normal
- [ ] Features testadas manualmente
- [ ] Alertas não disparados
- [ ] Usuários notificados

## 🆘 Troubleshooting

### Aplicação não inicia

```bash
# Verifique logs
docker logs <container_id>

# Verifique ambiente
docker exec <container_id> env | grep NODE_ENV

# Verifique conectividade
docker exec <container_id> curl http://localhost:3000/health
```

### Banco de dados indisponível

```bash
# Teste conexão
psql -h $DATABASE_HOST -U $DATABASE_USER -d vyntara

# Verifique pool
SELECT count(*) FROM pg_stat_activity;

# Aumente pool se necessário
```

### Memory leak

```bash
# Monitore memória
docker stats <container_id>

# Colete heap dump
node --inspect app.js
# Acesse chrome://inspect
```

## 📞 Suporte

- **Status**: https://status.vyntara.com
- **Issues**: https://github.com/eduardo-milleto/vyntara/issues
- **Slack**: #vyntara-incidents
- **On-call**: PagerDuty

---

**Última atualização**: 2026-01-31
