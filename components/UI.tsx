
import React, { useState } from 'react';

// --- CARD INDUSTRIAL ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`relative rounded-lg p-4 sm:p-5 shadow-2xl transition-all duration-300 animate-slide-up 
            bg-[#242424] border border-[#3d3d3d] shadow-black/60 ${className}`}>
            {children}
        </div>
    );
};

// --- TÍTULO DA SEÇÃO ---
export const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => {
    return (
        <h2 className="text-[10px] font-black mb-3 flex items-center gap-2 uppercase tracking-[0.2em] text-white/90 select-none">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-[#4d4d4d] text-[#1abc9c] border border-[#5d5d5d] shadow-sm">
                <i className={`${icon} text-xs`}></i>
            </span>
            {title}
        </h2>
    );
};

// --- BOTÃO INDUSTRIAL ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

const BUTTON_VARIANTS = {
    primary: "bg-[#bdc3c7] text-[#1a1a1a] border-white/50 hover:bg-white shadow-white/10 active:bg-gray-400",
    secondary: "bg-[#4d4d4d] text-white border-[#5d5d5d] hover:bg-[#5d5d5d] hover:border-[#1abc9c]/50 active:bg-[#3d3d3d]",
    danger: "bg-red-900/50 text-red-100 border-red-800 hover:bg-red-900/70 active:bg-red-900/80",
    success: "bg-[#1abc9c] text-white border-[#16a085] hover:bg-[#16a085] active:bg-[#148f77]"
};

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    return (
        <button 
            className={`relative w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-lg font-bold text-[10px] sm:text-xs tracking-widest transition-transform duration-100 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 overflow-hidden border uppercase disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`} 
            {...props}
        >
            {children}
        </button>
    );
};

// --- INPUT INDUSTRIAL ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => {
    return (
        <div className="mb-3 sm:mb-4 w-full group">
            {label && <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1 sm:mb-1.5 ml-1 transition-colors text-white/70 group-focus-within:text-[#1abc9c]">
                {label}
            </label>}
            <input 
                className={`w-full p-3 sm:p-3.5 rounded-lg text-xs sm:text-sm font-medium outline-none transition-colors duration-300 border 
                bg-[#2a2a2a] border-[#4a4a4a] text-white placeholder-gray-500 
                focus:border-[#1abc9c] focus:bg-[#333333] ${className}`}
                {...props}
            />
        </div>
    );
};

// --- SELECT INDUSTRIAL ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => {
    return (
        <div className="mb-3 sm:mb-4 w-full group">
            {label && <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1 sm:mb-1.5 ml-1 transition-colors text-white/70 group-focus-within:text-[#1abc9c]">
                {label}
            </label>}
            <div className="relative">
                <select 
                    className={`w-full p-3 sm:p-3.5 rounded-lg text-xs sm:text-sm font-medium outline-none transition-colors duration-300 appearance-none border cursor-pointer 
                    bg-[#2a2a2a] border-[#4a4a4a] text-white 
                    focus:border-[#1abc9c] focus:bg-[#333333] ${className}`}
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
            bg-[#2a2a2a] border-[#4d4d4d] hover:border-[#1abc9c]/50 hover:bg-[#333333]">
            
            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-300 bg-[#4d4d4d] group-hover:bg-[#1abc9c]"></div>

            <div className="flex items-center justify-center transition-colors duration-300 text-white/60 group-hover:text-[#1abc9c]">
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
            <div className="mt-6 p-4 rounded-lg text-center border animate-pulse bg-[#2a2a2a] border-[#3d3d3d]">
                <div className="flex flex-row items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full animate-spin border-2 border-t-transparent border-[#1abc9c]"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Sincronizando...</p>
                </div>
            </div>
        );
    }
    if (!content) return null;

    const formattedContent = content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        
        const parts = line.split(/(\*\*.*?\*\*)|(⚠️.*?):|(🔧.*?):|(✅.*?):/g);
        return (
            <p key={i} className="min-h-[1.2em] mb-0.5">
                {parts.map((part, j) => {
                    if (part === undefined) return null;
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-[#1abc9c] font-bold">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('⚠️')) {
                        return <span key={j} className="text-red-400 font-bold">{part}</span>;
                    }
                    if (part.startsWith('🔧')) {
                        return <span key={j} className="text-[#bdc3c7] font-bold">{part}</span>;
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
        <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden shadow-xl animate-slide-up border bg-[#1a1a1a] border-[#3d3d3d] shadow-black/50">
            {/* CABEÇALHO */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center border-b bg-[#242424] border-[#3d3d3d]">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse bg-[#1abc9c]"></div>
                    <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#1abc9c] truncate max-w-[120px] sm:max-w-[150px]">{title}</h3>
                </div>
                <button 
                    onClick={handleCopy}
                    className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 sm:gap-1.5 ${
                        copied ? 'text-emerald-400' : 'text-white/60 hover:text-[#1abc9c]'
                    }`}
                >
                    <i className={`fa-regular ${copied ? 'fa-circle-check' : 'fa-copy'}`}></i> 
                    {copied ? 'OK!' : 'COPIAR'}
                </button>
            </div>
            
            {/* CONTEÚDO */}
            <div className="p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-gray-300 break-words">
                {formattedContent}
            </div>
        </div>
    );
};

// --- WATERMARK SECURITY ---
export const Watermark: React.FC<{ text: string }> = ({ text }) => {
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
};
