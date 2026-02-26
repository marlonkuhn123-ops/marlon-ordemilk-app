
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header, BottomNav } from './components/Estrutura';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginScreen } from './components/LoginScreen';

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
    const { view, setView } = useGlobal();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    
    useEffect(() => {
        const checkAuth = () => {
            const today = new Date().toDateString();
            if (localStorage.getItem('om_auth_date') === today) setIsAuthenticated(true);
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
            localStorage.setItem('om_auth_date', new Date().toDateString());
            setIsAuthenticated(true);
        }
    };

    if (isCheckingAuth) return null;
    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    const renderView = () => {
        switch (view) {
            case ViewState.DIAGNOSTIC: return <Tool_Assistant />;
            case ViewState.ERRORS: return <Tool_Errors />;
            case ViewState.CALCULATOR: return <Tool_Calculator />;
            case ViewState.SIZING: return <Tool_Sizing />;
            case ViewState.REPORT: return <Tool_Report />;
            case ViewState.TECH_DATA: return <Tool_Catalog />;
            default: return <Tool_Assistant />;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a] text-white relative">
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
        </div>
    );
};

const App: React.FC = () => (
    <GlobalProvider>
        <AppContent />
    </GlobalProvider>
);

export default App;
