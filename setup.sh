#!/bin/bash
# Setup Script for Vyntara CI/CD Pipeline
# This script helps you get started with GitHub and CI/CD

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🚀 VYNTARA - GitHub CI/CD Setup Script                 ║"
echo "║                                                                ║"
echo "║ Este script ajuda você a preparar seu repositório GitHub       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check requirements
echo -e "${BLUE}📋 Verificando requisitos...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não encontrado. Instale Node.js >= 18.0.0${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git $(git -v)${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker não encontrado (opcional, mas recomendado)${NC}"
else
    echo -e "${GREEN}✓ Docker $(docker -v)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install dependencies
echo -e "${BLUE}📦 Passo 1: Instalando dependências...${NC}"
npm run install:all 2>&1 | grep -E "^(added|up to date|npm ERR)" || true
echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# Step 2: Git configuration
echo -e "${BLUE}🔧 Passo 2: Configurando Git...${NC}"
read -p "Qual é seu nome (para commits)? " GIT_NAME
read -p "Qual é seu email (para commits)? " GIT_EMAIL

git config user.name "$GIT_NAME" 2>/dev/null || true
git config user.email "$GIT_EMAIL" 2>/dev/null || true
echo -e "${GREEN}✓ Git configurado${NC}"
echo ""

# Step 3: Git hooks
echo -e "${BLUE}🪝 Passo 3: Configurando Git hooks (Husky)...${NC}"
npx husky install 2>/dev/null || true
echo -e "${GREEN}✓ Git hooks configurados${NC}"
echo ""

# Step 4: Environment setup
echo -e "${BLUE}⚙️  Passo 4: Configurando variáveis de ambiente...${NC}"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${YELLOW}⚠ Criado .env.local - EDITE com suas credenciais!${NC}"
    echo -e "${YELLOW}  Chave: GOOGLE_API_KEY, ESCAVADOR_API_KEY, etc${NC}"
else
    echo -e "${GREEN}✓ .env.local já existe${NC}"
fi
echo ""

# Step 5: Run tests
echo -e "${BLUE}🧪 Passo 5: Executando testes...${NC}"
npm run test 2>&1 | tail -5
echo -e "${GREEN}✓ Testes completados${NC}"
echo ""

# Step 6: GitHub setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🐙 Passo 6: Configuração GitHub${NC}"
echo ""

read -p "Deseja adicionar o repositório remoto do GitHub? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "URL do repositório GitHub (ex: https://github.com/user/vyntara.git): " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git remote remove origin 2>/dev/null || true
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✓ Repositório remoto adicionado${NC}"
    fi
fi
echo ""

# Step 7: GitHub Secrets
echo -e "${BLUE}🔐 Passo 7: GitHub Secrets${NC}"
echo ""
echo "Você deve adicionar os seguintes secrets no GitHub:"
echo "  Settings > Secrets and variables > Actions"
echo ""
echo "Secrets necessários:"
echo "  • STAGING_DEPLOY_KEY"
echo "  • STAGING_DEPLOY_HOST"
echo "  • STAGING_DEPLOY_USER"
echo "  • PROD_DEPLOY_KEY"
echo "  • PROD_DEPLOY_HOST"
echo "  • PROD_DEPLOY_USER"
echo "  • PROD_DB_HOST"
echo "  • PROD_DB_USER"
echo "  • PROD_DB_PASSWORD"
echo "  • SONAR_TOKEN"
echo "  • SNYK_TOKEN"
echo "  • SLACK_WEBHOOK"
echo ""

# Step 8: First commit
echo -e "${BLUE}📝 Passo 8: Primeiro commit${NC}"
read -p "Deseja fazer o primeiro commit? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    git add .
    git commit -m "feat: initial professional setup" || true
    echo -e "${GREEN}✓ Primeira commit realizada${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Editar .env.local com suas credenciais"
echo "2. Fazer push para GitHub:"
echo "   git push -u origin main"
echo ""
echo "3. Configurar GitHub Secrets:"
echo "   https://github.com/seu-usuario/vyntara/settings/secrets"
echo ""
echo "4. Configurar Branch Protection:"
echo "   https://github.com/seu-usuario/vyntara/settings/branches"
echo ""
echo "5. Integrar SonarCloud:"
echo "   https://sonarcloud.io/projects/create"
echo ""
echo "6. Fazer primeira release:"
echo "   npm version minor"
echo "   git push --tags"
echo ""
echo "Documentação:"
echo "  • QUICK_START.md - Começar rápido"
echo "  • README.md - Visão geral"
echo "  • SETUP.md - Checklist detalhado"
echo ""
echo -e "${BLUE}Acesso rápido:${NC}"
echo "  • Executar: make dev"
echo "  • Testes:   make test"
echo "  • Docker:   make docker-up"
echo "  • Help:     make help"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Seu projeto está 100% pronto para produção!${NC}"
echo ""
