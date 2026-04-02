import {
    ChatMessage,
    SupportAttachmentMeta,
    SupportDiagnosticContext,
    SupportMode,
    SupportSessionMessage,
    SupportSessionSnapshot
} from '../types';

const STORAGE_KEY = 'om_support_session_v1';
const SNAPSHOT_VERSION = 1;
const MAX_MESSAGES = 24;

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const isSupportMode = (value: unknown): value is SupportMode => value === 'AUTO' || value === 'REF' || value === 'ELEC';
const isChatRole = (value: unknown): value is 'user' | 'model' => value === 'user' || value === 'model';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clearStoredSnapshot = () => {
    if (!hasStorage()) return;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Falha ao limpar sessao do suporte:', error);
    }
};

const sanitizeDiagnosticContext = (value: unknown): SupportDiagnosticContext => {
    if (!value || typeof value !== 'object') return {};

    const source = value as Record<string, unknown>;
    const context: SupportDiagnosticContext = {};

    if (typeof source.model === 'string') context.model = source.model;
    if (typeof source.code === 'string') context.code = source.code;
    if (typeof source.voltage === 'string') context.voltage = source.voltage;
    if (typeof source.pressure === 'string') context.pressure = source.pressure;
    if (typeof source.temperature === 'string') context.temperature = source.temperature;
    if (typeof source.refrigerant === 'string') context.refrigerant = source.refrigerant;
    if (source.ihmOn === 'sim' || source.ihmOn === 'nao') context.ihmOn = source.ihmOn;
    if (source.compressorStarts === 'sim' || source.compressorStarts === 'nao') context.compressorStarts = source.compressorStarts;

    return context;
};

const sanitizeMessages = (value: unknown): SupportSessionMessage[] | null => {
    if (!Array.isArray(value)) return null;

    return value
        .filter((message): message is Record<string, unknown> => Boolean(message) && typeof message === 'object')
        .filter(message => isChatRole(message.role) && typeof message.id === 'string' && typeof message.text === 'string' && isFiniteNumber(message.createdAt))
        .map(message => ({
            id: message.id as string,
            role: message.role as 'user' | 'model',
            text: message.text as string,
            createdAt: message.createdAt as number,
            isError: typeof message.isError === 'boolean' ? message.isError : undefined,
            attachmentCount: isFiniteNumber(message.attachmentCount) && message.attachmentCount >= 0 ? message.attachmentCount : undefined,
            attachmentNames: Array.isArray(message.attachmentNames)
                ? message.attachmentNames.filter((name): name is string => typeof name === 'string')
                : undefined
        }));
};

const sanitizeAttachmentsMeta = (value: unknown): SupportAttachmentMeta[] => {
    if (!Array.isArray(value)) return [];

    return value
        .filter((file): file is Record<string, unknown> => Boolean(file) && typeof file === 'object')
        .filter(file => typeof file.id === 'string' && typeof file.mime === 'string' && (file.type === 'image' || file.type === 'audio'))
        .map(file => ({
            id: file.id as string,
            mime: file.mime as string,
            type: file.type as 'image' | 'audio',
            name: typeof file.name === 'string' ? file.name : undefined
        }));
};

const normalizeMessages = (messages: ChatMessage[]) =>
    messages
        .filter(message => !(message.isStreaming && !message.text.trim()))
        .slice(-MAX_MESSAGES)
        .map(message => ({
            id: message.id,
            role: message.role,
            text: message.text,
            createdAt: message.createdAt ?? Date.now(),
            isError: message.isError,
            attachmentCount: message.files?.length ?? 0,
            attachmentNames: message.files?.map(file => file.name).filter(Boolean) as string[] | undefined
        }));

const hydrateMessages = (snapshot: SupportSessionSnapshot): ChatMessage[] =>
    snapshot.messages.map(message => ({
        id: message.id,
        role: message.role,
        text: message.attachmentCount && message.attachmentCount > 0
            ? [
                message.text,
                '',
                `ANEXOS ANTERIORES: ${message.attachmentNames?.join(', ') || `${message.attachmentCount} arquivo(s)`}`
            ].join('\n')
            : message.text,
        isError: message.isError,
        createdAt: message.createdAt
    }));

export const supportSessionService = {
    load(): SupportSessionSnapshot | null {
        if (!hasStorage()) return null;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw) as Partial<SupportSessionSnapshot>;
            const messages = sanitizeMessages(parsed.messages);
            if (
                parsed.version !== SNAPSHOT_VERSION ||
                messages === null ||
                !isSupportMode(parsed.mode) ||
                typeof parsed.draft !== 'string'
            ) {
                clearStoredSnapshot();
                return null;
            }

            return {
                version: SNAPSHOT_VERSION,
                mode: parsed.mode,
                draft: parsed.draft,
                messages,
                diagnosticContext: sanitizeDiagnosticContext(parsed.diagnosticContext),
                attachmentsMeta: sanitizeAttachmentsMeta(parsed.attachmentsMeta),
                updatedAt: isFiniteNumber(parsed.updatedAt) ? parsed.updatedAt : Date.now()
            };
        } catch (error) {
            console.warn('Falha ao restaurar sessao do suporte:', error);
            clearStoredSnapshot();
            return null;
        }
    },

    save(params: {
        mode: SupportMode;
        draft: string;
        messages: ChatMessage[];
        diagnosticContext: SupportDiagnosticContext;
        attachmentsMeta: SupportAttachmentMeta[];
    }) {
        if (!hasStorage()) return;

        const snapshot: SupportSessionSnapshot = {
            version: SNAPSHOT_VERSION,
            mode: params.mode,
            draft: params.draft,
            messages: normalizeMessages(params.messages),
            diagnosticContext: params.diagnosticContext,
            attachmentsMeta: params.attachmentsMeta,
            updatedAt: Date.now()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (error) {
            console.warn('Falha ao salvar sessao do suporte:', error);
        }
    },

    clear() {
        if (!hasStorage()) return;
        clearStoredSnapshot();
    },

    hydrateMessages
};
