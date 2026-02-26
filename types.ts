
export enum ViewState {
    DIAGNOSTIC = 'diag',
    ERRORS = 'errors',
    CALCULATOR = 'calc',
    SIZING = 'sizing',
    REPORT = 'report',
    TECH_DATA = 'tech_data'
}

export interface FieldTip {
    id: string;
    content: string;
    date: string;
}

export interface ChatMessage {
    id: string; 
    role: 'user' | 'model';
    text: string;
    image?: string; 
    audio?: string; // Base64 do audio
    fileMimeType?: string; // Tipo do arquivo (ex: audio/mp3, image/jpeg)
    isError?: boolean;
    isToolCall?: boolean;
    isStreaming?: boolean;
    sources?: { title: string; uri: string }[];
}

export interface ElectricReading {
    phase: 'tri' | 'bi' | 'mono' | 'mrt';
    voltsR?: string;
    voltsS?: string;
    voltsT?: string;
    amps?: string;
    nominal?: string;
}

export type CalcMode = 'SH' | 'SR';

export enum Refrigerant {
    R22 = 'R-22',
    R404A = 'R-404A'
}

export interface GlobalPreFillData {
    errors?: { model?: string; code?: string };
    calculator?: { fluid?: Refrigerant; pressure?: string; temperature?: string; mode?: CalcMode };
    report?: { client?: string; model?: string; sh?: string; sc?: string };
    sizing?: { inputValue?: string };
}
