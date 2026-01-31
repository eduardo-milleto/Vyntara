import { Search, Image, Upload, Sparkles, X } from "lucide-react";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import logo from "figma:asset/cba8d20263dcc09d1045a7b736399ab368c1686f.png";

interface HeroProps {
  onSearch: (query: string) => void;
  onSearchStart?: () => void;
  onInvestigate?: (query: string) => void;
}

export function Hero({ onSearch, onSearchStart, onInvestigate }: HeroProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "image">("text");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    if (onInvestigate) {
      onInvestigate(searchValue.trim());
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleImageSearch = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setAnalysisResult("Analisando imagem e identificando pessoa...");
    
    try {
      const response = await fetch("https://vendassemlimite.com.br/api/vyntara/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage })
      });
      
      const data = await response.json();
      console.log("Resultado da análise:", data);
      
      if (data.success) {
        if (data.identifiedName && data.hasReport && data.osintReport) {
          setAnalysisResult(`Pessoa identificada: ${data.identifiedName}. Gerando relatório...`);
          
          localStorage.setItem('vyntaraReport', JSON.stringify({
            identifiedName: data.identifiedName,
            confidence: data.nameConfidence,
            source: data.nameSource,
            empresa: data.empresa,
            report: data.osintReport,
            timestamp: Date.now()
          }));
          
          setTimeout(() => {
            window.location.href = '/vyntara/resultado';
          }, 1500);
          
        } else if (data.identifiedName) {
          setAnalysisResult(`Pessoa identificada: ${data.identifiedName}. Relatório não disponível.`);
          setSearchValue(data.identifiedName);
          
          setTimeout(() => {
            setSearchMode("text");
            setSelectedImage(null);
            setAnalysisResult(null);
          }, 3000);
          
        } else {
          const suggestions = data.searchSuggestions || [];
          const gemini = data.geminiAnalysis;
          
          let message = data.message || "Não foi possível identificar o nome da pessoa.";
          
          if (suggestions.length > 0) {
            message += ` Sugestões: ${suggestions.slice(0, 3).join(", ")}`;
            setSearchValue(suggestions[0]);
          }
          
          if (gemini?.pessoaDescricao) {
            const desc = gemini.pessoaDescricao;
            message = `${desc.genero || 'Pessoa'}, ${desc.idadeAproximada || 'idade não identificada'}. ${message}`;
          }
          
          setAnalysisResult(message);
          
          setTimeout(() => {
            if (suggestions.length > 0) {
              setSearchMode("text");
              setSelectedImage(null);
              setAnalysisResult(null);
            }
          }, 5000);
        }
      } else {
        setAnalysisResult("Erro ao analisar imagem: " + (data.error || data.message || "Erro desconhecido"));
      }
    } catch (error) {
      setAnalysisResult("Erro ao conectar com o servidor");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetImageMode = () => {
    setSelectedImage(null);
    setImageFileName("");
    setAnalysisResult(null);
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden transition-all duration-800 ${isSearching ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#67EDFC] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#A557FA] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[#5582F3] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl w-full mx-auto text-center">
        {/* Logo/Brand */}
        <div className="mb-12 flex justify-center">
          <img src={logo} alt="VYNTARA" className="h-96 w-auto" />
        </div>

        {/* Main Heading */}
        <h1 className="mb-6">
          <span className="block text-[#FDFDFE] mb-2" style={{ fontSize: '3.5rem', lineHeight: '1.1' }}>
            Inteligência Pública
          </span>
          <span 
            className="block bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] bg-clip-text text-transparent"
            style={{ fontSize: '3.5rem', lineHeight: '1.1' }}
          >
            Unificada
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#E3E2E4] mb-10 max-w-2xl mx-auto" style={{ fontSize: '1.25rem' }}>
          Revele a verdade pública sobre qualquer pessoa ou empresa em minutos. 
          Due diligence automatizada com inteligência artificial.
        </p>

        {/* Ultra Modern Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full bg-white/5 backdrop-blur-xl border border-[#67EDFC]/30 p-1.5 shadow-[0_0_30px_rgba(103,237,252,0.15)]">
            <button
              type="button"
              onClick={() => { setSearchMode("text"); resetImageMode(); }}
              className={`relative flex items-center gap-2.5 px-6 py-3 rounded-full font-medium text-sm transition-all duration-500 ease-out ${
                searchMode === "text"
                  ? "bg-gradient-to-r from-[#67EDFC]/20 to-[#5582F3]/20 text-[#67EDFC] shadow-[0_0_25px_rgba(103,237,252,0.4)]"
                  : "text-[#E3E2E4]/60 hover:text-[#E3E2E4]"
              }`}
            >
              <Search className={`w-4 h-4 transition-all duration-300 ${searchMode === "text" ? "scale-110" : ""}`} />
              <span>Texto</span>
              {searchMode === "text" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#67EDFC]/10 to-[#5582F3]/10 animate-pulse"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDevModal(true)}
              className="relative flex items-center gap-2.5 px-6 py-3 rounded-full font-medium text-sm transition-all duration-500 ease-out text-[#E3E2E4]/60 hover:text-[#E3E2E4]"
            >
              <Image className="w-4 h-4 transition-all duration-300" />
              <span>Imagem</span>
            </button>
          </div>
        </div>

        {/* Unified Search Container */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className={`relative group transition-all duration-500 ${isFocused || isDragOver ? 'scale-[1.02]' : ''}`}>
            {/* Glow Effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r rounded-2xl blur-lg transition-all duration-500 ${
              searchMode === "text" 
                ? "from-[#67EDFC] via-[#5582F3] to-[#A557FA]" 
                : "from-[#A557FA] via-[#5582F3] to-[#67EDFC]"
            } ${isFocused || isDragOver ? 'opacity-50' : 'opacity-0 group-hover:opacity-30'}`}></div>
            
            {/* Main Container */}
            <div className="relative bg-gradient-to-br from-[#190E68]/40 to-[#06406E]/40 backdrop-blur-2xl border border-[#67EDFC]/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
              
              {/* Text Search Mode */}
              <div className={`transition-all duration-500 ease-out ${
                searchMode === "text" 
                  ? "opacity-100 translate-y-0 h-auto" 
                  : "opacity-0 -translate-y-4 h-0 overflow-hidden pointer-events-none absolute inset-0"
              }`}>
                <form onSubmit={handleSearch} className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-6 h-6 text-[#67EDFC]" />
                      <div className="absolute inset-0 bg-[#67EDFC] rounded-full blur-md opacity-30 animate-pulse"></div>
                    </div>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Digite um nome completo, CPF ou CNPJ"
                      className="flex-1 bg-transparent border-none outline-none placeholder-[#E3E2E4]/50 text-xl font-semibold tracking-wide"
                      style={{ color: '#67EDFC', caretColor: '#67EDFC' }}
                    />
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] text-[#060411] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(103,237,252,0.5)] transition-all duration-300 hover:scale-105"
                    >
                      Investigar
                    </button>
                  </div>
                  
                  {/* AI Indicator */}
                  <div className="mt-4 flex items-center gap-2 text-[#E3E2E4]/70 text-sm">
                    <div className="relative">
                      <div className="w-2 h-2 bg-[#67EDFC] rounded-full"></div>
                      <div className="absolute inset-0 bg-[#67EDFC] rounded-full animate-ping opacity-50"></div>
                    </div>
                    <span>IA interpretando dados de fontes públicas em tempo real</span>
                  </div>
                </form>
              </div>

              {/* Image Search Mode */}
              <div className={`transition-all duration-500 ease-out ${
                searchMode === "image" 
                  ? "opacity-100 translate-y-0 h-auto" 
                  : "opacity-0 translate-y-4 h-0 overflow-hidden pointer-events-none absolute inset-0"
              }`}>
                <div className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {!selectedImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-8 ${
                        isDragOver 
                          ? "border-[#A557FA] bg-[#A557FA]/10 scale-[1.02]" 
                          : "border-[#67EDFC]/40 hover:border-[#A557FA]/60 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A557FA]/20 to-[#5582F3]/20 flex items-center justify-center transition-all duration-300 ${isDragOver ? 'scale-110' : ''}`}>
                            <Upload className="w-8 h-8 text-[#A557FA]" />
                          </div>
                          <div className="absolute inset-0 bg-[#A557FA] rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-[#FDFDFE] font-medium text-lg mb-1">
                            {isDragOver ? "Solte a imagem aqui" : "Arraste uma imagem ou clique para selecionar"}
                          </p>
                          <p className="text-[#E3E2E4]/50 text-sm">PNG, JPG ou WEBP até 5MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Preview */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={selectedImage}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-xl border-2 border-[#A557FA]/40"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-[#A557FA]/20 to-transparent rounded-xl"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[#FDFDFE] font-medium truncate">{imageFileName}</p>
                          <p className="text-[#E3E2E4]/50 text-sm">Pronto para análise</p>
                        </div>
                        <button
                          onClick={resetImageMode}
                          className="px-4 py-2 text-[#E3E2E4]/60 hover:text-[#FDFDFE] transition-colors"
                        >
                          Trocar
                        </button>
                      </div>

                      {/* Analysis Result */}
                      {analysisResult && (
                        <div className="p-4 bg-gradient-to-r from-[#67EDFC]/10 to-[#A557FA]/10 rounded-xl border border-[#67EDFC]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#67EDFC]" />
                            <span className="text-[#67EDFC] text-sm font-medium">Análise da IA</span>
                          </div>
                          <p className="text-[#E3E2E4] text-sm">{analysisResult}</p>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={handleImageSearch}
                        disabled={isAnalyzing}
                        className="w-full py-4 bg-gradient-to-r from-[#A557FA] via-[#5582F3] to-[#67EDFC] text-[#060411] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(165,87,250,0.5)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-[#060411]/30 border-t-[#060411] rounded-full animate-spin"></div>
                            Analisando com IA...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Analisar e Investigar
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* AI Indicator for Image Mode */}
                  <div className="mt-4 flex items-center gap-2 text-[#E3E2E4]/70 text-sm">
                    <div className="relative">
                      <div className="w-2 h-2 bg-[#A557FA] rounded-full"></div>
                      <div className="absolute inset-0 bg-[#A557FA] rounded-full animate-ping opacity-50"></div>
                    </div>
                    <span>Reconhecimento visual com inteligência artificial avançada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-[#E3E2E4]/60 text-sm mb-16">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#67EDFC] rounded-full"></div>
            <span>100% Legal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#5582F3] rounded-full"></div>
            <span>Dados Públicos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#A557FA] rounded-full"></div>
            <span>IA Avançada</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[#67EDFC]/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-[#67EDFC] rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Modal Em Desenvolvimento - Portal para body */}
      {showDevModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          {/* Backdrop */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(6, 4, 17, 0.85)',
              backdropFilter: 'blur(12px)'
            }}
            onClick={() => setShowDevModal(false)}
          ></div>
          
          {/* Modal */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '400px'
          }}>
            {/* Modal Content */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(25, 14, 104, 0.98) 0%, rgba(6, 64, 110, 0.98) 100%)',
              border: '1px solid rgba(103, 237, 252, 0.4)',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 0 40px rgba(103, 237, 252, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowDevModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  color: 'rgba(227, 226, 228, 0.6)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
              
              {/* Icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, rgba(165, 87, 250, 0.3) 0%, rgba(85, 130, 243, 0.3) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Image style={{ width: '40px', height: '40px', color: '#A557FA' }} />
                </div>
              </div>
              
              {/* Title */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '0.75rem',
                background: 'linear-gradient(90deg, #67EDFC, #5582F3, #A557FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Em Desenvolvimento
              </h3>
              
              {/* Description */}
              <p style={{
                color: 'rgba(227, 226, 228, 0.8)',
                textAlign: 'center',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                A busca por imagem está sendo desenvolvida e estará disponível em breve. Por enquanto, utilize a busca por texto.
              </p>
              
              {/* Button */}
              <button
                onClick={() => setShowDevModal(false)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(90deg, #67EDFC, #5582F3, #A557FA)',
                  color: '#060411',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s'
                }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
