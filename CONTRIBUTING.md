# Guia de Contribuição

## 📋 Código de Conduta

Este projeto adere a um Código de Conduta que esperamos que todos os contribuidores sigam. Por favor, leia [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## 🚀 Como Contribuir

### 1. Preparar o Ambiente

```bash
# Fork e clone o repositório
git clone https://github.com/yourusername/vyntara.git
cd vyntara

# Instale dependências
npm run install:all

# Configure o Git
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. Criar um Branch

Use a nomenclatura:
```bash
git checkout -b {type}/{description}
```

**Tipos válidos**:
- `feature/` - Nova funcionalidade
- `fix/` - Correção de bug
- `refactor/` - Refatoração sem mudanças externas
- `perf/` - Melhoria de performance
- `docs/` - Documentação
- `test/` - Adição/modificação de testes
- `chore/` - Dependências, configuração, etc.

**Exemplo**:
```bash
git checkout -b feature/add-advanced-search-filters
git checkout -b fix/memory-leak-in-cache
```

### 3. Desenvolvimento

#### Padrões de Código

**JavaScript/TypeScript**:
```javascript
// ✅ Bom
async function searchUser(cpf) {
  const normalized = normalizeCpf(cpf);
  const cachedResult = await getFromCache(normalized);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  const result = await performSearch(normalized);
  await saveToCache(normalized, result);
  
  return result;
}

// ❌ Evitar
function searchUser(cpf) {
  var result = performSearch(cpf);
  return result;
}
```

#### Commits

Use commits semânticos:
```bash
git commit -m "feat: add advanced search filters for personnel"
git commit -m "fix: prevent memory leak in cache service"
git commit -m "docs: update API documentation"
```

**Formato**:
```
{type}({scope}): {description}

{body}

{footer}
```

**Tipos**:
- `feat` - Funcionalidade nova
- `fix` - Correção de bug
- `docs` - Documentação
- `style` - Formatação
- `refactor` - Refatoração
- `perf` - Performance
- `test` - Testes
- `chore` - Build, deps, etc.

**Exemplo completo**:
```
feat(search): add advanced filters for date range

- Add date range picker component
- Implement backend filter logic
- Add tests for date validation

Closes #123
```

### 4. Testes

Todo código novo deve ter testes:

```bash
# Rodar testes
npm run test

# Testes com coverage
npm run test -- --coverage

# Testes específicos
npm run test -- src/services/search.test.js
```

**Cobertura mínima**:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### 5. Linting e Formatação

```bash
# Verificar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format
```

O projeto usa:
- **ESLint** - Análise de código
- **Prettier** - Formatação
- **Husky** - Git hooks
- **lint-staged** - Lint apenas arquivos modificados

### 6. Pull Request

#### Checklist

- [ ] Branch criado a partir de `main`
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Testes passam localmente (`npm run test`)
- [ ] Linting passa (`npm run lint`)
- [ ] Documentação atualizada
- [ ] Sem breaking changes (ou documentado)
- [ ] Commits seguem padrão semântico

#### Template PR

```markdown
## Descrição
Descrição clara do que foi feito.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
Passo a passo para testar as mudanças.

## Screenshots (se aplicável)
Adicione prints das mudanças visuais.

## Checklist
- [ ] Testes adicionados
- [ ] Código revisado
- [ ] Documentação atualizada

## Relacionado
Closes #123
```

## 🔍 Processo de Review

1. **Automático** - CI/CD checks:
   - Build
   - Testes
   - Linting
   - Coverage

2. **Manual** - Revisão de código:
   - Mínimo 1 aprovação
   - Sem conflitos
   - Discussão de design quando necessário

3. **Merge** - Feito por maintainer

## 📚 Documentação

### Quando Documentar

- Novas features públicas
- Mudanças em APIs
- Configurações complexas
- Decisões arquiteturais

### Onde Documentar

- **Código**: JSDoc / comentários inline
- **Projeto**: [docs/](docs/) directory
- **API**: [docs/API.md](docs/API.md)
- **Arquitetura**: [ARCHITECTURE.md](ARCHITECTURE.md)

### Exemplo JSDoc

```javascript
/**
 * Searches for a person by CPF or CNPJ
 * 
 * @async
 * @param {string} document - CPF or CNPJ (formatted or not)
 * @param {Object} options - Search options
 * @param {boolean} [options.useCache=true] - Use cached results
 * @param {number} [options.timeout=30000] - Request timeout in ms
 * @returns {Promise<SearchResult>} Search results
 * @throws {ValidationError} If document is invalid
 * 
 * @example
 * const results = await searchPerson('123.456.789-10');
 * console.log(results);
 */
async function searchPerson(document, options = {}) {
  // Implementation
}
```

## 🐛 Reportar Bugs

### Antes de Reportar

- Verifique issues já abertas
- Teste com a versão latest
- Colete informações relevantes:
  - Node.js version (`node --version`)
  - npm version (`npm --version`)
  - OS e versão
  - Stack trace completo

### Template Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do problema.

## Como Reproduzir
1. Passo 1
2. Passo 2
3. ...

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Informações do Sistema
- Node: v18.19.0
- npm: 9.0.0
- OS: macOS 14.2

## Logs
```
[Adicione logs relevantes, sem dados sensíveis]
```

## Contexto Adicional
Outras informações úteis.
```

## ✨ Sugestões de Features

Abra uma issue com label `enhancement`:

```markdown
## Descrição
Descrição da feature desejada.

## Motivação
Por que isso seria útil?

## Solução Proposta
Como você imagina que isso seria implementado?

## Alternativas Consideradas
Outras abordagens?
```

## 📞 Obtenha Ajuda

- **Documentação**: [README.md](README.md)
- **Discussões**: [GitHub Discussions](https://github.com/yourusername/vyntara/discussions)
- **Issues**: [GitHub Issues](https://github.com/yourusername/vyntara/issues)

## 🙏 Agradecimentos

Obrigado por contribuir! Sua ajuda é essencial para manter o Vyntara excelente.

---

**Última atualização**: 2026-01-31
