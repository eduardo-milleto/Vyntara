-- ==================================================
-- VYNTARA V2 - Database Migration
-- Adiciona colunas de confidence levels e metadados
-- Compatível com estrutura Supabase existente
-- ==================================================

-- 1. Adicionar novas colunas à tabela vyntara_consultas
ALTER TABLE vyntara_consultas 
ADD COLUMN IF NOT EXISTS confidence_identity VARCHAR(10),
ADD COLUMN IF NOT EXISTS confidence_judicial VARCHAR(10),
ADD COLUMN IF NOT EXISTS filter_stats JSONB,
ADD COLUMN IF NOT EXISTS ai_two_step BOOLEAN DEFAULT false;

-- 2. Atualizar vyntara_fontes_google para incluir metadados do evidence filter
ALTER TABLE vyntara_fontes_google
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50),
ADD COLUMN IF NOT EXISTS confiabilidade_fonte VARCHAR(20),
ADD COLUMN IF NOT EXISTS compatibilidade_identidade NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20),
ADD COLUMN IF NOT EXISTS motivos JSONB,
ADD COLUMN IF NOT EXISTS peso NUMERIC(3,2);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vyntara_consultas_confidence_identity 
ON vyntara_consultas(confidence_identity);

CREATE INDEX IF NOT EXISTS idx_vyntara_consultas_confidence_judicial 
ON vyntara_consultas(confidence_judicial);

CREATE INDEX IF NOT EXISTS idx_vyntara_consultas_tipo 
ON vyntara_consultas(tipo);

CREATE INDEX IF NOT EXISTS idx_vyntara_consultas_created_at 
ON vyntara_consultas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vyntara_fontes_status 
ON vyntara_fontes_google(status);

CREATE INDEX IF NOT EXISTS idx_vyntara_fontes_categoria 
ON vyntara_fontes_google(categoria);

-- 4. Atualizar consultas antigas com confidence padrão (opcional - apenas registros antigos)
-- Não executa em produção se não quiser alterar dados históricos
-- UPDATE vyntara_consultas 
-- SET confidence_identity = 'MEDIA',
--     confidence_judicial = 'MEDIA'
-- WHERE confidence_identity IS NULL 
--   AND created_at < NOW() - INTERVAL '7 days';

-- 5. Comentários nas colunas (documentação)
COMMENT ON COLUMN vyntara_consultas.confidence_identity IS 'Nível de confiança da identificação (ALTA|MEDIA|BAIXA) - evita confusão com homônimos';
COMMENT ON COLUMN vyntara_consultas.confidence_judicial IS 'Nível de confiança dos dados judiciais do Escavador (ALTA|MEDIA|BAIXA)';
COMMENT ON COLUMN vyntara_consultas.filter_stats IS 'Estatísticas do evidence filter: {aceitas, descartadas, sinaisFracos, compatibilidadeMedia}';
COMMENT ON COLUMN vyntara_consultas.ai_two_step IS 'Se usou IA em 2 etapas (extração + síntese) para máxima qualidade';

COMMENT ON COLUMN vyntara_fontes_google.categoria IS 'Categoria da fonte: JUDICIAL|PROFISSIONAL|MIDIA|SOCIAL_*|GOVERNO|EMPRESARIAL|OUTRO';
COMMENT ON COLUMN vyntara_fontes_google.confiabilidade_fonte IS 'Confiabilidade: MUITO_ALTA|ALTA|MEDIA|BAIXA|MUITO_BAIXA';
COMMENT ON COLUMN vyntara_fontes_google.compatibilidade_identidade IS 'Score 0.0-1.0 de match com nome/UF/cidade/empresa';
COMMENT ON COLUMN vyntara_fontes_google.status IS 'Status da evidência: ACEITA|SINAL_FRACO|DESCARTADA';
COMMENT ON COLUMN vyntara_fontes_google.motivos IS 'Array JSON com justificativas da classificação';
COMMENT ON COLUMN vyntara_fontes_google.peso IS 'Peso 0.0-1.0 para IA considerar (confiabilidade x compatibilidade)';

-- 6. Verificar estrutura final
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('vyntara_consultas', 'vyntara_fontes_google', 'vyntara_processos', 'vyntara_pedidos')
ORDER BY table_name, ordinal_position;

-- 7. Estatísticas úteis pós-migração
SELECT 
  'Total consultas' as metrica,
  COUNT(*) as valor
FROM vyntara_consultas
UNION ALL
SELECT 
  'Com confidence identity',
  COUNT(*) 
FROM vyntara_consultas 
WHERE confidence_identity IS NOT NULL
UNION ALL
SELECT 
  'Total processos',
  COUNT(*) 
FROM vyntara_processos
UNION ALL
SELECT 
  'Total fontes Google',
  COUNT(*) 
FROM vyntara_fontes_google
UNION ALL
SELECT 
  'Fontes classificadas',
  COUNT(*) 
FROM vyntara_fontes_google 
WHERE status IS NOT NULL;
