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
    audio?: string;
    files?: { id?: string; name?: string; data: string; mime: string; type: 'image' | 'audio' }[];
    fileMimeType?: string;
    isError?: boolean;
    isToolCall?: boolean;
    isStreaming?: boolean;
    sources?: { title: string; uri: string }[];
    createdAt?: number;
}

export type CalcMode = 'Superaquecimento' | 'Sub-resfriamento';

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

export type SupportMode = 'AUTO' | 'REF' | 'ELEC';

export interface SupportDiagnosticContext {
    model?: string;
    code?: string;
    voltage?: string;
    pressure?: string;
    temperature?: string;
    refrigerant?: string;
    ihmOn?: 'sim' | 'nao';
    compressorStarts?: 'sim' | 'nao';
}

export interface SupportSessionMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    createdAt: number;
    isError?: boolean;
    attachmentCount?: number;
    attachmentNames?: string[];
}

export interface SupportAttachmentMeta {
    id: string;
    name?: string;
    mime: string;
    type: 'image' | 'audio';
}

export interface SupportSessionSnapshot {
    version: 1;
    mode: SupportMode;
    draft: string;
    messages: SupportSessionMessage[];
    diagnosticContext: SupportDiagnosticContext;
    attachmentsMeta: SupportAttachmentMeta[];
    updatedAt: number;
}
