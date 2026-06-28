import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-center gap-3 py-3 px-4 rounded-xl border shadow-xl ${
              type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20'
                : type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/20'
                : 'bg-zinc-950/90 border-[#27272a] text-zinc-200'
            }`}
          >
            {type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}

            <span className="text-sm font-medium pr-2">{message}</span>

            <button
              onClick={onClose}
              className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
