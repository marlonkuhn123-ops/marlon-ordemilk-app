import React from 'react';
import { ViewState } from '../types';
import { runSystemDiagnostics } from '../services/testSuite';

export const Header: React.FC<{ isOnline: boolean; onStartTutorial: () => void }> = ({ isOnline, onStartTutorial }) => {
    const handleCheckIntegrity = () => {
        const report = runSystemDiagnostics();
        if (report.errors.length === 0) {
            alert(`✅ SISTEMA ÍNTEGRO\n${report.passed}/${report.total} testes aprovados.\nCálculos e laudos operando 100%.`);
        } else {
            alert(`🚨 FALHA DETECTADA\n${report.errors.join('\n')}`);
        }
    };

    return (
        <header className="shrink-0 pt-safe px-5 sm:px-6 z-30 relative w-full border-b border-[#2a3646]/30 bg-[#263243]/95 backdrop-blur-md">
            <div className="w-full pt-3 pb-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-[54px] h-[54px] rounded-[18px] bg-white border-2 border-[#00d9ff] shadow-[0_0_24px_rgba(0,217,255,0.35)] flex items-center justify-center">
                                <div className="w-[36px] h-[36px] rounded-full bg-[#111827] flex items-center justify-center border border-[#2a3646]">
                                    <i className="fa-solid fa-robot text-[#00d9ff] text-[18px]"></i>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#263243] border border-[#4a5c73] flex items-center justify-center shadow-lg">
                                <i className="fa-solid fa-headset text-[9px] text-[#ff6600]"></i>
                            </div>
                        </div>

                        <div className="min-w-0 select-none">
                            <h1 className="flex items-baseline gap-1 font-heading">
                                <span className="font-black italic text-[18px] sm:text-[20px] tracking-tight leading-none text-[#000000]">OM</span>
                                <span className="font-black italic text-[18px] sm:text-[20px] tracking-tight leading-none text-[#ff0000]">RESFRIADORES</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full px-2 py-1 border border-[#3c4b5e] bg-[#1e2b3aa3] shadow-[0_8px_18px_rgba(24,35,49,0.18)] shrink-0">
                        <button
                            onClick={onStartTutorial}
                            className="w-[28px] h-[28px] rounded-full border border-[#425266] flex items-center justify-center text-[#9ca7b8] hover:bg-[#344458] transition-colors shrink-0"
                            aria-label="Abrir ajuda"
                        >
                            <i className="fa-solid fa-book-open text-[11px]"></i>
                        </button>

                        <button
                            onClick={handleCheckIntegrity}
                            className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all relative shadow-[0_0_10px_rgba(0,217,255,0.35)] shrink-0 ${isOnline ? 'bg-[#00d9ff] text-white' : 'bg-red-500 text-white'
                                }`}
                            aria-label="Status do sistema"
                        >
                            <span className="text-[9px] font-black leading-none">{isOnline ? 'ON' : 'OFF'}</span>
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#263243] ${isOnline ? 'bg-[#00ff88]' : 'bg-red-200'
                                }`}></span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
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
            className="relative flex flex-col items-center justify-center transition-all duration-300 gap-1 group flex-1 min-w-[52px]"
        >
            <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 relative border ${isActive
                        ? 'bg-[#ff6600] border-[#ff8833] text-white shadow-[0_0_20px_rgba(255,102,0,0.35)]'
                        : 'bg-[#43556c] border-[#536882] text-white/90 hover:bg-[#4f647d]'
                    }`}
            >
                <i className={`${icon} text-[17px] transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-105'}`}></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-center leading-none transition-all duration-300 font-heading text-[#1a202c]">
                {label}
            </span>
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void }> = ({ activeView, setView }) => {
    return (
        <nav className="shrink-0 pb-safe pt-2 px-4 sm:px-5 w-full bg-[#263243]/95 backdrop-blur-md border-t border-[#4a5c73]/50">
            <div className="flex justify-between items-start w-full gap-1 mb-2">
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
