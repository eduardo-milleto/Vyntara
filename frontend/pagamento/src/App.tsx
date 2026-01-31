import { PaymentPage } from "./components/PaymentPage";
import { SuccessPage } from "./components/SuccessPage";
import { Timer } from "./components/Timer";

export default function App() {
  const isSuccessPage = window.location.pathname.includes('/sucesso');
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Timer de borda a borda */}
      {!isSuccessPage && <Timer />}
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        {isSuccessPage ? <SuccessPage /> : <PaymentPage />}
      </div>
    </div>
  );
}
