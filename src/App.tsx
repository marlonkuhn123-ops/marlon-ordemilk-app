
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header, BottomNav } from './components/Estrutura';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginScreen } from './components/LoginScreen';
import { Watermark } from './components/UI';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
        <div className="w-12 h-12 border-4 border-techBorder border-t-brand rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,159,26,0.3)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sincronizando Módulo...</p>
    </div>
);

const PasswordPrompt = ({ type, label, onUnlock }: { type: 'sizing' | 'catalog', label: string, onUnlock: (pass: string, type: 'sizing' | 'catalog') => boolean }) => {
    const [pass, setPass] = useState('');
    const [error, setError] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
            <div className="bg-techPanel p-8 rounded-2xl border-none shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.02)] w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]">
                        <i className="fa-solid fa-lock text-brand text-2xl drop-shadow-md"></i>
                    </div>
                </div>
                <h2 className="text-center text-lg font-display font-bold mb-2 italic text-[#E8EEF5]">ACESSO RESTRITO</h2>
                <p className="text-center text-[10px] text-white/40 mb-6 uppercase tracking-[0.3em] font-black">{label}</p>

                <div className="space-y-4">
                    <input
                        type="password"
                        value={pass}
                        onChange={(e) => { setPass(e.target.value); setError(false); }}
                        placeholder="Digite a senha de acesso"
                        className={`w-full bg-techDark border-none shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] rounded-2xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-colors text-center font-mono tracking-widest ${error ? 'ring-2 ring-red-600' : ''}`}
                        onKeyDown={(e) => e.key === 'Enter' && !onUnlock(pass, type) && setError(true)}
                    />
                    {error && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-bounce">Senha Incorreta</p>}
                    <button
                        onClick={() => !onUnlock(pass, type) && setError(true)}
                        className="w-full bg-brand hover:bg-orange-600 text-white font-display font-bold py-3.5 rounded-full transition-all active:scale-95 uppercase text-xs tracking-widest italic shadow-[0_4px_15px_rgba(249,115,22,0.4)]"
                    >
                        LIBERAR ACESSO
                    </button>
                </div>
            </div>
        </div>
    );
};

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstall, setShowInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Verifica se é iOS (que não suporta beforeinstallprompt nativo)
        const iOSInfo = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        
        if (iOSInfo && !isStandalone) {
            setIsIOS(true);
            setShowInstall(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstall(false);
        }
        setDeferredPrompt(null);
    };

    if (!showInstall) return null;

    return (
        <div className="absolute top-0 left-0 w-full z-[100] bg-brand text-white p-4 flex justify-between items-center shadow-lg animate-slide-up border-b-4 border-orange-600">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className={isIOS ? "fa-solid fa-arrow-up-from-bracket text-xl" : "fa-solid fa-download text-xl"}></i>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase tracking-widest">{isIOS ? "Instalar no iPhone" : "Instalar OM APP"}</span>
                    <span className="text-[10px] text-white/80">{isIOS ? "Toque em Compartilhar e 'Tela de Início'" : "Acesso rápido e offline"}</span>
                </div>
            </div>
            {!isIOS && <button onClick={handleInstall} className="bg-white text-brand px-6 py-2.5 rounded-full font-bold text-xs shadow-xl active:scale-95 uppercase tracking-widest">OBTER</button>}
            {isIOS && <button onClick={() => setShowInstall(false)} className="px-4 text-xs font-bold opacity-70">OK</button>}
        </div>
    );
};

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

    const renderView = () => {
        switch (view) {
            case ViewState.DIAGNOSTIC: return <Tool_Assistant />;
            case ViewState.ERRORS: return <Tool_Errors />;
            case ViewState.CALCULATOR: return <Tool_Calculator />;
            case ViewState.SIZING: return isSizingUnlocked ? <Tool_Sizing /> : <PasswordPrompt type="sizing" label="Módulo de Dimensionamento" onUnlock={handleUnlock} />;
            case ViewState.REPORT: return <Tool_Report />;
            case ViewState.TECH_DATA: return isCatalogUnlocked ? <Tool_Catalog /> : <PasswordPrompt type="catalog" label="Módulo de Dados Técnicos" onUnlock={handleUnlock} />;
            default: return <Tool_Assistant />;
        }
    };

    return (
        <div
            className="flex flex-col h-screen overflow-hidden bg-techDark text-white relative select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <InstallPrompt />
            <Watermark text={techData.name} />

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
        <Analytics />
        <SpeedInsights />
    </GlobalProvider>
);

export default App;
