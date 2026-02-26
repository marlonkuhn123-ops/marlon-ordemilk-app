
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
        <div className="pt-safe pb-3 px-6 sticky top-0 z-30 transition-colors duration-500 backdrop-blur-md border-b bg-[#1a1a1a]/90 border-[#3d3d3d]">
            <div className="flex justify-between items-end max-w-2xl mx-auto pt-2">
                
                <div className="flex items-end gap-3">
                    <div className="flex items-center justify-center w-11 h-11 mb-0.5 rounded-lg shadow-lg transform -rotate-3 transition-all duration-500 bg-[#242424] border border-[#3d3d3d] text-[#ce1126] shadow-black/60">
                        <i className="fa-solid fa-wrench text-xl"></i>
                    </div>

                    <div className="flex flex-col select-none">
                        <div className="self-end w-[78%] h-[3px] mb-[-2px] z-10 rounded-sm transition-colors duration-500 bg-[#bdc3c7]"></div>
                        <h1 className="flex items-baseline gap-1.5 z-0 transform translate-y-[1px]">
                            <span className="font-inter font-black italic text-[28px] tracking-tighter leading-none text-white">OM</span>
                            <span className="font-inter font-black italic text-[19px] tracking-tighter leading-none text-[#ce1126]">RESFRIADORES</span>
                        </h1>
                        <div className="self-start w-[24%] h-[3px] mt-[-2px] bg-[#ce1126] z-10 rounded-sm"></div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mb-1">
                    <button onClick={onStartTutorial} className="w-8 h-8 rounded-full flex items-center justify-center transition-all border bg-[#4d4d4d] text-[#1abc9c] border-[#5d5d5d] hover:bg-[#5d5d5d]">
                        <i className="fa-solid fa-circle-question text-sm"></i>
                    </button>

                    <button 
                        onClick={handleCheckIntegrity}
                        className={`px-2 py-1 rounded-md flex items-center gap-1.5 border cursor-pointer active:scale-95 transition-all ${
                            isOnline 
                                ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' 
                                : 'border-red-900/50 bg-red-900/10 text-red-400'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[9px] font-bold tracking-wider font-inter text-white/80 uppercase">V51.4-FINAL</span>
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
            className={`relative min-w-[55px] flex-1 h-14 flex flex-col items-center justify-center transition-all duration-300 gap-0.5 px-0.5 ${
                isActive ? 'translate-y-[-4px]' : 'opacity-60 hover:opacity-100'
            }`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-[#bdc3c7] text-[#1a1a1a] shadow-lg shadow-black/40' : 'bg-[#3d3d3d] text-gray-300'
            }`}>
                <i className={`${icon} ${isActive ? 'text-lg' : 'text-sm'}`}></i>
            </div>
            <span className={`text-[7px] font-black uppercase tracking-tighter text-center leading-none transition-all duration-300 ${
                isActive ? 'text-[#1abc9c]' : 'text-gray-400'
            }`}>
                {label}
            </span>
            {isActive && <div className="absolute top-[calc(100%-4px)] w-1.5 h-1.5 bg-[#1abc9c] rounded-full animate-pulse"></div>}
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void }> = ({ activeView, setView }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 pb-safe pt-2 px-1 backdrop-blur-md bg-[#1a1a1a]/95 border-t border-[#3d3d3d]">
            <div className="flex justify-around items-center max-w-2xl mx-auto">
                <NavItem id={ViewState.DIAGNOSTIC} icon="fa-solid fa-headset" label="Suporte" isActive={activeView === ViewState.DIAGNOSTIC} onClick={setView} />
                <NavItem id={ViewState.ERRORS} icon="fa-solid fa-triangle-exclamation" label="Erros" isActive={activeView === ViewState.ERRORS} onClick={setView} />
                <NavItem id={ViewState.CALCULATOR} icon="fa-solid fa-calculator" label="Cálculo SH" isActive={activeView === ViewState.CALCULATOR} onClick={setView} />
                <NavItem id={ViewState.SIZING} icon="fa-solid fa-ruler-combined" label="Dimensionamento" isActive={activeView === ViewState.SIZING} onClick={setView} />
                <NavItem id={ViewState.REPORT} icon="fa-solid fa-file-signature" label="Serviços" isActive={activeView === ViewState.REPORT} onClick={setView} />
                <NavItem id={ViewState.TECH_DATA} icon="fa-solid fa-boxes-stacked" label="Dados" isActive={activeView === ViewState.TECH_DATA} onClick={setView} />
            </div>
        </nav>
    );
};
