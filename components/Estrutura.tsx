
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
        <div className="pt-safe pb-2 px-4 sticky top-0 z-30 transition-colors duration-500 backdrop-blur-md border-b bg-[#050912]/90 border-white/5">
            <div className="relative flex items-center justify-between max-w-2xl mx-auto pt-3 min-h-[50px]">
                
                {/* Left Icons: Menu and Settings - REMOVED */}
                <div className="flex items-center gap-4 text-[#E8EAF6]/60 opacity-0 pointer-events-none">
                    <button className="hover:text-white transition-colors">
                        <i className="fa-solid fa-bars text-lg"></i>
                    </button>
                    <button className="hover:text-white transition-colors">
                        <i className="fa-solid fa-gear text-lg"></i>
                    </button>
                </div>

                {/* Logo Text - Centered */}
                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col select-none items-center">
                    <h1 className="flex items-baseline gap-1 font-heading">
                        <span className="font-bold italic text-[20px] tracking-tighter leading-none text-[#E8EAF6]">OM</span>
                        <span className="font-bold italic text-[14px] tracking-tighter leading-none text-[#ce1126]">RESFRIADORES</span>
                    </h1>
                </div>
                
                {/* Right Icons: Help and Status */}
                <div className="flex items-center gap-4">
                    <button onClick={onStartTutorial} className="w-6 h-6 rounded-full border border-[#E8EAF6]/20 flex items-center justify-center text-[#E8EAF6]/60 hover:text-white hover:bg-white/10 transition-all">
                        <i className="fa-solid fa-question text-[10px]"></i>
                    </button>

                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'bg-red-500'}`}></div>
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
                ? 'bg-transparent border-[1.5px] border-[#FF8F00] text-[#FF8F00] shadow-[0_0_15px_rgba(255,143,0,0.3)]' 
                : 'bg-transparent text-[#E8EAF6]/40 hover:text-[#E8EAF6]'
            }`}>
                {/* Active Inner Circle */}
                {isActive && (
                    <div className="absolute inset-1 rounded-full bg-[#FF8F00]/20"></div>
                )}
                <i className={`${icon} text-lg transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-105'}`}></i>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest text-center leading-none transition-all duration-300 font-heading ${
                isActive ? 'text-[#FF8F00] opacity-100' : 'text-[#E8EAF6]/30 group-hover:text-[#E8EAF6]/60'
            }`}>
                {label}
            </span>
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void }> = ({ activeView, setView }) => {
    return (
        <nav className="z-20 pb-safe pt-3 px-2 sm:px-4 bg-[#050912] border-t border-white/5 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center max-w-2xl mx-auto gap-0.5">
                <NavItem id={ViewState.DIAGNOSTIC} icon="fa-solid fa-headset" label="SUPORTE" isActive={activeView === ViewState.DIAGNOSTIC} onClick={setView} />
                <NavItem id={ViewState.ERRORS} icon="fa-solid fa-triangle-exclamation" label="ERROS" isActive={activeView === ViewState.ERRORS} onClick={setView} />
                <NavItem id={ViewState.CALCULATOR} icon="fa-solid fa-calculator" label="SUPERAQ." isActive={activeView === ViewState.CALCULATOR} onClick={setView} />
                <NavItem id={ViewState.SIZING} icon="fa-solid fa-ruler-combined" label="DIMENS." isActive={activeView === ViewState.SIZING} onClick={setView} />
                <NavItem id={ViewState.REPORT} icon="fa-solid fa-file-signature" label="SERVIÇOS" isActive={activeView === ViewState.REPORT} onClick={setView} />
                <NavItem id={ViewState.TECH_DATA} icon="fa-solid fa-boxes-stacked" label="DADOS" isActive={activeView === ViewState.TECH_DATA} onClick={setView} />
            </div>
        </nav>
    );
};
