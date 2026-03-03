
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header, BottomNav } from './components/Estrutura';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginScreen } from './components/LoginScreen';
import { Watermark } from './components/UI';

// COMPONENTES DE FERRAMENTAS - CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
// Como os componentes usam exportação nomeada, precisamos mapear para default para o React.lazy
const Tool_Assistant = lazy(() => import('./components/Tool_1_Assistant').then(m => ({ default: m.Tool_Assistant })));
const Tool_Errors = lazy(() => import('./components/Tool_2_Errors').then(m => ({ default: m.Tool_Errors })));
const Tool_Calculator = lazy(() => import('./components/Tool_3_Calculator').then(m => ({ default: m.Tool_Calculator })));
const Tool_Sizing = lazy(() => import('./components/Tool_4_Sizing').then(m => ({ default: m.Tool_Sizing })));
const Tool_Report = lazy(() => import('./components/Tool_5_Report').then(m => ({ default: m.Tool_Report })));
const Tool_Catalog = lazy(() => import('./components/Tool_6_Catalog').then(m => ({ default: m.Tool_Catalog })));

import { ViewState } from './types';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';

// Fallback visual enquanto a ferramenta é carregada
const ToolLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-[#3d3d3d] border-t-[#1abc9c] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sincronizando Módulo...</p>
    </div>
);

const AppContent: React.FC = () => {
    const { view, setView, techData, updateTechData } = useGlobal();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [isSizingUnlocked, setIsSizingUnlocked] = useState(false);
    const [isCatalogUnlocked, setIsCatalogUnlocked] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const authTime = localStorage.getItem('om_auth_time');
            if (authTime) {
                const loginDate = new Date(parseInt(authTime));
                const now = new Date();
                const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
                
                // Sessão expira em 8 horas
                if (diffHours < 8) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('om_auth_time');
                }
            }
            setIsCheckingAuth(false);
        };
        checkAuth();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogin = (success: boolean) => {
        if (success) {
            const saved = localStorage.getItem('ordemilk_tech_data');
            if (saved) {
                const data = JSON.parse(saved);
                updateTechData(data);
            }
            localStorage.setItem('om_auth_time', Date.now().toString());
            setIsAuthenticated(true);
        }
    };

    const handleUnlock = (password: string, type: 'sizing' | 'catalog') => {
        if (password === 'om20266') {
            if (type === 'sizing') setIsSizingUnlocked(true);
            else setIsCatalogUnlocked(true);
            return true;
        }
        return false;
    };

    if (isCheckingAuth) return null;
    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    const PasswordPrompt = ({ type, label }: { type: 'sizing' | 'catalog', label: string }) => {
        const [pass, setPass] = useState('');
        const [error, setError] = useState(false);

        return (
            <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
                <div className="bg-[#2a2a2a] p-8 rounded-2xl border border-[#ce1126]/20 shadow-xl w-full max-w-sm">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#ce1126]/10 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-lock text-[#ce1126] text-2xl"></i>
                        </div>
                    </div>
                    <h2 className="text-center text-lg font-bold mb-2 italic">ACESSO RESTRITO</h2>
                    <p className="text-center text-[10px] text-gray-400 mb-6 uppercase tracking-[0.3em] font-black">{label}</p>
                    
                    <div className="space-y-4">
                        <input 
                            type="password" 
                            value={pass}
                            onChange={(e) => { setPass(e.target.value); setError(false); }}
                            placeholder="Digite a senha de acesso"
                            className={`w-full bg-[#1a1a1a] border ${error ? 'border-[#ce1126]' : 'border-white/10'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ce1126] transition-colors text-center font-mono tracking-widest`}
                            onKeyDown={(e) => e.key === 'Enter' && !handleUnlock(pass, type) && setError(true)}
                        />
                        {error && <p className="text-[#ce1126] text-[10px] text-center font-bold uppercase tracking-tighter animate-bounce">Senha Incorreta</p>}
                        <button 
                            onClick={() => !handleUnlock(pass, type) && setError(true)}
                            className="w-full bg-[#ce1126] hover:bg-[#a00e1e] text-white font-bold py-3 rounded-xl transition-all active:scale-95 uppercase text-xs tracking-widest italic"
                        >
                            LIBERAR ACESSO
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderView = () => {
        switch (view) {
            case ViewState.DIAGNOSTIC: return <Tool_Assistant />;
            case ViewState.ERRORS: return <Tool_Errors />;
            case ViewState.CALCULATOR: return <Tool_Calculator />;
            case ViewState.SIZING: return isSizingUnlocked ? <Tool_Sizing /> : <PasswordPrompt type="sizing" label="Módulo de Dimensionamento" />;
            case ViewState.REPORT: return <Tool_Report />;
            case ViewState.TECH_DATA: return isCatalogUnlocked ? <Tool_Catalog /> : <PasswordPrompt type="catalog" label="Módulo de Dados Técnicos" />;
            default: return <Tool_Assistant />;
        }
    };

    return (
        <div 
            className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a] text-white relative select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <Watermark text={techData.name} />
            
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                style={{ backgroundImage: `linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
            <div className="relative flex flex-col h-full z-10">
                <Header isOnline={isOnline} onStartTutorial={() => setIsTutorialActive(true)} />
                <main className="flex-1 overflow-y-auto px-4 pt-4 scroll-smooth max-w-2xl mx-auto w-full pb-safe no-scrollbar">
                    <Suspense fallback={<ToolLoader />}>
                        {renderView()}
                    </Suspense>
                </main>
                <BottomNav activeView={view} setView={setView} />
            </div>
            <TutorialOverlay isActive={isTutorialActive} onClose={() => setIsTutorialActive(false)} setView={setView} />
            
            <style>{`
                * {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                }
                input, textarea {
                    -webkit-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                    user-select: text;
                }
            `}</style>
        </div>
    );
};

const App: React.FC = () => (
    <GlobalProvider>
        <AppContent />
    </GlobalProvider>
);

export default App;
