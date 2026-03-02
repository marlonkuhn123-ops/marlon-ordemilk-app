
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
        <div className="pt-safe pb-2 px-3 sm:px-6 sticky top-0 z-30 transition-colors duration-500 backdrop-blur-md border-b bg-[#1a1a1a]/90 border-[#3d3d3d]">
            <div className="flex justify-between items-center max-w-2xl mx-auto pt-2">
                
                {/* Logo Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-lg shadow-lg transform -rotate-3 transition-all duration-500 bg-[#242424] border border-[#3d3d3d] text-[#ce1126] shadow-black/60 shrink-0">
                        <i className="fa-solid fa-wrench text-sm sm:text-xl"></i>
                    </div>

                    <div className="flex flex-col select-none">
                        <div className="self-end w-[78%] h-[2px] sm:h-[3px] mb-[-1px] sm:mb-[-2px] z-10 rounded-sm transition-colors duration-500 bg-[#bdc3c7]"></div>
                        <h1 className="flex items-baseline gap-1 z-0 transform translate-y-[1px]">
                            <span className="font-inter font-black italic text-[18px] sm:text-[28px] tracking-tighter leading-none text-white">OM</span>
                            <span className="font-inter font-black italic text-[12px] sm:text-[19px] tracking-tighter leading-none text-[#ce1126]">RESFRIADORES</span>
                        </h1>
                        <div className="self-start w-[24%] h-[2px] sm:h-[3px] mt-[-1px] sm:mt-[-2px] bg-[#ce1126] z-10 rounded-sm"></div>
                    </div>
                </div>
                
                {/* Actions Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={onStartTutorial} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border bg-[#4d4d4d] text-[#1abc9c] border-[#5d5d5d] hover:bg-[#5d5d5d] shrink-0">
                        <i className="fa-solid fa-circle-question text-xs sm:text-sm"></i>
                    </button>

                    <button 
                        onClick={handleCheckIntegrity}
                        className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-md flex items-center gap-1 border cursor-pointer active:scale-95 transition-all shrink-0 ${
                            isOnline 
                                ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' 
                                : 'border-red-900/50 bg-red-900/10 text-red-400'
                        }`}
                    >
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[7px] sm:text-[9px] font-bold tracking-wider font-inter text-white/80 uppercase hidden xs:inline-block">V51.4</span>
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
            className={`relative min-w-[48px] sm:min-w-[55px] flex-1 h-12 sm:h-14 flex flex-col items-center justify-center transition-all duration-300 gap-0.5 px-0.5 ${
                isActive ? 'translate-y-[-2px] sm:translate-y-[-4px]' : 'opacity-60 hover:opacity-100'
            }`}
        >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-[#bdc3c7] text-[#1a1a1a] shadow-lg shadow-black/40' : 'bg-[#3d3d3d] text-gray-300'
            }`}>
                <i className={`${icon} ${isActive ? 'text-sm sm:text-lg' : 'text-xs sm:text-sm'}`}></i>
            </div>
            <span className={`text-[6px] sm:text-[7px] font-black uppercase tracking-tighter text-center leading-none transition-all duration-300 max-w-[50px] truncate ${
                isActive ? 'text-[#1abc9c]' : 'text-gray-400'
            }`}>
                {label}
            </span>
            {isActive && <div className="absolute top-[calc(100%-2px)] w-1 h-1 bg-[#1abc9c] rounded-full animate-pulse"></div>}
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void }> = ({ activeView, setView }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 pb-safe pt-1 px-0.5 backdrop-blur-md bg-[#1a1a1a]/95 border-t border-[#3d3d3d]">
            <div className="flex justify-around items-center max-w-2xl mx-auto overflow-x-auto no-scrollbar">
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
