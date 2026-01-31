const express = require('express');
const router = express.Router();
const { generateOsintReport } = require('../services/vyntara');
const { reverseImageSearch } = require('../services/vyntara/reverseImageSearch');
const { sendWhatsAppMessage } = require('../services/vyntara-whatsapp');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const mpPreference = new Preference(mpClient);
const mpPayment = new Payment(mpClient);

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'vyntara-osint' });
});

router.post('/criar-pagamento', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    
    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios' });
    }

    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (telefoneFormatado.length !== 10 && telefoneFormatado.length !== 11) {
      return res.status(400).json({ error: 'Telefone inválido. Use o formato (51) 8631-7625 sem o 9' });
    }
    
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = `55${telefoneFormatado}`;
    }

    const pedidoResult = await pool.query(
      `INSERT INTO vyntara_pedidos (nome_pesquisado, email, telefone, valor, status)
       VALUES ($1, $2, $3, 19.90, 'pending')
       RETURNING id`,
      [nome, email, telefoneFormatado]
    );
    const pedidoId = pedidoResult.rows[0].id;

    const frontendUrl = process.env.VYNTARA_DOMAIN 
      ? `https://${process.env.VYNTARA_DOMAIN}`
      : 'https://vyntaraapp.com';
    
    const backendUrl = 'https://vendassemlimite.com.br';

    const preferenceData = {
      items: [
        {
          id: `vyntara-${pedidoId}`,
          title: `Análise OSINT Vyntara #${pedidoId}`,
          description: `Relatório de inteligência pública - Pedido #${pedidoId}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 19.90
        }
      ],
      payer: {
        email: email
      },
      back_urls: {
        success: `${frontendUrl}/pagamento-confirmado?pedido=${pedidoId}`,
        failure: `${frontendUrl}?erro=pagamento`,
        pending: `${frontendUrl}?pendente=1`
      },
      auto_return: 'approved',
      external_reference: `vyntara-${pedidoId}`,
      notification_url: `${backendUrl}/api/vyntara/webhook-pagamento`
    };

    const preference = await mpPreference.create({ body: preferenceData });
    
    await pool.query(
      `UPDATE vyntara_pedidos SET mp_preference_id = $1 WHERE id = $2`,
      [preference.id, pedidoId]
    );

    console.log(`[Vyntara] Pagamento criado - Pedido #${pedidoId} para ${nome}`);

    res.json({
      success: true,
      pedido_id: pedidoId,
      preference_id: preference.id,
      init_point: preference.init_point
    });

  } catch (error) {
    console.error('[Vyntara] Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
});

router.post('/gerar-pix', async (req, res) => {
  try {
    const { nome, email, telefone, cpf } = req.body;
    
    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios' });
    }

    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = `55${telefoneFormatado}`;
    }

    const pedidoResult = await pool.query(
      `INSERT INTO vyntara_pedidos (nome_pesquisado, email, telefone, valor, status)
       VALUES ($1, $2, $3, 19.90, 'pending')
       RETURNING id`,
      [nome, email, telefoneFormatado]
    );
    const pedidoId = pedidoResult.rows[0].id;

    const backendUrl = 'https://vendassemlimite.com.br';

    const paymentData = {
      transaction_amount: 19.90,
      description: `Análise OSINT Vyntara #${pedidoId}`,
      payment_method_id: 'pix',
      notification_url: `${backendUrl}/api/vyntara/webhook-pagamento`,
      payer: {
        email: email
      },
      external_reference: `vyntara-${pedidoId}`
    };

    console.log(`[Vyntara] Criando PIX para pedido #${pedidoId}`);
    const pixPayment = await mpPayment.create({ body: paymentData });

    await pool.query(
      `UPDATE vyntara_pedidos SET mp_payment_id = $1 WHERE id = $2`,
      [pixPayment.id.toString(), pedidoId]
    );

    console.log(`[Vyntara] PIX criado com sucesso - ID: ${pixPayment.id}`);

    res.json({
      success: true,
      pedido_id: pedidoId,
      payment_id: pixPayment.id,
      qr_code: pixPayment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: pixPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: pixPayment.point_of_interaction?.transaction_data?.ticket_url
    });

  } catch (error) {
    console.error('[Vyntara] Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX', details: error.message });
  }
});

router.post('/processar-cartao', async (req, res) => {
  try {
    const { nome, email, telefone, cpf, card_token, payment_method_id, issuer_id } = req.body;
    
    if (!nome || !email || !card_token) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    let telefoneFormatado = telefone ? telefone.replace(/\D/g, '') : '';
    if (telefoneFormatado && !telefoneFormatado.startsWith('55')) {
      telefoneFormatado = `55${telefoneFormatado}`;
    }

    const pedidoResult = await pool.query(
      `INSERT INTO vyntara_pedidos (nome_pesquisado, email, telefone, valor, status)
       VALUES ($1, $2, $3, 19.90, 'pending')
       RETURNING id`,
      [nome, email, telefoneFormatado || null]
    );
    const pedidoId = pedidoResult.rows[0].id;

    const backendUrl = 'https://vendassemlimite.com.br';

    const paymentData = {
      transaction_amount: 19.90,
      description: `Análise OSINT Vyntara #${pedidoId}`,
      payment_method_id: payment_method_id || 'visa',
      token: card_token,
      installments: 1,
      notification_url: `${backendUrl}/api/vyntara/webhook-pagamento`,
      payer: {
        email: email
      },
      external_reference: `vyntara-${pedidoId}`
    };
    
    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    console.log(`[Vyntara] Processando cartão para pedido #${pedidoId} - ${nome}`);
    const cardPayment = await mpPayment.create({ body: paymentData });

    await pool.query(
      `UPDATE vyntara_pedidos SET mp_payment_id = $1, status = $2 WHERE id = $3`,
      [cardPayment.id.toString(), cardPayment.status, pedidoId]
    );

    console.log(`[Vyntara] Cartão processado - ID: ${cardPayment.id}, Status: ${cardPayment.status}`);

    if (cardPayment.status === 'approved') {
      processarAnaliseAposPagamento(pedidoId, nome, email, telefoneFormatado);
    }

    res.json({
      success: true,
      pedido_id: pedidoId,
      payment_id: cardPayment.id,
      status: cardPayment.status,
      status_detail: cardPayment.status_detail
    });

  } catch (error) {
    console.error('[Vyntara] Erro ao processar cartão:', error);
    res.status(500).json({ error: 'Erro ao processar cartão', details: error.message });
  }
});

router.post('/webhook-pagamento', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log(`[Vyntara Webhook] Tipo: ${type}, Data:`, data);
    
    if (type === 'payment' && data?.id) {
      const payment = await mpPayment.get({ id: data.id });
      
      console.log(`[Vyntara Webhook] Payment status: ${payment.status}, ref: ${payment.external_reference}`);
      
      if (payment.status === 'approved' && payment.external_reference?.startsWith('vyntara-')) {
        const pedidoId = parseInt(payment.external_reference.replace('vyntara-', ''));
        
        const existing = await pool.query(
          'SELECT * FROM vyntara_pedidos WHERE id = $1',
          [pedidoId]
        );
        
        if (existing.rows.length > 0 && existing.rows[0].status !== 'approved') {
          await pool.query(
            `UPDATE vyntara_pedidos SET status = 'approved', mp_payment_id = $1, updated_at = NOW() WHERE id = $2`,
            [data.id.toString(), pedidoId]
          );
          
          const pedido = existing.rows[0];
          console.log(`[Vyntara] Pagamento aprovado para pedido #${pedidoId}`);
          
          processarAnaliseAposPagamento(pedidoId, pedido.nome_pesquisado, pedido.email, pedido.telefone);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Vyntara Webhook] Erro:', error);
    res.status(200).send('OK');
  }
});

async function processarAnaliseAposPagamento(pedidoId, nome, email, telefone) {
  try {
    console.log(`[Vyntara] Processando análise para pedido #${pedidoId}: ${nome}`);
    
    // Primeiro verifica se já existe uma análise para esse nome (case insensitive)
    const existingResult = await pool.query(
      `SELECT id, analise_ia FROM vyntara_consultas 
       WHERE LOWER(TRIM(nome_pesquisado)) = LOWER(TRIM($1)) 
       AND analise_ia IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [nome]
    );
    
    let report;
    let consultaId;
    
    if (existingResult.rows.length > 0) {
      // Reutiliza análise existente
      console.log(`[Vyntara] ✅ Reutilizando análise existente para: ${nome}`);
      report = existingResult.rows[0].analise_ia;
      consultaId = existingResult.rows[0].id;
      
      await pool.query(
        `UPDATE vyntara_pedidos SET consulta_id = $1, analise_concluida = true, updated_at = NOW() WHERE id = $2`,
        [consultaId, pedidoId]
      );
    } else {
      // Gera nova análise
      console.log(`[Vyntara] 🔍 Gerando nova análise para: ${nome}`);
      report = await generateOsintReport(nome, 'pessoa', 'Análise paga via Mercado Pago');
      
      // Gera identificador único para a consulta
      const identificador = `VYN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const insertConsulta = await pool.query(
        `INSERT INTO vyntara_consultas (identificador, nome_pesquisado, tipo, analise_ia, created_at) 
         VALUES ($1, $2, 'nome', $3, NOW()) RETURNING id`,
        [identificador, nome, report]
      );
      consultaId = insertConsulta.rows[0].id;
      
      await pool.query(
        `UPDATE vyntara_pedidos SET consulta_id = $1, analise_concluida = true, updated_at = NOW() WHERE id = $2`,
        [consultaId, pedidoId]
      );
    }
    
    await enviarMensagemWhatsAppTemplate(telefone, nome, email, pedidoId, report);
    
    console.log(`[Vyntara] Análise concluída e enviada para pedido #${pedidoId}`);
    
    return report;
  } catch (error) {
    console.error(`[Vyntara] Erro ao processar análise #${pedidoId}:`, error);
    return null;
  }
}

async function enviarMensagemWhatsAppTemplate(telefone, nome, email, pedidoId, report = null) {
  try {
    const phoneNumberId = process.env.meta_phone_vyntara;
    const accessToken = process.env.WHATSAPP_BUSINESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
      console.error('[Vyntara] Credenciais WhatsApp não configuradas');
      return false;
    }

    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = `55${telefoneFormatado}`;
    }
    console.log(`[Vyntara] Telefone formatado para envio: ${telefoneFormatado}`);

    const templateResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: telefoneFormatado,
        type: 'template',
        template: {
          name: 'vyntara',
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: email },
                { type: 'text', text: `#${pedidoId}` }
              ]
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Vyntara] Template WhatsApp enviado:', templateResponse.data?.messages?.[0]?.id);
    
    await pool.query(
      `UPDATE vyntara_pedidos SET analise_enviada_whatsapp = true WHERE id = $1`,
      [pedidoId]
    );

    return true;
  } catch (error) {
    console.error('[Vyntara] Erro ao enviar template WhatsApp:', error.response?.data || error.message);
    
    try {
      let telefoneFallback = telefone.replace(/\D/g, '');
      if (!telefoneFallback.startsWith('55')) {
        telefoneFallback = `55${telefoneFallback}`;
      }
      const mensagem = `Ola! Sua analise Vyntara esta pronta.\n\nNome pesquisado: ${nome}\nEmail: ${email}\nID da compra: #${pedidoId}\n\nPara receber a analise completa aqui no WhatsApp, responda com a palavra: *analise*`;
      
      await sendWhatsAppMessage(telefoneFallback, mensagem);
      
      await pool.query(
        `UPDATE vyntara_pedidos SET analise_enviada_whatsapp = true WHERE id = $1`,
        [pedidoId]
      );
      
      return true;
    } catch (fallbackError) {
      console.error('[Vyntara] Fallback tambem falhou:', fallbackError.message);
      return false;
    }
  }
}

router.post('/reenviar-analise', async (req, res) => {
  try {
    const { pedido_id } = req.body;
    
    if (!pedido_id) {
      return res.status(400).json({ error: 'pedido_id é obrigatório' });
    }
    
    const pedidoResult = await pool.query(
      `SELECT vp.*, vc.analise_ia 
       FROM vyntara_pedidos vp
       LEFT JOIN vyntara_consultas vc ON vp.consulta_id = vc.id
       WHERE vp.id = $1`,
      [pedido_id]
    );
    
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = pedidoResult.rows[0];
    
    if (!pedido.analise_ia) {
      return res.status(400).json({ error: 'Análise não encontrada para este pedido' });
    }
    
    await enviarMensagemWhatsAppTemplate(
      pedido.telefone,
      pedido.nome_pesquisado,
      pedido.email,
      pedido.id,
      pedido.analise_ia
    );
    
    console.log(`[Vyntara] Análise reenviada para pedido #${pedido_id}`);
    
    res.json({ 
      success: true, 
      message: `Análise reenviada para ${pedido.telefone}` 
    });
  } catch (error) {
    console.error('[Vyntara] Erro ao reenviar análise:', error);
    res.status(500).json({ error: 'Erro ao reenviar análise' });
  }
});

router.post('/reprocessar-analise', async (req, res) => {
  try {
    const { pedido_id } = req.body;
    
    if (!pedido_id) {
      return res.status(400).json({ error: 'pedido_id é obrigatório' });
    }
    
    const pedidoResult = await pool.query(
      `SELECT * FROM vyntara_pedidos WHERE id = $1`,
      [pedido_id]
    );
    
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = pedidoResult.rows[0];
    const startTime = Date.now();
    
    console.log(`[Vyntara] Reprocessando análise para pedido #${pedido_id}: ${pedido.nome_pesquisado}`);
    
    const report = await generateOsintReport(pedido.nome_pesquisado, 'pessoa', 'Reprocessamento manual');
    
    const identificador = `VYN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const insertConsulta = await pool.query(
      `INSERT INTO vyntara_consultas (identificador, nome_pesquisado, tipo, analise_ia, created_at) 
       VALUES ($1, $2, 'nome', $3, NOW()) RETURNING id`,
      [identificador, pedido.nome_pesquisado, report]
    );
    const consultaId = insertConsulta.rows[0].id;
    
    await pool.query(
      `UPDATE vyntara_pedidos SET consulta_id = $1, analise_concluida = true, updated_at = NOW() WHERE id = $2`,
      [consultaId, pedido_id]
    );
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Vyntara] ✓ Análise reprocessada em ${elapsed}s para pedido #${pedido_id}`);
    
    await enviarMensagemWhatsAppTemplate(pedido.telefone, pedido.nome_pesquisado, pedido.email, pedido_id, report);
    
    res.json({ 
      success: true, 
      message: `Análise reprocessada e enviada em ${elapsed} segundos`,
      pedido_id,
      consulta_id: consultaId,
      tempo_segundos: parseFloat(elapsed)
    });
  } catch (error) {
    console.error('[Vyntara] Erro ao reprocessar análise:', error);
    res.status(500).json({ error: 'Erro ao reprocessar análise: ' + error.message });
  }
});

router.post('/regenerar-sintese', async (req, res) => {
  try {
    const { consulta_id } = req.body;
    
    if (!consulta_id) {
      return res.status(400).json({ error: 'consulta_id é obrigatório' });
    }
    
    const consultaResult = await pool.query(
      `SELECT * FROM vyntara_consultas WHERE id = $1`,
      [consulta_id]
    );
    
    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    const consulta = consultaResult.rows[0];
    const existingAnalysis = consulta.analise_ia;
    
    if (!existingAnalysis || !existingAnalysis.extraction) {
      return res.status(400).json({ error: 'Análise não possui dados de extração para regenerar' });
    }
    
    const { regenerateSynthesis } = require('../services/vyntara/gemini');
    const newAnalysis = await regenerateSynthesis(existingAnalysis, consulta.nome_pesquisado);
    
    newAnalysis.confidence = existingAnalysis.confidence;
    
    await pool.query(
      `UPDATE vyntara_consultas SET analise_ia = $1, updated_at = NOW() WHERE id = $2`,
      [newAnalysis, consulta_id]
    );
    
    console.log(`[Vyntara] Síntese regenerada para consulta #${consulta_id}`);
    
    res.json({ 
      success: true, 
      message: `Síntese regenerada com sucesso`,
      consulta_id,
      summary: newAnalysis.summary
    });
  } catch (error) {
    console.error('[Vyntara] Erro ao regenerar síntese:', error);
    res.status(500).json({ error: 'Erro ao regenerar síntese: ' + error.message });
  }
});

router.get('/verificar-pagamento/:pedidoId', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM vyntara_pedidos WHERE id = $1',
      [pedidoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Retorna approved assim que o pagamento for aprovado
    if (pedido.status === 'approved') {
      if (pedido.analise_concluida && pedido.consulta_id) {
        const consultaResult = await pool.query(
          `SELECT analise_ia FROM vyntara_consultas WHERE id = $1`,
          [pedido.consulta_id]
        );
        
        if (consultaResult.rows.length > 0) {
          return res.json({
            success: true,
            status: 'completed',
            nome: pedido.nome_pesquisado,
            analise: consultaResult.rows[0].analise_ia
          });
        }
      }
      
      // Pagamento aprovado mas análise ainda em processamento
      return res.json({
        success: true,
        status: 'approved',
        nome: pedido.nome_pesquisado,
        analise_concluida: pedido.analise_concluida
      });
    }
    
    res.json({
      success: true,
      status: pedido.status,
      analise_concluida: pedido.analise_concluida
    });
    
  } catch (error) {
    console.error('[Vyntara] Erro ao verificar pagamento:', error);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

router.post('/report', async (req, res) => {
  try {
    const { fullName, context, notes } = req.body;
    
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'Nome completo é obrigatório (mínimo 2 caracteres)' 
      });
    }
    
    if (!context || context.trim().length < 2) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'Contexto é obrigatório (cidade, empresa, área de atuação)' 
      });
    }

    console.log(`[Vyntara] Nova requisição: ${fullName} | ${context}`);
    
    const report = await generateOsintReport(
      fullName.trim(),
      context.trim(),
      notes?.trim() || ''
    );

    res.json(report);
  } catch (error) {
    console.error('[Vyntara] Erro ao gerar relatório:', error);
    res.status(500).json({ 
      error: 'GENERATION_ERROR', 
      message: 'Erro ao gerar relatório. Tente novamente.' 
    });
  }
});

router.post('/quick-search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'Consulta deve ter pelo menos 3 caracteres' 
      });
    }

    const parts = query.trim().split(' ');
    const fullName = parts.slice(0, Math.min(3, parts.length)).join(' ');
    const context = parts.slice(3).join(' ') || '';

    console.log(`[Vyntara] Quick search: ${fullName}${context ? ` | ${context}` : ''}`);
    
    const report = await generateOsintReport(fullName, context, '');

    res.json(report);
  } catch (error) {
    console.error('[Vyntara] Erro na busca rápida:', error);
    res.status(500).json({ 
      error: 'SEARCH_ERROR', 
      message: 'Erro na busca. Tente novamente.' 
    });
  }
});

router.post('/image-search', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'Imagem é obrigatória' 
      });
    }

    console.log(`[Vyntara] Iniciando pesquisa por imagem...`);
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    const imageResult = await reverseImageSearch(base64Data, mimeType || 'image/jpeg');

    if (!imageResult.success) {
      return res.status(500).json({ 
        error: 'VISION_ERROR', 
        message: imageResult.error || 'Erro na análise de imagem' 
      });
    }

    const identifiedName = imageResult.bestCandidateName;
    const empresa = imageResult.empresa;
    const confidence = imageResult.nameConfidence;
    
    console.log(`[Vyntara] Análise concluída. Nome: ${identifiedName || 'não identificado'}, Confiança: ${confidence}`);

    if (identifiedName) {
      console.log(`[Vyntara] Gerando relatório OSINT para: ${identifiedName}`);
      
      const context = empresa || 'pessoa identificada por imagem';
      
      try {
        const osintReport = await generateOsintReport(identifiedName, context, 'Pesquisa iniciada por análise de imagem');
        
        return res.json({
          success: true,
          identifiedName,
          nameConfidence: confidence,
          nameSource: imageResult.nameSource,
          empresa,
          imageAnalysis: imageResult.summary,
          osintReport: osintReport,
          hasReport: true
        });
      } catch (osintError) {
        console.error('[Vyntara] Erro no relatório OSINT:', osintError.message);
        return res.json({
          success: true,
          identifiedName,
          nameConfidence: confidence,
          nameSource: imageResult.nameSource,
          empresa,
          imageAnalysis: imageResult.summary,
          osintReport: null,
          hasReport: false,
          osintError: osintError.message
        });
      }
    }

    return res.json({
      success: true,
      identifiedName: null,
      nameConfidence: 0,
      imageAnalysis: imageResult.summary,
      searchSuggestions: imageResult.searchTerms || [],
      geminiAnalysis: imageResult.geminiAnalysis,
      hasReport: false,
      message: 'Não foi possível identificar o nome da pessoa. Tente fazer upload de uma imagem com crachá, documento ou identificação visível.'
    });
    
  } catch (error) {
    console.error('[Vyntara] Erro na pesquisa por imagem:', error);
    res.status(500).json({ 
      error: 'IMAGE_SEARCH_ERROR', 
      message: 'Erro ao processar imagem. Tente novamente.' 
    });
  }
});

module.exports = router;
