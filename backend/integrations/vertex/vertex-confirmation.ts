import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';

// ✅ VERTEX AI ISOLADO PARA CONFIRMAÇÕES (SERVIDOR 5000)
let vertexAI: VertexAI;
let confirmationModel: any;

try {
  if (process.env.GOOGLE_PROJECT_ID) {
    console.log('🔑 [Confirmation-AI] Configurando credenciais Google Cloud...');
    
    // Criar arquivo de credenciais dinamicamente
    const credentialsPath = path.resolve('./server/google-credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      const credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
      };
      
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      console.log(`📁 [Confirmation-AI] Arquivo criado em: ${credentialsPath}`);
    }
    
    // Configurar GOOGLE_APPLICATION_CREDENTIALS
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

    // Inicializar Vertex AI
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_PROJECT_ID,
      location: "us-central1",
    });

    confirmationModel = vertexAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, // Baixa para confirmações precisas
        responseMimeType: "application/json",
      },
    });

    console.log("✅ [Confirmation-AI] Vertex AI inicializado para confirmações");
    console.log(`🌎 [Confirmation-AI] Projeto: ${process.env.GOOGLE_PROJECT_ID}`);
    console.log(`📍 [Confirmation-AI] Localização: us-central1`);
    console.log(`🔑 [Confirmation-AI] Modelo: gemini-2.5-flash`);

  } else {
    console.log("⚠️ [Confirmation-AI] GOOGLE_PROJECT_ID não configurado - confirmações usarão fallback");
  }
} catch (error) {
  console.error("❌ [Confirmation-AI] Erro ao inicializar:", error.message);
  console.log("🔄 [Confirmation-AI] Confirmações usarão análise por palavras-chave");
}

export { vertexAI, confirmationModel };