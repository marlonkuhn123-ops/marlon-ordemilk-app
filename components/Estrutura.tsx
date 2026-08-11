import React from 'react';
import { ViewState } from '../types';
import { runSystemDiagnostics } from '../services/testSuite';

type HeaderProps = {
    isOnline: boolean;
    onStartTutorial: () => void;
    compact?: boolean;
};

export const Header: React.FC<HeaderProps> = ({ isOnline, onStartTutorial, compact = false }) => {
    const handleCheckIntegrity = () => {
        const report = runSystemDiagnostics();
        if (report.errors.length === 0) {
            alert(`✅ SISTEMA ÍNTEGRO\n${report.passed}/${report.total} testes aprovados.\nCálculos e laudos operando 100%.`);
        } else {
            alert(`🚨 FALHA DETECTADA\n${report.errors.join('\n')}`);
        }
    };

    return (
        <header className={`shrink-0 pt-safe z-30 relative w-full ${compact ? 'px-4 bg-[#34475e]/45 border-b border-[#28405b]/50 backdrop-blur-md' : 'px-5 sm:px-6'}`}>
            <div className={`w-full ${compact ? 'pt-2 pb-2 max-w-2xl mx-auto' : 'pt-3 pb-3'}`}>
                <div className={`flex items-center justify-between gap-3 ${compact ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        {compact ? (
                            <div className="w-8 h-8 rounded-md bg-[#1e1e1e] border border-[#333] text-[#ce1126] shadow-lg shadow-black/60 flex items-center justify-center -rotate-3 shrink-0 mb-0.5">
                                <i className="fa-solid fa-wrench text-sm"></i>
                            </div>
                        ) : (
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
                        )}

                        <div className="min-w-0 select-none">
                            {compact && <div className="w-[78%] h-[2px] mb-[-2px] ml-auto z-10 rounded-sm bg-gray-400"></div>}
                            <h1 className="flex items-baseline gap-1.5 font-heading">
                                <span className={`font-black italic tracking-tight leading-none ${compact ? 'text-[20px] text-white' : 'text-[18px] sm:text-[20px] text-[#000000]'}`}>OM</span>
                                <span className={`font-black italic tracking-tight leading-none ${compact ? 'text-[13px] text-[#ff0000]' : 'text-[18px] sm:text-[20px] text-[#ff0000]'}`}>RESFRIADORES</span>
                            </h1>
                            {compact && <div className="w-[24%] h-[2px] mt-[-2px] bg-[#ce1126] z-10 rounded-sm"></div>}
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 shrink-0 ${compact ? 'mb-0.5' : 'rounded-full px-2 py-1 border border-[#3c4b5e] bg-[#1e2b3aa3] shadow-[0_8px_18px_rgba(24,35,49,0.18)]'}`}>
                        <button
                            onClick={onStartTutorial}
                            className={`${compact ? 'w-7 h-7 bg-[#24354a] text-[#06c8f6] border-[#2f4a67]' : 'w-[28px] h-[28px] text-[#9ca7b8] border-[#425266] hover:bg-[#344458]'} rounded-full border flex items-center justify-center transition-colors shrink-0`}
                            aria-label="Abrir ajuda"
                        >
                            <i className={`fa-solid ${compact ? 'fa-circle-question text-xs' : 'fa-book-open text-[11px]'}`}></i>
                        </button>

                        <button
                            onClick={handleCheckIntegrity}
                            className={`${compact ? 'px-2.5 h-6 rounded-md border text-[9px] gap-1.5' : 'w-[32px] h-[32px] rounded-full'} flex items-center justify-center transition-all relative shadow-[0_0_10px_rgba(0,217,255,0.35)] shrink-0 ${isOnline ? 'bg-[#00d9ff] text-white border-[#06c8f6]/60' : 'bg-red-500 text-white border-red-400'}`}
                            aria-label="Status do sistema"
                        >
                            {compact && <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#18e07a]' : 'bg-red-200'}`}></span>}
                            <span className="text-[9px] font-black leading-none">{compact ? 'V51.2' : (isOnline ? 'ON' : 'OFF')}</span>
                            {!compact && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#263243] ${isOnline ? 'bg-[#00ff88]' : 'bg-red-200'}`}></span>}
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
    isDarkBg?: boolean;
    compact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, isActive, onClick, isDarkBg = false, compact = false }) => {
    return (
        <button
            onClick={() => onClick(id)}
            className={`relative flex flex-col items-center justify-center transition-all duration-300 gap-1 group flex-1 ${compact ? 'min-w-[48px]' : 'min-w-[52px]'}`}
        >
            <div
                className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 sm:w-12 sm:h-12 rounded-[14px]'} flex items-center justify-center transition-all duration-300 relative border ${isActive
                    ? 'bg-[#ff6600] border-[#ff8833] text-white shadow-[0_0_20px_rgba(255,102,0,0.35)]'
                    : compact
                        ? 'bg-[#24354a] border-[#536882] text-white/90 hover:bg-[#2f4a67]'
                        : 'bg-[#43556c] border-[#536882] text-white/90 hover:bg-[#4f647d]'
                }`}
            >
                <i className={`${icon} ${compact ? 'text-[14px]' : 'text-[17px]'} transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-105'}`}></i>
            </div>
            <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} font-black uppercase tracking-[0.18em] text-center leading-none transition-all duration-300 font-heading ${isActive ? 'text-[#ff6600]' : isDarkBg ? 'text-white/90' : 'text-[#1a202c]'}`}>
                {label}
            </span>
        </button>
    );
};

export const BottomNav: React.FC<{ activeView: ViewState; setView: (view: ViewState) => void; compact?: boolean }> = ({ activeView, setView, compact = false }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <>
            {isMenuOpen && (
                <div className={`absolute ${compact ? 'bottom-[70px]' : 'bottom-[90px]'} right-4 z-40 animate-fadeIn`} style={{ animationDuration: '0.2s' }}>
                    <div className="bg-[#1f2a3a] border border-[#f97316]/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 min-w-[150px]">
                        <div className="text-center text-[10px] text-[#ff6600] font-black mb-1 tracking-[0.2em] uppercase">Módulos Extras</div>
                        <div className="bg-[#4a5c73]/20 h-[1px] w-full mb-1"></div>
                        <div className="flex gap-4 justify-around">
                            <NavItem id={ViewState.SIZING} icon="fa-solid fa-ruler-combined" label="Dimens." isActive={activeView === ViewState.SIZING} onClick={(v) => { setView(v); setIsMenuOpen(false); }} isDarkBg compact={compact} />
                            <NavItem id={ViewState.TECH_DATA} icon="fa-solid fa-boxes-stacked" label="Dados" isActive={activeView === ViewState.TECH_DATA} onClick={(v) => { setView(v); setIsMenuOpen(false); }} isDarkBg compact={compact} />
                            <NavItem id={ViewState.REPORT} icon="fa-solid fa-file-signature" label="Serviços" isActive={activeView === ViewState.REPORT} onClick={(v) => { setView(v); setIsMenuOpen(false); }} isDarkBg compact={compact} />
                        </div>
                    </div>
                </div>
            )}
            <nav className={`shrink-0 pb-safe w-full relative z-50 ${compact ? 'pt-1 px-2 bg-[#dfe5eb]/80 border-t border-[#b8c4d0] backdrop-blur-md' : 'pt-2 px-4 sm:px-5'}`}>
                <div className={`flex justify-between items-start w-full gap-1 ${compact ? 'max-w-2xl mx-auto mb-1' : 'mb-2'}`}>
                    <NavItem id={ViewState.DIAGNOSTIC} icon="fa-solid fa-headset" label="Suporte" isActive={activeView === ViewState.DIAGNOSTIC} onClick={(v) => { setView(v); setIsMenuOpen(false); }} compact={compact} />
                    <NavItem id={ViewState.ERRORS} icon="fa-solid fa-triangle-exclamation" label="Erros" isActive={activeView === ViewState.ERRORS} onClick={(v) => { setView(v); setIsMenuOpen(false); }} compact={compact} />
                    <NavItem id={ViewState.CALCULATOR} icon="fa-solid fa-calculator" label="Superaq" isActive={activeView === ViewState.CALCULATOR} onClick={(v) => { setView(v); setIsMenuOpen(false); }} compact={compact} />
                    <NavItem id={ViewState.COURSE} icon="fa-solid fa-chalkboard-user" label="Curso" isActive={activeView === ViewState.COURSE} onClick={(v) => { setView(v); setIsMenuOpen(false); }} compact={compact} />

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`relative flex flex-col items-center justify-center transition-all duration-300 gap-1 group flex-1 ${compact ? 'min-w-[48px]' : 'min-w-[52px]'}`}
                    >
                        <div className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 sm:w-12 sm:h-12 rounded-[14px]'} flex items-center justify-center transition-all duration-300 relative border ${isMenuOpen ? 'bg-[#ff6600] border-[#ff8833] text-white shadow-[0_0_20px_rgba(255,102,0,0.35)]' : compact ? 'bg-[#24354a] border-[#536882] text-white/90 hover:bg-[#2f4a67]' : 'bg-[#43556c] border-[#536882] text-white/90 hover:bg-[#4f647d]'}`}>
                            <i className={`${compact ? 'text-[14px]' : 'text-[17px]'} transition-transform duration-300 fa-solid ${isMenuOpen ? 'fa-xmark scale-100' : 'fa-list-ul group-hover:scale-105'}`}></i>
                        </div>
                        <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} font-black uppercase tracking-[0.18em] text-center leading-none transition-all duration-300 font-heading ${isMenuOpen ? 'text-[#ff6600]' : 'text-[#1a202c]'}`}>
                            Mais
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
};
