import { VertexAI } from "@google-cloud/vertexai";

// Configuração simples do Vertex AI
let vertexAI = null;
let normalizerModel = null;

try {
    if (process.env.GOOGLE_PROJECT_ID) {
        // VertexAI usará automaticamente GOOGLE_APPLICATION_CREDENTIALS se configurado
        vertexAI = new VertexAI({
            project: process.env.GOOGLE_PROJECT_ID,
            location: "us-central1",
        });

        normalizerModel = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
            },
        });

        console.log("✅ Vertex AI inicializado com sucesso");
        console.log(`🌎 Projeto: ${process.env.GOOGLE_PROJECT_ID}`);
        console.log(`📍 Localização: us-central1`);
        console.log(
            `🔑 Credenciais: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? "arquivo configurado" : "padrão do sistema"}`,
        );
    } else {
        console.log(
            "⚠️ GOOGLE_PROJECT_ID não configurado - Vertex AI desabilitado",
        );
    }
} catch (error) {
    console.error("❌ Erro ao inicializar Vertex AI:", error.message);
    console.log("🔄 Servidor iniciará sem IA (modo fallback)");
}

export { vertexAI, normalizerModel };
