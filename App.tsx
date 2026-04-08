
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Header, BottomNav } from './components/Estrutura';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginScreen } from './components/LoginScreen';
import { Watermark } from './components/UI';

import { Tool_Assistant } from './components/Tool_1_Assistant';
import { Tool_Errors } from './components/Tool_2_Errors';
import { Tool_Calculator } from './components/Tool_3_Calculator';
import { Tool_Sizing } from './components/Tool_4_Sizing';
import { Tool_Report } from './components/Tool_5_Report';
import { Tool_Catalog } from './components/Tool_6_Catalog';

import { ViewState } from './types';
import { GlobalProvider, readStoredTechData, useGlobal } from './contexts/GlobalContext';

const AUTH_STORAGE_KEY = 'om_auth_time';
const AUTH_SESSION_HOURS = 8;
const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const clearStoredAuthTimestamp = () => {
    if (!hasStorage()) return;

    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
        console.warn('[App] Falha ao limpar horario de autenticacao:', error);
    }
};

const readStoredAuthTimestamp = (): number | null => {
    if (!hasStorage()) return null;

    const authTime = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authTime) return null;

    const parsed = Number(authTime);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Fallback visual enquanto a ferramenta é carregada
const ToolLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-[#3d3d3d] border-t-[#1abc9c] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sincronizando Módulo...</p>
    </div>
);

const PasswordPrompt = ({ type, label, onUnlock }: { type: 'sizing' | 'catalog', label: string, onUnlock: (pass: string, type: 'sizing' | 'catalog') => boolean }) => {
    const [pass, setPass] = useState('');
    const [error, setError] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl border border-[#f97316]/20 shadow-xl w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#f97316]/10 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-lock text-[#f97316] text-2xl"></i>
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
                        className={`w-full bg-[#0f172a] border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f97316] transition-colors text-center font-mono tracking-widest`}
                        onKeyDown={(e) => e.key === 'Enter' && !onUnlock(pass, type) && setError(true)}
                    />
                    {error && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-tighter animate-bounce">Senha Incorreta</p>}
                    <button
                        onClick={() => !onUnlock(pass, type) && setError(true)}
                        className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl transition-all active:scale-95 uppercase text-xs tracking-widest italic shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    >
                        LIBERAR ACESSO
                    </button>
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { view, setView, techData, updateTechData } = useGlobal();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [isSizingUnlocked, setIsSizingUnlocked] = useState(false);
    const [isCatalogUnlocked, setIsCatalogUnlocked] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [isIOSDevice] = useState(() => {
        if (typeof navigator === 'undefined') return false;
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    });
    const [isAndroidDevice] = useState(() => {
        if (typeof navigator === 'undefined') return false;
        return /Android/i.test(navigator.userAgent);
    });
    const [isAppInstalled, setIsAppInstalled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsCheckingAuth(false);
            return;
        }

        const installHandler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        const handleAppInstalled = () => setIsAppInstalled(true);
        window.addEventListener('beforeinstallprompt', installHandler);
        window.addEventListener('appinstalled', handleAppInstalled);

        const checkAuth = () => {
            const authTime = readStoredAuthTimestamp();
            if (authTime !== null) {
                const loginDate = new Date(authTime);
                const now = new Date();
                const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

                // Sessão expira em 8 horas
                if (diffHours < AUTH_SESSION_HOURS) {
                    setIsAuthenticated(true);
                } else {
                    clearStoredAuthTimestamp();
                }
            } else {
                clearStoredAuthTimestamp();
            }
            setIsCheckingAuth(false);
        };
        checkAuth();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('beforeinstallprompt', installHandler);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogin = (loginTechData: { name: string; company: string }) => {
        updateTechData(loginTechData);

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, Date.now().toString());
        } catch (error) {
            console.warn('[App] Falha ao persistir horario de autenticacao:', error);
        }

        setIsAuthenticated(true);
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
    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} installPrompt={deferredInstallPrompt} isIOS={isIOSDevice} isAndroid={isAndroidDevice} isInstalled={isAppInstalled} />;

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
            className="h-dvh w-full flex flex-col relative overflow-hidden bg-transparent text-[#ffffff] select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <Watermark text={techData.name} />

            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>

            <Header isOnline={isOnline} onStartTutorial={() => setIsTutorialActive(true)} />
            <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative w-full pt-4 pb-2 px-5 sm:px-6">
                {renderView()}
            </main>
            <BottomNav activeView={view} setView={setView} />
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

const App: React.FC = () => {
    const isProductionEnv = typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('run.app');

    return (
        <GlobalProvider>
            <AppContent />
            {isProductionEnv && <Analytics />}
        </GlobalProvider>
    );
};

export default App;
