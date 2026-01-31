# 🔐 Segurança

## Política de Segurança

Esta página descreve a política de segurança do Vyntara e como reportar vulnerabilidades.

## ⚠️ Reportar Vulnerabilidades de Segurança

**NÃO abra issues públicas para vulnerabilidades de segurança.**

Em vez disso, envie um email para: **security@vyntara.com** com:

- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sua sugestão de fix (se houver)

Nós responderemos em até 48 horas.

## 🛡️ Padrões de Segurança

### 1. Autenticação

- ✅ Use JWT com expiração
- ✅ Implemente refresh tokens
- ✅ Hash de senhas com bcrypt (min. 12 rounds)
- ✅ Rate limit em endpoints de autenticação
- ❌ Não armazene senhas em plain text
- ❌ Não exponha dados de sessão em URLs

### 2. Autorização

- ✅ Implemente RBAC (Role-Based Access Control)
- ✅ Valide permissões em cada endpoint
- ✅ Use API keys com escopo limitado
- ❌ Não confie apenas em frontend para segurança

### 3. Dados Sensíveis

- ✅ Criptografe dados em repouso
- ✅ Use HTTPS/TLS em trânsito
- ✅ Redija dados sensíveis em logs
- ✅ Implemente access controls apropriados
- ✅ Use environment variables para secrets
- ❌ Não commit .env files
- ❌ Não log senhas, tokens, etc.

### 4. Validação e Sanitização

```javascript
// ✅ Bom
const { body, validationResult } = require('express-validator');

router.post('/search', [
  body('cpf').matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  body('name').trim().isLength({ min: 2, max: 100 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process...
});

// ❌ Evitar
app.get('/search', (req, res) => {
  const cpf = req.query.cpf;
  db.query(`SELECT * FROM users WHERE cpf = '${cpf}'`); // SQL Injection!
});
```

### 5. Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Verificar dependências desatualizadas
npm outdated

# Update seguro
npm update
```

### 6. Segredos

**Gerenciamento de Secrets**:

```bash
# .env.local (NUNCA commit)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
API_KEY_GOOGLE=...
API_KEY_ESCAVADOR=...
```

**GitHub Secrets** para CI/CD:
```yaml
# .github/workflows/deploy.yml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 7. CORS

```javascript
// ✅ Bom - Whitelist específico
const cors = require('cors');
app.use(cors({
  origin: ['https://app.vyntara.com', 'https://staging.vyntara.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// ❌ Evitar - Allow all origins
app.use(cors());
```

### 8. Logging Seguro

```javascript
// ✅ Bom - Redact sensitive data
const { redactForLogs } = require('./redact');

logger.info('User search', {
  userId: user.id,
  document: redactForLogs(cpf), // e.g., '***.***.***-90'
  timestamp: new Date(),
});

// ❌ Evitar - Log tudo
logger.info('User search', {
  userId: user.id,
  cpf: cpf,
  password: user.password,
});
```

## 🔒 Processo de Build Seguro

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

### SAST (Static Application Security Testing)

```yaml
# .github/workflows/security.yml
- name: Run SonarQube
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Dependency Scanning

```yaml
- name: Dependency check
  run: npm audit --audit-level=moderate
```

### Secret Scanning

```bash
# Detectar secrets em commits
npm install -g detect-secrets
detect-secrets scan
```

## 🚨 Resposta a Incidentes

### Processo

1. **Detecção** - Security alert disparado
2. **Investigação** - Avaliar impacto
3. **Containment** - Parar spread
4. **Eradication** - Remover ameaça
5. **Recovery** - Restaurar sistemas
6. **Post-mortem** - Lições aprendidas

### Escalation

- **Crítico** (CVSS >= 9.0): Resposta < 4 horas
- **Alto** (CVSS 7.0-8.9): Resposta < 24 horas
- **Médio** (CVSS 4.0-6.9): Resposta < 1 semana
- **Baixo** (CVSS < 4.0): Resposta em próximo release

## 📋 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Testes passam
- [ ] Linting clean
- [ ] Sem secrets em código
- [ ] Dependências atualizadas
- [ ] Audit npm limpo
- [ ] SAST approval
- [ ] Performance OK
- [ ] Backup realizado
- [ ] Runbook atualizado
- [ ] Rollback plan pronto

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/Top10/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [CWE Top 25](https://cwe.mitre.org/top25/)

## 🔄 Atualizações de Segurança

Monitoramos:
- npm advisory database
- GitHub security alerts
- NIST Vulnerability Database
- Vendor security bulletins

Patches críticos são aplicados imediatamente.

---

**Última atualização**: 2026-01-31

**Próxima revisão de segurança**: 2026-02-28
