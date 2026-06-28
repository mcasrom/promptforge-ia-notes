import { motion } from 'motion/react';
import { ArrowRight, Library, Terminal, ShieldCheck, Cpu } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
  onExploreClick: () => void;
}

export default function Hero({ onCtaClick, onExploreClick }: HeroProps) {
  return (
    <div className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 border-b border-[#27272a] bg-grid-pattern">
      {/* Background gradients for radial glow */}
      <div className="absolute top-12 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-24 right-1/4 translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center space-y-6 md:space-y-8 relative z-10">
        {/* Subtle top chip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>v1.0 is now live on Vercel & Supabase</span>
        </motion.div>

        {/* Title display */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold text-4xl md:text-7xl text-white tracking-tighter leading-[1.1] max-w-3xl mx-auto"
          >
            Build, share, and <br/> refine <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI intelligence.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            The ultra-fast notes platform for the LLM era. Deploy your prompt library with Supabase and Next.js in minutes.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={onCtaClick}
            id="hero-cta-join"
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-base cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-200"
          >
            <span>Join for Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreClick}
            id="hero-cta-explore"
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-white rounded-xl font-bold text-base transition-all duration-200 cursor-pointer"
          >
            <Library className="w-4 h-4 text-blue-400" />
            <span>Explore Feed</span>
          </button>
        </motion.div>

        {/* Powered by & Bento Props */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-6 md:pt-10"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 opacity-60 max-w-xl mx-auto border-t border-[#27272a] pt-8 pb-4 text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Powered by</span>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <span className="text-xs font-semibold hover:text-white transition-colors">Vercel</span>
            <span className="text-xs font-semibold hover:text-white transition-colors">Supabase</span>
            <span className="text-xs font-semibold hover:text-white transition-colors">Next.js 15</span>
            <span className="text-xs font-semibold hover:text-white transition-colors">Tailwind CSS</span>
          </div>
        </motion.div>

        {/* Bento grid characteristics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 text-left"
        >
          <div className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/30 transition-all duration-200">
            <Terminal className="w-5 h-5 text-blue-400 mb-3" />
            <h3 className="text-white font-semibold mb-1 text-sm">Markdown Editor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Write and preview complex prompts with full code block support.</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/30 transition-all duration-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="text-white font-semibold mb-1 text-sm">Secure Community</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Moderate notes, highlight definitive prompts, and filter by tags in real-time.</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/30 transition-all duration-200">
            <Cpu className="w-5 h-5 text-purple-400 mb-3" />
            <h3 className="text-white font-semibold mb-1 text-sm">In-Depth Discussions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Generate nested threads, report Ollama errors, or share system instructions.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
