
import React from 'react';
import { ViewState } from '../types';
import { runSystemDiagnostics } from '../services/testSuite';

export const Header: React.FC<{ isOnline: boolean; onStartTutorial: () => void }> = ({ isOnline, onStartTutorial }) => {
    
    const handleCheckIntegrity = () => {
        const report = runSystemDiagnostics();
        if (report.errors.length === 0) {
            alert(`SISTEMA ÍNTEGRO\n${report.passed}/${report.total} testes aprovados.\nCálculos e laudos operando 100%.`);
        } else {
            alert(`⚠️ FALHA DETECTADA\n${report.errors.join('\n')}`);
        }
    };

    return (
        <div className="pt-safe pb-2 px-3 sm:px-6 sticky top-0 z-30 transition-colors duration-500 backdrop-blur-md border-b bg-[#0f172a]/90 border-white/5">
            <div className="flex justify-between items-center max-w-2xl mx-auto pt-2">
                
                {/* Logo Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-xl shadow-lg transform -rotate-3 transition-all duration-500 bg-[#1e293b] border border-white/10 shadow-black/40 shrink-0 text-[#f97316]">
                        <i className="fa-solid fa-wrench text-xs sm:text-lg"></i>
                    </div>

                    <div className="flex flex-col select-none">
                        <div className="self-end w-[78%] h-[2px] sm:h-[3px] mb-[-1px] sm:mb-[-2px] z-10 rounded-sm transition-colors duration-500 bg-white"></div>
                        <h1 className="flex items-baseline gap-1 z-0 transform translate-y-[1px] font-heading">
                            <span className="font-bold italic text-[16px] sm:text-[24px] tracking-tighter leading-none text-white">OM</span>
                            <span className="font-bold italic text-[11px] sm:text-[17px] tracking-tighter leading-none text-[#ce1126]">RESFRIADORES</span>
                        </h1>
                        <div className="self-start w-[24%] h-[2px] sm:h-[3px] mt-[-1px] sm:mt-[-2px] bg-[#ce1126] z-10 rounded-sm"></div>
                    </div>
                </div>
                
                {/* Actions Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={onStartTutorial} className="w-7 h-7 rounded-full flex items-center justify-center transition-all border bg-[#1e293b] text-[#fdba74] border-white/10 hover:bg-[#334155] shrink-0">
                        <i className="fa-solid fa-circle-question text-xs"></i>
                    </button>

                    <button 
                        onClick={handleCheckIntegrity}
                        className={`px-1.5 py-0.5 rounded-lg flex items-center gap-1 border cursor-pointer active:scale-95 transition-all shrink-0 ${
                            isOnline 
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[8px] font-bold tracking-wider font-heading text-white/80 uppercase hidden xs:inline-block">V51.4</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

interface NavItemProps {
    id: ViewState;
    icon: string;
    label: string;
    isActive: boolean;
    onClick: (id: ViewState) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, isActive, onClick }) => {
    return (
        <button 
            onClick={() => onClick(id)}
            className={`relative flex flex-col items-center justify-center transition-all duration-300 gap-1 group flex-1`}
        >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                isActive 
                ? 'bg-[#1e293b] text-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-[#f97316]/50' 
                : 'bg-[#0f172a] text-white/90 border border-white/5 hover:border-white/20'
            }`}>
                {/* Neon Ring for Active */}
                {isActive && (
                    <div className="absolute inset-[-1px] rounded-full border border-[#f97316] opacity-40 animate-pulse"></div>
                )}
                <i className={`${icon} text-sm sm:text-base transition-transform duration-300 group-active:scale-90`}></i>
            </div>
            <span className={`text-[6px] sm:text-[8px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-center leading-none transition-all duration-300 font-heading ${
                isActive ? 'text-[#f97316] opacity-100' : 'text-white/30 group-hover:text-white/60'
            }`}>
                {label}
            </span>
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void }> = ({ activeView, setView }) => {
    return (
        <nav className="z-20 pb-safe pt-3 px-2 sm:px-4 bg-[#0a0f1d] border-t border-white/5 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center max-w-2xl mx-auto gap-0.5">
                <NavItem id={ViewState.DIAGNOSTIC} icon="fa-solid fa-headset" label="Suporte" isActive={activeView === ViewState.DIAGNOSTIC} onClick={setView} />
                <NavItem id={ViewState.ERRORS} icon="fa-solid fa-triangle-exclamation" label="Erros" isActive={activeView === ViewState.ERRORS} onClick={setView} />
                <NavItem id={ViewState.CALCULATOR} icon="fa-solid fa-calculator" label="Superaq." isActive={activeView === ViewState.CALCULATOR} onClick={setView} />
                <NavItem id={ViewState.SIZING} icon="fa-solid fa-ruler-combined" label="Dimens." isActive={activeView === ViewState.SIZING} onClick={setView} />
                <NavItem id={ViewState.REPORT} icon="fa-solid fa-file-signature" label="Serviços" isActive={activeView === ViewState.REPORT} onClick={setView} />
                <NavItem id={ViewState.TECH_DATA} icon="fa-solid fa-boxes-stacked" label="Dados" isActive={activeView === ViewState.TECH_DATA} onClick={setView} />
            </div>
        </nav>
    );
};
