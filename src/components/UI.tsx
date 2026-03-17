import React, { useState } from 'react';
import { motion } from 'framer-motion';

// --- CARD INDUSTRIAL ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`relative rounded-xl p-4 sm:p-5 shadow-xl bg-techPanel border border-techBorder ${className}`}>
            {children}
        </div>
    );
};

// --- TÍTULO DA SEÇÃO ---
export const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-techPanel border border-techBorder flex items-center justify-center text-brand">
                <i className={`${icon} text-sm`}></i>
            </div>
            <h2 className="text-sm font-black italic tracking-widest text-white uppercase">{title}</h2>
        </div>
    );
};

// --- BOTÃO INDUSTRIAL ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

const BUTTON_VARIANTS = {
    primary: "bg-brand text-white hover:bg-[#FFB040] transition-all border-none shadow-[0_8px_25px_rgba(255,159,26,0.35),inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.25)]",
    secondary: "bg-techPanel text-[#E8EEF5] hover:bg-[#263140] active:bg-[#121821] transition-colors border border-techBorder shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
    danger: "bg-red-600 text-white hover:bg-red-700 transition-colors border-none shadow-[0_8px_20px_rgba(220,38,38,0.45),inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.25)]",
    success: "bg-electricBlue text-white hover:bg-blue-600 transition-colors border-none shadow-[0_8px_20px_rgba(59,130,246,0.45),inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.25)]"
};

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    return (
        <button
            className={`w-full py-4 px-5 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all duration-200 active:scale-[0.98] active:translate-y-[2px] flex items-center justify-center gap-2 uppercase ${BUTTON_VARIANTS[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// --- INPUT INDUSTRIAL ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => {
    return (
        <div className="mb-4 sm:mb-5 w-full group">
            {label && <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 transition-colors text-white/50 group-focus-within:text-brand">
                {label}
            </label>}
            <input
                className={`w-full p-3.5 sm:p-4 rounded-xl text-sm sm:text-base outline-none transition-all duration-300 border 
                bg-techDark border-techBorder text-[#E8EEF5] placeholder-gray-500 
                focus:border-brand focus:ring-1 focus:ring-brand/30 ${className}`}
                {...props}
            />
        </div>
    );
};

// --- SELECT INDUSTRIAL ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => {
    return (
        <div className="mb-3 sm:mb-4 w-full group">
            {label && <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1 sm:mb-1.5 ml-1 transition-colors text-white/60 group-focus-within:text-brand">
                {label}
            </label>}
            <div className="relative">
                <select
                    className={`w-full p-3 sm:p-3.5 rounded-lg text-xs sm:text-sm font-medium outline-none transition-colors duration-300 appearance-none border cursor-pointer 
                    bg-techPanel border-techBorder text-[#E8EEF5] 
                    focus:border-brand focus:bg-techDark ${className}`}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                    <i className="fa-solid fa-chevron-down text-[10px] sm:text-xs"></i>
                </div>
            </div>
        </div>
    );
};

// --- FILE UPLOAD INDUSTRIAL ---
export const FileUpload: React.FC<{ onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string; icon?: string }> = ({ onChange, label, icon = "fa-camera" }) => {
    return (
        <label className="group relative flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border cursor-pointer transition-all duration-300 mb-4 overflow-hidden active:scale-[0.98]
            bg-techPanel border-techBorder hover:border-electricBlue/50 hover:bg-techDark">

            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-300 bg-techBorder group-hover:bg-electricBlue"></div>

            <div className="flex items-center justify-center transition-colors duration-300 text-white/60 group-hover:text-electricBlue">
                <i className={`fa-solid ${icon} text-sm`}></i>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 text-white group-hover:text-white">
                {label}
            </span>

            <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
    );
};

// --- AI OUTPUT BOX INDUSTRIAL ---
export const AIOutputBox: React.FC<{ content: string; isLoading: boolean; title?: string }> = ({ content, isLoading, title = "ANÁLISE DO SISTEMA" }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="mt-6 p-4 rounded-lg text-center border animate-pulse bg-techPanel border-techBorder">
                <div className="flex flex-row items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full animate-spin border-2 border-t-transparent border-electricBlue"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Sincronizando...</p>
                </div>
            </div>
        );
    }
    if (!content) return null;

    const formattedContent = content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const parts = line.split(/(\*\*.*?\*\*)|(\[MARCA\].*?\[\/MARCA\])|(\bRESULTADO:?\s*[-\d.,]+\s*K\b)/gi);
        return (
            <p key={i} className="min-h-[1.2em] mb-0.5">
                {parts.map((part, j) => {
                    if (!part) return null;

                    const pUp = part.toUpperCase();
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-electricBlue font-bold">{part.slice(2, -2)}</strong>;
                    }
                    if (pUp.startsWith('[MARCA]') && pUp.endsWith('[/MARCA]')) {
                        const val = part.slice(7, -8).trim();
                        return <span key={j} className="bg-brand text-white font-black px-2 py-0.5 rounded-md text-[13px] sm:text-[14px] mx-1 border border-orange-400/50 shadow-[0_0_12px_rgba(249,115,22,0.6)] uppercase tracking-wider">{val}</span>;
                    }
                    if (pUp.startsWith('RESULTADO:') && pUp.endsWith('K')) {
                        const val = pUp.replace('RESULTADO:', '').trim();
                        return <span key={j} className="bg-brand text-white font-black px-2 py-0.5 rounded-md text-[13px] sm:text-[14px] mx-1 border border-orange-400/50 shadow-[0_0_12px_rgba(249,115,22,0.6)] uppercase tracking-wider">{val}</span>;
                    }
                    if (part.startsWith('⚠️')) {
                        return <span key={j} className="text-brand font-bold">{part}</span>;
                    }
                    if (part.startsWith('🔧')) {
                        return <span key={j} className="text-slate-400 font-bold">{part}</span>;
                    }
                    if (part.startsWith('✅')) {
                        return <span key={j} className="text-emerald-400 font-bold">{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    });

    return (
        <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden shadow-xl animate-slide-up border bg-techDark border-techBorder shadow-black/50">
            {/* CABEÇALHO */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center border-b bg-techPanel border-techBorder">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse bg-electricBlue"></div>
                    <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-electricBlue truncate max-w-[120px] sm:max-w-[150px]">{title}</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 sm:gap-1.5 ${copied ? 'text-emerald-400' : 'text-white/60 hover:text-electricBlue'
                        }`}
                >
                    <i className={`fa-regular ${copied ? 'fa-circle-check' : 'fa-copy'}`}></i>
                    {copied ? 'OK!' : 'COPIAR'}
                </button>
            </div>

            {/* CONTEÚDO */}
            <div className="p-3 sm:p-4 text-[12px] sm:text-sm leading-relaxed text-[#E8EEF5]/90 break-words">
                {formattedContent}
            </div>
        </div>
    );
};

// --- WATERMARK SECURITY ---
export const Watermark: React.FC<{ text: string }> = React.memo(({ text }) => {
    if (!text) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden opacity-[0.04] select-none">
            <div className="absolute inset-0 flex flex-wrap gap-x-32 gap-y-24 p-10 justify-center items-center rotate-[-25deg] scale-125">
                {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-white font-black text-xl whitespace-nowrap uppercase tracking-[0.4em]">
                            {text} • {new Date().toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-white font-bold text-[8px] whitespace-nowrap uppercase tracking-[0.8em] mt-1">
                            ORDEMILK TECH • PROPRIEDADE PRIVADA
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});
