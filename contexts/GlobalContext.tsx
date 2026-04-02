
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewState } from '../types';

// Definição do Estado Global
interface TechData {
    name: string;
    company: string;
}

const STORAGE_KEY = 'ordemilk_tech_data';
const EMPTY_TECH_DATA: TechData = { name: '', company: '' };
const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isTechData = (value: unknown): value is TechData => {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<TechData>;
    return (
        typeof candidate.name === 'string' &&
        typeof candidate.company === 'string'
    );
};

export const readStoredTechData = (): TechData => {
    if (!hasStorage()) return EMPTY_TECH_DATA;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_TECH_DATA;

    try {
        const parsed = JSON.parse(saved);
        return isTechData(parsed) ? parsed : EMPTY_TECH_DATA;
    } catch (error) {
        console.warn('[GlobalContext] Falha ao ler dados do tecnico do localStorage:', error);
        return EMPTY_TECH_DATA;
    }
};

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
    const [techData, setTechData] = useState<TechData>(() => readStoredTechData());

    // Persistência dos Dados do Técnico
    useEffect(() => {
        if (!hasStorage()) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(techData));
        } catch (error) {
            console.warn('[GlobalContext] Falha ao salvar dados do tecnico no localStorage:', error);
        }
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
