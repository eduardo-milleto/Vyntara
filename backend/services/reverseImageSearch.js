const vision = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');
const { config } = require('./config');

async function reverseImageSearchWithVision(imageBase64) {
  console.log('[Vyntara Vision] Tentando Google Vision API...');
  
  try {
    const client = new vision.ImageAnnotatorClient();

    const request = {
      image: {
        content: imageBase64
      },
      features: [
        { type: 'WEB_DETECTION', maxResults: 20 },
        { type: 'FACE_DETECTION', maxResults: 5 },
        { type: 'LABEL_DETECTION', maxResults: 10 }
      ]
    };

    const [result] = await client.annotateImage(request);
    
    const webDetection = result.webDetection || {};
    const faceAnnotations = result.faceAnnotations || [];
    const labelAnnotations = result.labelAnnotations || [];

    const webEntities = (webDetection.webEntities || []).map(entity => ({
      entityId: entity.entityId,
      description: entity.description,
      score: entity.score
    })).filter(e => e.description && e.score > 0.3);

    const pagesWithMatchingImages = (webDetection.pagesWithMatchingImages || []).map(page => ({
      url: page.url,
      pageTitle: page.pageTitle
    }));

    const possibleNames = webEntities
      .filter(e => e.score > 0.5)
      .map(e => e.description)
      .filter(desc => {
        const words = desc.split(' ');
        return words.length >= 2 && words.length <= 4;
      });

    console.log(`[Vyntara Vision] Vision API sucesso: ${webEntities.length} entidades, ${pagesWithMatchingImages.length} páginas`);

    return {
      success: true,
      source: 'vision_api',
      webEntities,
      pagesWithMatchingImages,
      faces: faceAnnotations.map(f => ({ confidence: f.detectionConfidence })),
      labels: labelAnnotations.map(l => ({ description: l.description, score: l.score })),
      possibleNames,
      summary: {
        hasFace: faceAnnotations.length > 0,
        totalPagesFound: pagesWithMatchingImages.length,
        topEntities: webEntities.slice(0, 5).map(e => e.description),
        possibleIdentity: possibleNames.length > 0 ? possibleNames[0] : null
      }
    };
  } catch (error) {
    console.log('[Vyntara Vision] Vision API indisponível:', error.message);
    return { success: false, error: error.message };
  }
}

async function analyzeImageWithGemini(imageBase64, mimeType = 'image/jpeg') {
  console.log('[Vyntara Vision] Analisando com Gemini para identificar pessoa...');
  
  const projectId = config.gcp.projectId;
  const location = config.gcp.location || 'us-central1';
  
  const vertexAI = new VertexAI({
    project: projectId,
    location: location,
  });

  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.1,
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
    text: `OBJETIVO: Identificar o NOME da pessoa nesta imagem para uma pesquisa de due diligence.

Analise TODOS os elementos visíveis que possam revelar a identidade:
- Crachás, badges, identificações
- Textos em uniformes ou roupas
- Nomes em documentos visíveis
- Logos de empresas que indiquem onde trabalha
- Qualquer texto que contenha nomes próprios

RETORNE APENAS JSON VÁLIDO:
{
  "nomeIdentificado": "Nome Completo da pessoa se conseguir identificar, ou null se não conseguir",
  "confiancaNome": 0.0 a 1.0,
  "fonteIdentificacao": "como identificou: crachá, documento, texto visível, etc ou null",
  "pessoaDescricao": {
    "genero": "masculino/feminino",
    "idadeAproximada": "faixa etária",
    "descricaoFisica": "descrição breve"
  },
  "contextoProfissional": {
    "empresa": "empresa identificável ou null",
    "profissao": "profissão aparente ou null",
    "cracha": "texto do crachá se visível ou null"
  },
  "elementosTextuais": {
    "textos": ["todos os textos visíveis na imagem"],
    "logos": ["marcas/logos identificáveis"],
    "nomesProprios": ["nomes próprios encontrados em textos"]
  },
  "termosParaBusca": ["termos sugeridos para pesquisar esta pessoa no Google"],
  "hasFace": true
}`
  };

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [imagePart, textPart] }],
    });

    const response = result.response;
    let text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[Vyntara Vision] Gemini análise concluída');
      return parsed;
    }
  } catch (e) {
    console.log('[Vyntara Vision] Erro no Gemini:', e.message);
  }
  return null;
}

async function reverseImageSearch(imageBase64, mimeType = 'image/jpeg') {
  console.log('[Vyntara Vision] Iniciando pesquisa reversa de imagem...');
  
  const [visionResult, geminiAnalysis] = await Promise.all([
    reverseImageSearchWithVision(imageBase64),
    analyzeImageWithGemini(imageBase64, mimeType).catch(e => {
      console.log('[Vyntara Vision] Gemini analysis falhou:', e.message);
      return null;
    })
  ]);
  
  let bestCandidateName = null;
  let nameConfidence = 0;
  let nameSource = null;
  
  if (geminiAnalysis?.nomeIdentificado) {
    bestCandidateName = geminiAnalysis.nomeIdentificado;
    nameConfidence = geminiAnalysis.confiancaNome || 0.5;
    nameSource = geminiAnalysis.fonteIdentificacao || 'gemini_analysis';
    console.log(`[Vyntara Vision] Nome identificado por Gemini: ${bestCandidateName} (${Math.round(nameConfidence * 100)}%)`);
  }
  
  if (visionResult.success) {
    const visionNames = visionResult.possibleNames || [];
    if (visionNames.length > 0 && !bestCandidateName) {
      bestCandidateName = visionNames[0];
      nameConfidence = 0.7;
      nameSource = 'vision_web_detection';
      console.log(`[Vyntara Vision] Nome identificado por Vision API: ${bestCandidateName}`);
    }
    
    const webEntityNames = visionResult.webEntities
      .filter(e => e.score > 0.6 && e.description?.split(' ').length >= 2)
      .map(e => e.description);
    
    if (webEntityNames.length > 0 && !bestCandidateName) {
      bestCandidateName = webEntityNames[0];
      nameConfidence = 0.6;
      nameSource = 'vision_web_entity';
    }
  }
  
  if (geminiAnalysis?.elementosTextuais?.nomesProprios?.length > 0 && !bestCandidateName) {
    bestCandidateName = geminiAnalysis.elementosTextuais.nomesProprios[0];
    nameConfidence = 0.5;
    nameSource = 'text_extraction';
  }
  
  const searchTerms = geminiAnalysis?.termosParaBusca || [];
  const empresa = geminiAnalysis?.contextoProfissional?.empresa;
  
  console.log(`[Vyntara Vision] Resultado: nome=${bestCandidateName || 'não identificado'}, confiança=${nameConfidence}, fonte=${nameSource}`);
  
  return {
    success: true,
    source: visionResult.success ? 'vision_api' : 'gemini',
    bestCandidateName,
    nameConfidence,
    nameSource,
    empresa,
    webEntities: visionResult.success ? visionResult.webEntities : [],
    pagesWithMatchingImages: visionResult.success ? visionResult.pagesWithMatchingImages : [],
    faces: visionResult.success ? visionResult.faces : (geminiAnalysis?.hasFace ? [{ confidence: 0.8 }] : []),
    geminiAnalysis,
    searchTerms,
    summary: {
      hasFace: (visionResult.success && visionResult.faces?.length > 0) || geminiAnalysis?.hasFace,
      totalPagesFound: visionResult.success ? visionResult.pagesWithMatchingImages?.length || 0 : 0,
      identifiedName: bestCandidateName,
      identificationConfidence: nameConfidence,
      identificationSource: nameSource,
      empresa,
      searchSuggestions: searchTerms
    }
  };
}

module.exports = { reverseImageSearch };
