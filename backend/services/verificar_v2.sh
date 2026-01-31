#!/bin/bash

# ============================================
# VYNTARA V2 - Checklist de Deploy
# Execute este script para verificar se tudo está pronto
# ============================================

echo "╔════════════════════════════════════════════════╗"
echo "║  VYNTARA V2 - Verificação de Implementação    ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0
WARN=0

# Função de verificação
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $2 - ARQUIVO NÃO ENCONTRADO: $1"
    ((FAIL++))
  fi
}

check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $3"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $3 - NÃO ENCONTRADO EM: $1"
    ((FAIL++))
  fi
}

check_optional() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $3"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} $3 - PENDENTE (opcional)"
    ((WARN++))
  fi
}

echo "1. Verificando novos arquivos..."
echo "=================================="
check_file "/root/vyntara/confidence.js" "confidence.js criado"
check_file "/root/vyntara/evidenceFilter.js" "evidenceFilter.js criado"
check_file "/root/vyntara/disclaimers.js" "disclaimers.js criado"
check_file "/root/vyntara/migration_v2.sql" "migration_v2.sql criado"
check_file "/root/vyntara/IMPLEMENTACAO_V2.md" "Guia de implementação criado"
check_file "/root/vyntara/exemplos_v2.js" "Exemplos criados"

echo ""
echo "2. Verificando módulo redact.js..."
echo "==================================="
check_content "/root/vyntara/redact.js" "redactForAI" "redactForAI implementado"
check_content "/root/vyntara/redact.js" "detectSensitiveData" "detectSensitiveData implementado"
check_content "/root/vyntara/redact.js" "PATTERNS" "Padrões expandidos (15+ tipos)"

echo ""
echo "3. Verificando index.js..."
echo "==========================="
check_content "/root/vyntara/index.js" "calculateIdentityConfidence" "Import confidence.js"
check_content "/root/vyntara/index.js" "filterEvidence" "Import evidenceFilter.js"
check_content "/root/vyntara/index.js" "redactForLogs" "Import redact.js atualizado"
check_content "/root/vyntara/index.js" "SEM PROCESSOS JUDICIAIS" "Fluxo adaptativo implementado"
check_content "/root/vyntara/index.js" "CONFIDENCE IDENTITY" "Logs de confidence"
check_content "/root/vyntara/index.js" "applyScoreCap" "Score cap implementado"
check_content "/root/vyntara/index.js" "confidence_identity" "SaveToDatabase atualizado"

echo ""
echo "4. Verificando gemini.js..."
echo "============================"
check_content "/root/vyntara/gemini.js" "redactForAI" "Import redact atualizado"
check_content "/root/vyntara/gemini.js" "runGeminiTwoStep" "IA em 2 etapas implementada"
check_content "/root/vyntara/gemini.js" "ETAPA A" "Etapa de extração"
check_content "/root/vyntara/gemini.js" "ETAPA B" "Etapa de síntese"
check_content "/root/vyntara/gemini.js" "CLASSIFICAÇÃO" "Evidence classification no prompt"

echo ""
echo "5. Verificando integrações pendentes..."
echo "========================================="
check_optional "/root/vyntara/report.js" "generateDisclaimers" "report.js atualizado com disclaimers"
check_optional "/root/services/vyntara-whatsapp.js" "formatDisclaimersForWhatsApp" "WhatsApp atualizado com disclaimers"

echo ""
echo "6. Verificando estrutura de diretórios..."
echo "==========================================="
if [ -d "/root/vyntara" ]; then
  echo -e "${GREEN}✓${NC} Diretório /root/vyntara existe"
  ((PASS++))
  
  # Contar arquivos
  FILE_COUNT=$(ls -1 /root/vyntara/*.js 2>/dev/null | wc -l)
  echo -e "${GREEN}✓${NC} Total de arquivos .js: $FILE_COUNT"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Diretório /root/vyntara não encontrado"
  ((FAIL++))
fi

echo ""
echo "7. Testando módulos (syntax check)..."
echo "======================================="
if command -v node &> /dev/null; then
  if node -c /root/vyntara/confidence.js 2>/dev/null; then
    echo -e "${GREEN}✓${NC} confidence.js - Sintaxe OK"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} confidence.js - ERRO DE SINTAXE"
    ((FAIL++))
  fi
  
  if node -c /root/vyntara/evidenceFilter.js 2>/dev/null; then
    echo -e "${GREEN}✓${NC} evidenceFilter.js - Sintaxe OK"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} evidenceFilter.js - ERRO DE SINTAXE"
    ((FAIL++))
  fi
  
  if node -c /root/vyntara/disclaimers.js 2>/dev/null; then
    echo -e "${GREEN}✓${NC} disclaimers.js - Sintaxe OK"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} disclaimers.js - ERRO DE SINTAXE"
    ((FAIL++))
  fi
  
  if node -c /root/vyntara/redact.js 2>/dev/null; then
    echo -e "${GREEN}✓${NC} redact.js - Sintaxe OK"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} redact.js - ERRO DE SINTAXE"
    ((FAIL++))
  fi
else
  echo -e "${YELLOW}⚠${NC} Node.js não encontrado - pulando verificação de sintaxe"
  ((WARN++))
fi

echo ""
echo "8. Checklist manual (você deve verificar)..."
echo "=============================================="
echo -e "${YELLOW}⚠${NC} Execute migration_v2.sql no Supabase"
echo -e "${YELLOW}⚠${NC} Atualize report.js com disclaimers HTML"
echo -e "${YELLOW}⚠${NC} Atualize vyntara-whatsapp.js com disclaimers WhatsApp"
echo -e "${YELLOW}⚠${NC} Teste com consulta real antes de deploy"

echo ""
echo "════════════════════════════════════════════════"
echo "RESUMO DA VERIFICAÇÃO"
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✓ Passou:${NC} $PASS testes"
if [ $FAIL -gt 0 ]; then
  echo -e "${RED}✗ Falhou:${NC} $FAIL testes"
fi
if [ $WARN -gt 0 ]; then
  echo -e "${YELLOW}⚠ Avisos:${NC} $WARN itens pendentes"
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ VYNTARA V2 PRONTO PARA PRODUÇÃO            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Próximos passos:"
  echo "1. Execute: node /root/vyntara/exemplos_v2.js"
  echo "2. Execute migration_v2.sql no Supabase"
  echo "3. Atualize report.js e vyntara-whatsapp.js"
  echo "4. Teste com consulta real"
  echo "5. Deploy!"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ✗ CORRIJA OS ERROS ANTES DO DEPLOY           ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Revise os itens marcados com ✗ acima"
  exit 1
fi
