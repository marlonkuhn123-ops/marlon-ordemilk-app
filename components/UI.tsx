
import React, { useState } from 'react';

// --- CARD INDUSTRIAL ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`relative rounded-[28px] p-4 sm:p-5 shadow-xl transition-all duration-300 animate-slide-up 
            bg-[#3b4c61]/80 backdrop-blur-xl border border-[#4a5c73] ${className}`}>
            {children}
        </div>
    );
};

// --- TÍTULO DA SEÇÃO ---
export const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => {
    return (
        <h2 className="text-[12px] sm:text-[14px] font-semibold mb-2 flex items-center gap-2 uppercase tracking-[0.1em] text-[#ffffff] select-none font-heading">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#2a3646] text-[#00d9ff] border border-[#4a5c73] shadow-sm">
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
    primary: "bg-[#ff6600] text-white border-transparent hover:bg-[#ff8833] shadow-[0_0_15px_rgba(255,102,0,0.4)] active:scale-[0.98]",
    secondary: "bg-[#2a3646] text-[#ffffff] border-[#4a5c73] hover:bg-[#344458] hover:border-[#00d9ff]/50 active:bg-[#1a202c]",
    danger: "bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/30",
    success: "bg-[#00ff88] text-[#050912] border-[#00ff88] hover:bg-[#00e67a] shadow-[0_0_10px_rgba(0,255,136,0.3)]"
};

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    return (
        <button 
            className={`relative w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-bold text-[10px] sm:text-xs tracking-widest transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden border uppercase disabled:opacity-50 disabled:cursor-not-allowed font-heading ${BUTTON_VARIANTS[variant]} ${className}`} 
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
            {label && <label className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mb-1 sm:mb-1.5 ml-1 transition-colors text-[#9ca7b8] group-focus-within:text-[#00d9ff] font-heading">
                {label}
            </label>}
            <input 
                className={`w-full p-3 sm:p-3.5 rounded-[16px] text-[16px] font-light outline-none transition-colors duration-300 border 
                bg-[#2a3646] border-[#4a5c73] text-[#ffffff] placeholder-[#6b7a8d] 
                focus:border-[#00d9ff] focus:bg-[#344458] ${className}`}
                {...props}
            />
        </div>
    );
};

// --- SELECT INDUSTRIAL ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => {
    return (
        <div className="mb-3 sm:mb-4 w-full group">
            {label && <label className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mb-1 sm:mb-1.5 ml-1 transition-colors text-[#9ca7b8] group-focus-within:text-[#00d9ff] font-heading">
                {label}
            </label>}
            <div className="relative">
                <select 
                    className={`w-full p-3 sm:p-3.5 rounded-[16px] text-[16px] font-medium outline-none transition-colors duration-300 appearance-none border cursor-pointer min-h-[44px]
                    bg-[#2a3646] border-[#4a5c73] text-[#ffffff] 
                    focus:border-[#00d9ff] focus:bg-[#344458] ${className}`}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#E8EAF6]/50">
                    <i className="fa-solid fa-chevron-down text-[10px] sm:text-xs"></i>
                </div>
            </div>
        </div>
    );
};

// --- FILE UPLOAD INDUSTRIAL ---
export const FileUpload: React.FC<{ onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string; icon?: string }> = ({ onChange, label, icon = "fa-camera" }) => {
    return (
        <label className="group relative flex items-center justify-center gap-3 w-full py-3 px-4 rounded-[16px] border cursor-pointer transition-all duration-300 mb-4 overflow-hidden active:scale-[0.98]
            bg-[#2a3646] border-[#4a5c73] hover:border-[#00d9ff]/50 hover:bg-[#344458]">
            
            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-300 bg-[#4a5c73] group-hover:bg-[#00d9ff]"></div>

            <div className="flex items-center justify-center transition-colors duration-300 text-[#9ca7b8] group-hover:text-[#00d9ff]">
                <i className={`fa-solid ${icon} text-sm`}></i>
            </div>
            
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 text-[#E8EAF6] group-hover:text-white font-heading">
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
            <div className="mt-6 p-4 rounded-xl text-center border animate-pulse bg-[#111827] border-[#122837]">
                <div className="flex flex-row items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full animate-spin border-2 border-t-transparent border-[#00E5FF]"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#E8EAF6]/60 font-heading">Sincronizando...</p>
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
                        return <strong key={j} className="text-[#00E5FF] font-bold">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('⚠️')) {
                        return <span key={j} className="text-red-400 font-bold">{part}</span>;
                    }
                    if (part.startsWith('🔧')) {
                        return <span key={j} className="text-[#FF8F00] font-bold">{part}</span>;
                    }
                    if (part.startsWith('✅')) {
                        return <span key={j} className="text-[#00d9ff] font-bold">{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    });

    return (
        <div className="mt-4 sm:mt-6 rounded-[16px] overflow-hidden shadow-xl animate-slide-up border bg-[#2a3646] border-[#4a5c73] shadow-black/30">
            {/* CABEÇALHO */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center border-b bg-[#3b4c61]/50 border-[#4a5c73]">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse bg-[#00d9ff]"></div>
                    <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#00d9ff] truncate max-w-[120px] sm:max-w-[150px] font-heading">{title}</h3>
                </div>
                <button 
                    onClick={handleCopy}
                    className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 sm:gap-1.5 font-heading ${
                        copied ? 'text-[#00d9ff]' : 'text-[#9ca7b8] hover:text-[#00d9ff]'
                    }`}
                >
                    <i className={`fa-regular ${copied ? 'fa-circle-check' : 'fa-copy'}`}></i> 
                    {copied ? 'OK!' : 'COPIAR'}
                </button>
            </div>
            
            {/* CONTEÚDO */}
            <div className="p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-[#ffffff] break-words font-sans">
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
