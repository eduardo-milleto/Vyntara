const { VertexAI } = require('@google-cloud/vertexai');
const { config } = require('./config');

async function searchByImage(imageBase64, mimeType = 'image/jpeg') {
  console.log('[Vyntara Vision] Iniciando pesquisa reversa de imagem...');
  
  const projectId = config.gcp.projectId;
  const location = config.gcp.location || 'us-central1';
  
  if (!projectId) {
    throw new Error('GOOGLE_PROJECT_ID não configurado');
  }

  try {
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `Analise esta imagem de uma pessoa e extraia todas as informações possíveis para ajudar em uma investigação OSINT (Open Source Intelligence).

Por favor, forneça sua análise em JSON com a seguinte estrutura:
{
  "descricaoPessoa": {
    "aparencia": "descrição física detalhada",
    "idadeAproximada": "faixa etária estimada",
    "genero": "masculino/feminino/indeterminado",
    "vestimenta": "descrição das roupas se visíveis",
    "acessorios": ["lista de acessórios visíveis"]
  },
  "contexto": {
    "ambiente": "descrição do ambiente/fundo da foto",
    "tipoFoto": "selfie/profissional/casual/documento/etc",
    "qualidadeImagem": "alta/media/baixa",
    "possiveisLocais": ["tipos de locais onde a foto pode ter sido tirada"]
  },
  "elementosIdentificaveis": {
    "logos": ["marcas ou logos visíveis"],
    "textos": ["textos visíveis na imagem"],
    "simbolos": ["símbolos ou emblemas identificáveis"],
    "uniformes": "descrição se houver uniforme identificável"
  },
  "sugestoesPesquisa": [
    "sugestões de termos de busca para encontrar mais informações sobre esta pessoa"
  ],
  "riscos": {
    "score": 0-100,
    "observacoes": "observações relevantes para investigação"
  },
  "resumo": "resumo geral da análise em 2-3 frases"
}

Seja objetivo e baseie-se apenas no que é visível na imagem. Se não conseguir identificar algo, indique como "não identificado".`
    };

    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [imagePart, textPart],
        },
      ],
    });
    
    const response = result.response;
    let text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let analysisResult = null;
    
    if (jsonMatch) {
      try {
        analysisResult = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log('[Vyntara Vision] Erro ao parsear JSON, usando texto bruto');
        analysisResult = { rawText: text };
      }
    } else {
      analysisResult = { rawText: text };
    }

    console.log('[Vyntara Vision] Análise de imagem concluída');
    
    return {
      success: true,
      analysis: analysisResult,
      rawResponse: text
    };

  } catch (error) {
    console.error('[Vyntara Vision] Erro:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function searchImageOnWeb(imageUrl) {
  console.log('[Vyntara Vision] Buscando imagem similar na web...');
  
  const apiKey = config.cse.apiKey;
  const cseId = config.cse.cx;
  
  if (!apiKey || !cseId) {
    return { success: false, error: 'Google CSE não configurado' };
  }

  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&searchType=image&q=site:linkedin.com+OR+site:facebook.com&imgUrl=${encodeURIComponent(imageUrl)}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.items) {
      return {
        success: true,
        results: data.items.map(item => ({
          title: item.title,
          link: item.link,
          displayLink: item.displayLink,
          snippet: item.snippet,
          image: item.image
        }))
      };
    }
    
    return { success: true, results: [] };
    
  } catch (error) {
    console.error('[Vyntara Vision] Erro na busca web:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { searchByImage, searchImageOnWeb };
