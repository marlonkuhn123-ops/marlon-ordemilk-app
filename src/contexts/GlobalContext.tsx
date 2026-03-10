
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewState } from '../types';

// Definição do Estado Global
interface TechData {
    name: string;
    company: string;
}

interface GlobalState {
    techData: TechData;
    // Added view state to tracking current navigation position
    view: ViewState;
}

interface GlobalContextType extends GlobalState {
    updateTechData: (data: Partial<TechData>) => void;
    // Added setView method to allow components to switch between tools
    setView: (view: ViewState) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal deve ser usado dentro de um GlobalProvider');
    }
    return context;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- ESTADO 1: TEMA ---
    // Removido, pois o tema agora é hardcoded para dark mode nos componentes UI

    // --- ESTADO 2: NAVEGAÇÃO ---
    // Initialize navigation state with the default view
    const [view, setView] = useState<ViewState>(ViewState.DIAGNOSTIC);

    // --- ESTADO 3: DADOS DO TÉCNICO ---
    const [techData, setTechData] = useState<TechData>(() => {
        const saved = localStorage.getItem('ordemilk_tech_data');
        return saved ? JSON.parse(saved) : { name: '', company: '' };
    });

    // Persistência dos Dados do Técnico
    useEffect(() => {
        localStorage.setItem('ordemilk_tech_data', JSON.stringify(techData));
    }, [techData]);

    const updateTechData = (data: Partial<TechData>) => {
        setTechData(prev => ({ ...prev, ...data }));
    };

    return (
        <GlobalContext.Provider value={{ techData, updateTechData, view, setView }}>
            {children}
        </GlobalContext.Provider>
    );
};
