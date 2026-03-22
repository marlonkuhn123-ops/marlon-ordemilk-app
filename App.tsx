
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
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';

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
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';

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
            className="h-dvh w-full flex flex-col relative overflow-hidden bg-transparent text-[#ffffff] select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
        !window.location.hostname.includes('run.app');

    return (
        <GlobalProvider>
            <AppContent />
            {isProductionEnv && <Analytics />}
        </GlobalProvider>
    );
};

export default App;
