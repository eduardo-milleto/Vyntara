import { motion } from 'motion/react';
import { Download, FileSpreadsheet, FileText, Image } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  onExport: (format: 'excel' | 'csv' | 'pdf' | 'image') => void;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const exportOptions = [
    { format: 'excel' as const, label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: '#10b981' },
    { format: 'csv' as const, label: 'CSV', icon: FileText, color: '#3b82f6' },
    { format: 'pdf' as const, label: 'PDF', icon: FileText, color: '#ef4444' },
    { format: 'image' as const, label: 'Imagem (.png)', icon: Image, color: '#f59e0b' },
  ];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-[#d4af37]/30 rounded-2xl backdrop-blur-xl transition-all flex items-center gap-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Download className="w-5 h-5 text-[#d4af37]" />
        <span>Exportar</span>
      </motion.button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-2xl border border-[#d4af37]/30 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {exportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.format}
                  onClick={() => {
                    onExport(option.format);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-all text-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: option.color }} />
                  </div>
                  <span className="text-sm">{option.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}
