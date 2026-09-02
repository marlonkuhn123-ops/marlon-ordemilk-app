import React, { useEffect, useRef, useState } from 'react';
import { generateChatResponseStream } from '../services/geminiService';
import { localSupportService } from '../services/localSupportService';
import { supportSessionService } from '../services/supportSessionService';
import {
    ChatMessage,
    Refrigerant,
    SupportAttachmentMeta,
    SupportDiagnosticContext,
    SupportMode
} from '../types';

const WELCOME_TEXT = 'Olá! Descreva o sintoma, informe o alarme ou envie foto/áudio para análise.';

const MODE_NAMES: Record<SupportMode, string> = {
    AUTO: 'Auto (IA)',
    REF: 'Refrigeração',
    ELEC: 'Elétrica'
};

const FLUID_OPTIONS = [
    { value: '', label: 'Flui' },
    { value: Refrigerant.R404A, label: Refrigerant.R404A },
    { value: Refrigerant.R22, label: Refrigerant.R22 }
];

const VOLTAGE_OPTIONS = [
    { value: '', label: 'Ten' },
    { value: '220 mono', label: '220 mono' },
    { value: '220 3f', label: '220 3f' },
    { value: '380v 3f', label: '380v 3f' }
];

const DIAGNOSTIC_FIELD_META = {
    model: { icon: 'fa-barcode', placeholder: 'Modelo do tanque' },
    voltage: { icon: 'fa-bolt', placeholder: 'Tensão' },
    refrigerant: { icon: 'fa-snowflake', placeholder: 'Fluido refrigerante' },
    temperature: { icon: 'fa-temperature-half', placeholder: 'Temp. atual do leite' }
} as const;

const ATTACHMENT_ANALYSIS_MARKER = '[ANEXO_TECNICO_ORDEMILK]';

type SelectedSupportFile = {
    id: string;
    name?: string;
    data: string;
    mime: string;
    type: 'image' | 'audio';
};

type AttachmentPromptFile = {
    name?: string;
    mime: string;
    type: 'image' | 'audio';
};

const createSupportId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `support-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const showSupportAlert = (message: string) => {
    if (typeof window === 'undefined' || typeof window.alert !== 'function') {
        console.warn(`[Tool_1_Assistant] Aviso não exibido: ${message}`);
        return;
    }

    window.alert(message);
};
const confirmSupportHistoryReset = () => {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
        console.warn('[Tool_1_Assistant] Confirmação indisponível para apagar histórico do atendimento.');
        return false;
    }

    return window.confirm('Deseja apagar o histórico deste atendimento?');
};

const createWelcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    role: 'model',
    text: WELCOME_TEXT,
    createdAt: Date.now()
});

const createModeMessage = (mode: Exclude<SupportMode, 'AUTO'>): ChatMessage => ({
    id: createSupportId(),
    role: 'model',
    text: `Modo de diagnóstico focado em **${MODE_NAMES[mode]}** ativado. Descreva o sintoma com o máximo de detalhe possível.`,
    createdAt: Date.now()
});

const isUiOnlySupportMessage = (message: ChatMessage) =>
    message.id === 'welcome' ||
    message.text === WELCOME_TEXT ||
    message.text.startsWith('Modo de diagnóstico focado em **') ||
    message.text.startsWith('Modo de diagnostico focado em **');

const buildAttachmentMeta = (files: SelectedSupportFile[]): SupportAttachmentMeta[] =>
    files.map(file => ({
        id: file.id,
        name: file.name,
        mime: file.mime,
        type: file.type
    }));

const getAttachmentLabel = (file: AttachmentPromptFile, index: number) => {
    const kind = file.type === 'image' ? 'imagem' : 'audio';
    return `${index + 1}. ${kind}${file.name ? ` (${file.name})` : ''} - ${file.mime}`;
};

const buildAttachmentAnalysisPrompt = (files: AttachmentPromptFile[], text?: string) => {
    const userText = text?.trim();
    const visiblePlaceholder = userText?.startsWith('[');
    const technicianText = userText && !visiblePlaceholder
        ? `Relato do técnico: ${userText}`
        : 'O técnico enviou anexo(s) para análise técnica.';

    return [
        ATTACHMENT_ANALYSIS_MARKER,
        technicianText,
        `Anexos recebidos:\n${files.map(getAttachmentLabel).join('\n')}`,
        '',
        'Analise os anexos como evidência técnica de campo da Ordemilk.',
        'Se houver imagem, leia primeiro o que aparece nela: IHM/display, alarme, placa de identificação, borneira, painel, controlador, CLP, contatora, disjuntor-motor, pressostato, sensor, condensador, compressor, evaporador, visor de líquido, gelo, sujeira, vazamento ou qualquer indício visual.',
        'Se for o primeiro contato do caso, responda com hipótese inicial, duas confirmações objetivas e uma ação segura imediata. Se for continuidade, conecte o anexo ao diagnóstico em andamento e avance sem reiniciar o atendimento. Se a imagem estiver ruim, diga exatamente qual foto nova o técnico deve tirar.'
    ].join('\n');
};

const buildAttachmentDisplayText = (files: AttachmentPromptFile[]) => {
    const imageCount = files.filter(file => file.type === 'image').length;
    const audioCount = files.filter(file => file.type === 'audio').length;
    const parts = [
        imageCount > 0 ? `${imageCount} imagem(ns)` : '',
        audioCount > 0 ? `${audioCount} áudio(s)` : ''
    ].filter(Boolean);

    return `[${parts.join(' + ')} enviado(s) para análise técnica]`;
};

const isApiContextMessage = (message: ChatMessage) =>
    !message.isError &&
    !message.isStreaming &&
    !isUiOnlySupportMessage(message) &&
    Boolean(message.text.trim() || message.files?.length);

const mapSupportMessageToApi = (message: ChatMessage, includeFileData: boolean) => {
    const parts: any[] = [];
    const files = includeFileData ? message.files ?? [] : [];
    const effectiveText = message.text.trim();
    const apiText = files.length > 0
        ? buildAttachmentAnalysisPrompt(files, effectiveText)
        : effectiveText;

    if (apiText) {
        parts.push({ text: apiText });
    }

    if (includeFileData) {
        files.forEach(file => {
            parts.push({
                inlineData: {
                    mimeType: file.mime,
                    data: file.data.split(',')[1]
                }
            });
        });
    }

    if (parts.length === 0) return null;
    return { role: message.role, parts };
};

const buildSupportApiHistory = (previousMessages: ChatMessage[], currentUserMessage: ChatMessage) => {
    const previousContext = previousMessages
        .filter(isApiContextMessage)
        .slice(-AI_CONTEXT_MESSAGE_LIMIT)
        .map(message => mapSupportMessageToApi(message, false))
        .filter(Boolean) as { role: string; parts: any[] }[];
    const currentTurn = mapSupportMessageToApi(currentUserMessage, true);

    return currentTurn ? [...previousContext, currentTurn] : previousContext;
};

const countSupportUserTurns = (previousMessages: ChatMessage[], currentUserMessage: ChatMessage) =>
    previousMessages.filter(message => message.role === 'user' && isApiContextMessage(message)).length +
    (currentUserMessage.role === 'user' ? 1 : 0);

const IMAGE_MAX_EDGE = 1600;
const IMAGE_JPEG_QUALITY = 0.86;
const SUPPORT_STREAM_TIMEOUT_MS = 65000;
const AI_CONTEXT_MESSAGE_LIMIT = 10;

const normalizeImageFile = (file: File): Promise<SelectedSupportFile | null> =>
    new Promise(resolve => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;

            if (!sourceWidth || !sourceHeight) {
                resolve(null);
                return;
            }

            const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(sourceWidth, sourceHeight));
            const width = Math.max(1, Math.round(sourceWidth * scale));
            const height = Math.max(1, Math.round(sourceHeight * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d', { alpha: false });

            if (!context) {
                resolve(null);
                return;
            }

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            resolve({
                id: createSupportId(),
                name: file.name || 'imagem-tecnica.jpg',
                data: canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY),
                mime: 'image/jpeg',
                type: 'image'
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
        };

        image.src = objectUrl;
    });

const readFileAsDataUrl = async (file: File): Promise<SelectedSupportFile | null> => {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isAudio) return null;

    if (isImage) {
        const normalizedImage = await normalizeImageFile(file);
        if (normalizedImage) return normalizedImage;
    }

    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve({
                id: createSupportId(),
                name: file.name,
                data: reader.result as string,
                mime: file.type,
                type: isImage ? 'image' : 'audio'
            });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
};
const hasDiagnosticContextValue = (context?: SupportDiagnosticContext) =>
    Boolean(context && (context.model?.trim() || context.voltage?.trim() || context.refrigerant?.trim() || context.temperature?.trim()));

const isDiagnosticContextComplete = (context?: SupportDiagnosticContext) =>
    Boolean(context?.model?.trim() && context?.voltage?.trim() && context?.refrigerant?.trim() && context?.temperature?.trim());

const hasStartedConversation = (messages: ChatMessage[]) =>
    messages.some(message => message.role === 'user');

const getDiagnosticContextSummary = (context: SupportDiagnosticContext) =>
    [
        context.model?.trim()
            ? { key: 'model', icon: DIAGNOSTIC_FIELD_META.model.icon, text: context.model.trim() }
            : undefined,
        context.voltage?.trim()
            ? { key: 'voltage', icon: DIAGNOSTIC_FIELD_META.voltage.icon, text: context.voltage.trim() }
            : undefined,
        context.refrigerant?.trim()
            ? { key: 'refrigerant', icon: DIAGNOSTIC_FIELD_META.refrigerant.icon, text: context.refrigerant.trim() }
            : undefined,
        context.temperature?.trim()
            ? { key: 'temperature', icon: DIAGNOSTIC_FIELD_META.temperature.icon, text: `Leite ${context.temperature.trim()}` }
            : undefined
    ].filter(Boolean) as Array<{ key: string; icon: string; text: string }>;

const INPUT_BASE_CLASSNAME = 'w-full h-9 rounded-[14px] text-[13px] bg-[#00000022] border border-[#4a5c73] text-[#F8FAFC] font-medium focus:border-[#00d9ff]/60 outline-none transition-all placeholder:text-[#8896a8] placeholder:font-normal disabled:opacity-70';

const DiagnosticFieldShell: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
    <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full border border-[#00d9ff]/12 bg-[#00d9ff]/8 text-[#a7efff]/72 flex items-center justify-center pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <i className={`fa-solid ${icon} text-[9px]`}></i>
        </span>
        {children}
    </div>
);

const RESPONSE_HEADING_CLASSNAME = 'text-[#073b57] font-black';
const RESPONSE_STRONG_CLASSNAME = 'text-[#102033] font-black';
const RESPONSE_LABEL_CLASSNAME = 'text-[#075475] font-black';

const isDiagnosticHeading = (value: string) => {
    const normalized = value
        .replace(/\*\*/g, '')
        .replace(/:$/, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return [
        'hipotese inicial',
        'preciso confirmar',
        'faca agora',
        'acao segura',
        'verificacao inicial',
        'causa raiz',
        'anexos',
        'leitura da imagem',
        'modo consulta local'
    ].includes(normalized);
};

const formatText = (text: string, isUser: boolean) => {
    return text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const parts = line.split(/(\*\*.*?\*\*)|([A-ZÀ-Ú0-9 .ºª()/-]+?:)/g);
        return (
            <p key={i} className="min-h-[1em] mb-1">
                {line.trim().startsWith('* ') && <span className="inline-block w-1.5 h-1.5 mr-2 rounded-full bg-[#00d9ff] opacity-80"></span>}
                {parts.map((part, j) => {
                    if (part === undefined || part === '') return null;
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const cleanPart = part.slice(2, -2);
                        return (
                            <strong key={j} className={isUser ? 'text-white font-bold' : isDiagnosticHeading(cleanPart) ? RESPONSE_HEADING_CLASSNAME : RESPONSE_STRONG_CLASSNAME}>
                                {cleanPart}
                            </strong>
                        );
                    }
                    if (/^[A-ZÀ-Ú0-9 .ºª()/-]+:$/.test(part)) {
                        return <span key={j} className={isUser ? 'text-white font-bold' : RESPONSE_LABEL_CLASSNAME}>{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    });
};

const ChatBubble: React.FC<{
    msg: ChatMessage;
    onImageLoad?: () => void;
    onMount?: (messageId: string, element: HTMLDivElement | null) => void;
}> = React.memo(({ msg, onImageLoad, onMount }) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;
    const hasText = Boolean(msg.text.trim());

    return (
        <div
            ref={(element) => onMount?.(msg.id, element)}
            className={`flex flex-col max-w-[92%] mb-4 animate-slide-up scroll-mt-4 ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
        >
            <div className="flex items-end gap-3">
                <div
                    className={`max-w-[min(560px,82vw)] p-4 text-sm leading-relaxed shadow-lg font-sans border ${isUser
                        ? 'bg-[#24354a] text-white rounded-[22px] border-[#2f4a67]'
                        : 'bg-[#d7e2ec]/95 text-[#122033] rounded-2xl rounded-tl-md border-[#24425f]/55 shadow-[#2d3f55]/35'
                    } ${isError ? '!bg-red-500/20 !border-red-500 !text-red-100' : ''}`}
                >
                    {msg.files && msg.files.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {msg.files.map((file, index) => (
                                <div key={file.id || `${index}-${file.mime}`}>
                                    {file.type === 'image' && (
                                        <img
                                            src={file.data}
                                            alt={file.name || `Evidência ${index + 1}`}
                                            className="w-full rounded-lg border border-white/10"
                                            onLoad={onImageLoad}
                                        />
                                    )}
                                    {file.type === 'audio' && (
                                        <div className="w-full">
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70">
                                                <i className="fa-solid fa-volume-high mr-1"></i>
                                                {file.name || `Áudio ${index + 1}`}
                                            </p>
                                            <audio controls src={file.data} className="w-full h-8 rounded opacity-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {hasText ? (
                        <div className={`text-[15px] leading-[1.62] ${isUser ? 'font-medium' : 'font-semibold'}`}>
                            {formatText(msg.text, isUser)}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[#00d9ff]">
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:120ms]"></span>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:240ms]"></span>
                        </div>
                    )}

                    {msg.isStreaming && hasText && (
                        <div className="mt-2 flex items-center gap-1 text-[#00d9ff]">
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:120ms]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:240ms]"></span>
                        </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca7b8] mb-2">Fontes externas</p>
                            <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, index) => (
                                    <a
                                        key={`${source.uri}-${index}`}
                                        href={source.uri}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/15 hover:border-[#00d9ff]/50 transition-colors"
                                    >
                                        {source.title || 'Link'}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export const Tool_Assistant: React.FC = () => {
    const initialSnapshotRef = useRef(supportSessionService.load());
    const restoredSnapshot = initialSnapshotRef.current;
    const restoredMessages = restoredSnapshot ? supportSessionService.hydrateMessages(restoredSnapshot) : [];

    const [messages, setMessages] = useState<ChatMessage[]>(() =>
        restoredMessages.length > 0 ? restoredMessages : [createWelcomeMessage()]
    );
    const messagesRef = useRef(messages);
    const [input, setInput] = useState(() => restoredSnapshot?.draft ?? '');
    const [mode, setMode] = useState<SupportMode>(() => restoredSnapshot?.mode ?? 'AUTO');
    const [diagnosticContext, setDiagnosticContext] = useState<SupportDiagnosticContext>(() => restoredSnapshot?.diagnosticContext ?? {});
    const [selectedFiles, setSelectedFiles] = useState<SelectedSupportFile[]>([]);
    const [pendingAttachmentMeta, setPendingAttachmentMeta] = useState<SupportAttachmentMeta[]>(() => restoredSnapshot?.attachmentsMeta ?? []);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    const [showRestoreNotice, setShowRestoreNotice] = useState(() =>
        Boolean(restoredSnapshot && (restoredMessages.length > 1 || restoredSnapshot.draft || restoredSnapshot.attachmentsMeta.length || hasDiagnosticContextValue(restoredSnapshot.diagnosticContext)))
    );
    const [isDiagnosticContextCollapsed, setIsDiagnosticContextCollapsed] = useState(() =>
        isDiagnosticContextComplete(restoredSnapshot?.diagnosticContext) || hasStartedConversation(restoredMessages)
    );

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messageElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordTimerRef = useRef<number | null>(null);
    const shouldSaveRecordingRef = useRef(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const wasDiagnosticContextCompleteRef = useRef(isDiagnosticContextComplete(restoredSnapshot?.diagnosticContext));
    const conversationStarted = hasStartedConversation(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const formatRecordTime = (seconds: number) =>
        `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    const scrollToBottom = React.useCallback(() => {
        window.setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }, []);

    const registerMessageElement = React.useCallback((messageId: string, element: HTMLDivElement | null) => {
        if (element) {
            messageElementRefs.current[messageId] = element;
            return;
        }

        delete messageElementRefs.current[messageId];
    }, []);

    const scrollMessageToReadingStart = React.useCallback((messageId: string) => {
        window.setTimeout(() => {
            const container = chatContainerRef.current;
            const element = messageElementRefs.current[messageId];

            if (!container || !element) return;

            const nextTop = Math.max(
                0,
                element.offsetTop - container.offsetTop - 12
            );

            container.scrollTo({
                top: nextTop,
                behavior: 'smooth'
            });
        }, 120);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [pendingAttachmentMeta, scrollToBottom, selectedFiles]);

    useEffect(() => {
        if (restoredMessages.length > 0) {
            scrollToBottom();
        }
    }, [restoredMessages.length, scrollToBottom]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            supportSessionService.save({
                mode,
                draft: input,
                messages,
                diagnosticContext,
                attachmentsMeta: pendingAttachmentMeta
            });
        }, 150);

        return () => window.clearTimeout(timeoutId);
    }, [mode, input, messages, diagnosticContext, pendingAttachmentMeta]);

    useEffect(() => {
        const isComplete = isDiagnosticContextComplete(diagnosticContext);
        if (isComplete && !wasDiagnosticContextCompleteRef.current) {
            setIsDiagnosticContextCollapsed(true);
        }
        if (!isComplete && !conversationStarted) {
            setIsDiagnosticContextCollapsed(false);
        }
        wasDiagnosticContextCompleteRef.current = isComplete;
    }, [conversationStarted, diagnosticContext]);

    const handleDiagnosticContextChange = (field: keyof SupportDiagnosticContext, value: string) => {
        setDiagnosticContext(prev => ({
            ...prev,
            [field]: value.trim() ? value : undefined
        }));
    };

    const handleModeSelect = (nextMode: SupportMode) => {
        if (nextMode === mode || isLoadingChat) return;

        setMode(nextMode);
        if (nextMode !== 'AUTO') {
            const modeMessage = createModeMessage(nextMode);
            setMessages(prev => [...prev, modeMessage]);
            scrollMessageToReadingStart(modeMessage.id);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;

        const nextFiles = (await Promise.all(files.map(readFileAsDataUrl))).filter(
            (file): file is SelectedSupportFile => Boolean(file)
        );

        if (nextFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...nextFiles]);
            setPendingAttachmentMeta(prev => [...prev, ...buildAttachmentMeta(nextFiles)]);
        }

        if (nextFiles.length !== files.length) {
            showSupportAlert('Apenas imagens e áudios são suportados neste atendimento.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const encodeWav = (audioBuffer: AudioBuffer): Blob => {
        const length = audioBuffer.length;
        const channelCount = audioBuffer.numberOfChannels || 1;
        const sampleRate = audioBuffer.sampleRate;
        const mono = new Float32Array(length);

        for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
            const channel = audioBuffer.getChannelData(channelIndex);
            for (let index = 0; index < length; index += 1) {
                mono[index] += channel[index] / channelCount;
            }
        }

        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);
        const writeString = (offset: number, value: string) => {
            for (let index = 0; index < value.length; index += 1) {
                view.setUint8(offset + index, value.charCodeAt(index));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        let offset = 44;
        for (let index = 0; index < length; index += 1) {
            const sample = Math.max(-1, Math.min(1, mono[index]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    };

    const cleanupRecording = React.useCallback(() => {
        if (recordTimerRef.current !== null) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
    }, []);

    useEffect(() => () => {
        cleanupRecording();
    }, [cleanupRecording]);

    const stopRecording = (shouldSave: boolean) => {
        shouldSaveRecordingRef.current = shouldSave;
        setIsRecording(false);

        if (recordTimerRef.current !== null) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
            return;
        }

        cleanupRecording();
    };

    const startRecording = async () => {
        if (isRecording || isLoadingChat) return;

        if (
            typeof navigator === 'undefined' ||
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === 'undefined'
        ) {
            showSupportAlert('Este navegador não permite gravar aqui. Use o clipe para anexar um áudio.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            shouldSaveRecordingRef.current = true;

            recorder.ondataavailable = (event) => {
                if (event.data?.size) audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                if (!shouldSaveRecordingRef.current) {
                    cleanupRecording();
                    return;
                }

                try {
                    const rawAudio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext: AudioContext = new AudioContextClass();
                    const audioBuffer = await audioContext.decodeAudioData(await rawAudio.arrayBuffer());
                    await audioContext.close();
                    const wavAudio = encodeWav(audioBuffer);
                    const reader = new FileReader();

                    reader.onloadend = () => {
                        const audioFile: SelectedSupportFile = {
                            id: createSupportId(),
                            name: `audio-campo-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`,
                            data: reader.result as string,
                            mime: 'audio/wav',
                            type: 'audio'
                        };
                        setSelectedFiles(prev => [...prev, audioFile]);
                        setPendingAttachmentMeta(prev => [...prev, ...buildAttachmentMeta([audioFile])]);
                    };
                    reader.onerror = () => showSupportAlert('Não consegui anexar o áudio gravado. Tente novamente.');
                    reader.readAsDataURL(wavAudio);
                } catch (error) {
                    console.warn('[Tool_1_Assistant] Falha ao processar áudio gravado:', error);
                    showSupportAlert('Não consegui processar o áudio gravado. Tente novamente.');
                } finally {
                    cleanupRecording();
                }
            };

            recorder.start();
            setRecordSeconds(0);
            setIsRecording(true);
            recordTimerRef.current = window.setInterval(() => {
                setRecordSeconds(seconds => {
                    if (seconds >= 119) {
                        stopRecording(true);
                        return 120;
                    }
                    return seconds + 1;
                });
            }, 1000);
        } catch (error) {
            console.warn('[Tool_1_Assistant] Falha ao iniciar gravação:', error);
            cleanupRecording();
            showSupportAlert('Permita o acesso ao microfone para gravar áudio no atendimento.');
        }
    };

    const removeSelectedFile = (fileId: string) => {
        setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
        setPendingAttachmentMeta(prev => prev.filter(file => file.id !== fileId));
    };

    const applyLocalFallback = (modelMessageId: string, prompt: string, attachmentCount: number) => {
        const { text } = localSupportService.generateResponse(prompt, mode, diagnosticContext);
        const finalText = attachmentCount > 0
            ? `${text}\n\nANEXOS: os anexos visuais ficam pendentes até a conexão voltar.`
            : text;

        setMessages(prev =>
            prev.map(msg =>
                msg.id === modelMessageId ? { ...msg, text: finalText, isError: false, isStreaming: false } : msg
            )
        );
    };

    const sendMessage = async () => {
        if (isLoadingChat) return;

        let textToSend = input.trim();
        const filesToSend = [...selectedFiles];

        if (!textToSend && filesToSend.length > 0) {
            textToSend = buildAttachmentDisplayText(filesToSend);
        }

        if (!textToSend && filesToSend.length === 0) return;

        const userMsg: ChatMessage = {
            id: createSupportId(),
            role: 'user',
            text: textToSend,
            files: filesToSend,
            createdAt: Date.now()
        };

        const modelMessageId = createSupportId();
        setMessages(prev => [
            ...prev,
            userMsg,
            { id: modelMessageId, role: 'model', text: '', isStreaming: true, createdAt: Date.now() }
        ]);
        scrollMessageToReadingStart(modelMessageId);
        setInput('');
        setSelectedFiles([]);
        setPendingAttachmentMeta([]);
        setIsDiagnosticContextCollapsed(true);
        setIsLoadingChat(true);
        setShowRestoreNotice(false);

        if (fileInputRef.current) fileInputRef.current.value = '';

        const localPrompt = textToSend.startsWith('[')
            ? buildAttachmentAnalysisPrompt(filesToSend, textToSend)
            : textToSend;

        if (!isOnline) {
            applyLocalFallback(modelMessageId, localPrompt, filesToSend.length);
            setIsLoadingChat(false);
            return;
        }

        let allowAiUpdates = true;

        try {
            const conversationForApi = buildSupportApiHistory(messagesRef.current, userMsg);
            const conversationUserTurnCount = countSupportUserTurns(messagesRef.current, userMsg);

            const aiResponsePromise = generateChatResponseStream(
                conversationForApi,
                (chunkText: string) => {
                    if (!allowAiUpdates) return;
                    setMessages(prev =>
                        prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: chunkText } : msg))
                    );
                },
                (finalText, sources) => {
                    if (!allowAiUpdates) return;
                    setMessages(prev =>
                    prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: finalText, sources, isStreaming: false } : msg))
                    );
                },
                mode,
                diagnosticContext,
                conversationUserTurnCount
            );

            aiResponsePromise.catch(() => undefined);

            await Promise.race([
                aiResponsePromise,
                new Promise((_, reject) => {
                    window.setTimeout(() => reject(new Error('SUPPORT_STREAM_TIMEOUT')), SUPPORT_STREAM_TIMEOUT_MS);
                })
            ]);
        } catch (error: any) {
            allowAiUpdates = false;
            console.error('Chat Error:', error?.message || 'Unknown error');

            const errorMessage = error?.message || 'FALHA DE CONEXAO. Tente novamente.';
            const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
            const shouldUseLocalFallback = browserOffline || /503|429|quota|limite|conex|fetch|network|timeout|support_stream_timeout|socket|indispon|unavailable|empty_support_response/i.test(errorMessage.toLowerCase());

            if (shouldUseLocalFallback) {
                applyLocalFallback(modelMessageId, localPrompt, filesToSend.length);
            } else {
                setMessages(prev =>
                    prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: errorMessage, isError: true, isStreaming: false } : msg))
                );
            }
        } finally {
            setIsLoadingChat(false);
        }
    };

    const resetMessages = () => {
        if (!confirmSupportHistoryReset()) return;

        supportSessionService.clear();
        setMessages([createWelcomeMessage()]);
        setInput('');
        setMode('AUTO');
        setDiagnosticContext({});
        setSelectedFiles([]);
        setPendingAttachmentMeta([]);
        setIsDiagnosticContextCollapsed(false);
        setIsLoadingChat(false);
        setShowRestoreNotice(false);
        scrollToBottom();

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasRestoredAttachmentMeta = pendingAttachmentMeta.length > 0 && selectedFiles.length === 0;
    const diagnosticSummary = getDiagnosticContextSummary(diagnosticContext);
    const diagnosticContextFilledCount = diagnosticSummary.length;
    const diagnosticContextProgress = `${diagnosticContextFilledCount}/4`;
    const isDiagnosticContextReady = diagnosticContextFilledCount === 4;
    const modeOptions: Array<{ value: SupportMode; label: string; icon: string }> = [
        { value: 'AUTO', label: 'AUTO (IA)', icon: 'fa-robot' },
        { value: 'REF', label: 'REFRIGERAÇÃO', icon: 'fa-snowflake' },
        { value: 'ELEC', label: 'ELÉTRICA', icon: 'fa-bolt' }
    ];

    return (
        <div className="h-full max-w-2xl mx-auto flex flex-col px-2 pt-1 pb-2 animate-fadeIn">
            <div className="shrink-0 rounded-[18px] border border-[#28405b]/70 bg-[#53657a]/82 shadow-lg shadow-[#35475c]/20 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#06c8f6] text-white flex items-center justify-center shadow-md shadow-[#19435a]/35 shrink-0">
                            <i className="fa-solid fa-headset text-base"></i>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ffd400]">Suporte direto</p>
                        </div>
                    </div>

                    <button
                        onClick={resetMessages}
                        className="w-8 h-8 rounded-xl bg-[#24354a] text-white border border-[#2f4a67] flex items-center justify-center shrink-0"
                        aria-label="Limpar conversa"
                    >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>

                <div className="flex gap-1.5 px-2.5 pb-2 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setIsDiagnosticContextCollapsed(prev => !prev)}
                        className={`shrink-0 h-8 px-3 rounded-full border flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${isDiagnosticContextReady
                            ? 'border-[#18e07a]/35 bg-[#143929]/65 text-[#c6ffd8]'
                            : 'border-[#2f4a67] bg-[#24354a] text-white'
                        }`}
                        aria-label={isDiagnosticContextCollapsed ? 'Abrir dados base' : 'Fechar dados base'}
                    >
                        <i className="fa-solid fa-sliders text-[10px]"></i>
                        <span>Dados</span>
                        <span className="min-w-7 h-4 px-1.5 rounded-full bg-white/10 flex items-center justify-center text-[8.5px]">
                            {diagnosticContextProgress}
                        </span>
                    </button>
                    {modeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleModeSelect(option.value)}
                            disabled={isLoadingChat}
                            className={`shrink-0 h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${mode === option.value
                                ? 'bg-[#06c8f6] text-white border-[#29dcff] shadow-lg shadow-[#19435a]/40'
                                : 'bg-[#24354a] text-white border-[#2f4a67]'
                            } ${isLoadingChat ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <i className={`fa-solid ${option.icon} text-[11px]`}></i>
                            <span>{option.label}</span>
                        </button>
                    ))}
                    <div className="shrink-0 h-8 px-2.5 rounded-full bg-[#24354a]/70 border border-[#2f4a67] text-white flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#18e07a] animate-pulse' : 'bg-red-300'}`}></span>
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>

                {!isDiagnosticContextCollapsed && (
                    <div className="mx-2.5 mb-2 rounded-[16px] border border-[#28405b]/70 bg-[#617287]/72 p-2.5 shadow-inner shadow-[#2d3f55]/20">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffd400]">Dados Base</span>
                            <button
                                type="button"
                                onClick={() => setIsDiagnosticContextCollapsed(true)}
                                className="w-7 h-7 rounded-full bg-[#24354a] text-white border border-[#2f4a67] flex items-center justify-center"
                                aria-label="Fechar dados base"
                            >
                                <i className="fa-solid fa-chevron-up text-[10px]"></i>
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            <DiagnosticFieldShell icon={DIAGNOSTIC_FIELD_META.model.icon}>
                                <input
                                    type="text"
                                    value={diagnosticContext.model ?? ''}
                                    onChange={(event) => handleDiagnosticContextChange('model', event.target.value)}
                                    disabled={isLoadingChat}
                                    className={`${INPUT_BASE_CLASSNAME} h-8 rounded-xl pl-7 pr-1.5 text-[11px]`}
                                    placeholder="Mod"
                                />
                            </DiagnosticFieldShell>
                            <DiagnosticFieldShell icon={DIAGNOSTIC_FIELD_META.voltage.icon}>
                                <select
                                    value={diagnosticContext.voltage ?? ''}
                                    onChange={(event) => handleDiagnosticContextChange('voltage', event.target.value)}
                                    disabled={isLoadingChat}
                                    className={`${INPUT_BASE_CLASSNAME} h-8 rounded-xl pl-7 pr-1 text-[11px]`}
                                >
                                    {VOLTAGE_OPTIONS.map(option => (
                                        <option key={option.value || 'blank'} value={option.value} className="text-black">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </DiagnosticFieldShell>
                            <DiagnosticFieldShell icon={DIAGNOSTIC_FIELD_META.refrigerant.icon}>
                                <select
                                    value={diagnosticContext.refrigerant ?? ''}
                                    onChange={(event) => handleDiagnosticContextChange('refrigerant', event.target.value)}
                                    disabled={isLoadingChat}
                                    className={`${INPUT_BASE_CLASSNAME} h-8 rounded-xl pl-7 pr-1 text-[11px]`}
                                >
                                    {FLUID_OPTIONS.map(option => (
                                        <option key={option.value || 'blank'} value={option.value} className="text-black">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </DiagnosticFieldShell>
                            <DiagnosticFieldShell icon={DIAGNOSTIC_FIELD_META.temperature.icon}>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={diagnosticContext.temperature ?? ''}
                                    onChange={(event) => handleDiagnosticContextChange('temperature', event.target.value)}
                                    disabled={isLoadingChat}
                                    className={`${INPUT_BASE_CLASSNAME} h-8 rounded-xl pl-7 pr-1.5 text-[11px]`}
                                    placeholder="Tem"
                                />
                            </DiagnosticFieldShell>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative pt-2">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 px-1.5 flex flex-col pb-3 no-scrollbar">
                    {showRestoreNotice && (
                        <div className="self-center max-w-[92%] rounded-full border border-[#00d9ff]/28 bg-[#00d9ff]/10 px-3 py-1.5 text-center text-[10.5px] leading-snug text-[#d9f6ff]">
                            <span>Sessão restaurada neste dispositivo.</span>
                            <button onClick={() => setShowRestoreNotice(false)} className="ml-2 inline-flex w-5 h-5 items-center justify-center rounded-full border border-white/10 text-white/70 align-middle" aria-label="Fechar aviso">
                                <i className="fa-solid fa-xmark text-[9px]"></i>
                            </button>
                        </div>
                    )}
                    {!isOnline && (
                        <div className="self-stretch rounded-[18px] border border-[#ff6600]/35 bg-[#ff6600]/10 px-4 py-3 text-[12px] text-[#ffe0cc]">
                            Sem internet agora. O suporte troca para consulta local para não te deixar sem orientação.
                        </div>
                    )}

                    {hasRestoredAttachmentMeta && (
                        <div className="self-stretch rounded-[18px] border border-[#00d9ff]/25 bg-[#00d9ff]/8 px-4 py-3 text-[12px] text-[#d7f5ff]">
                            <p className="font-semibold mb-2">Anexos pendentes da sessão</p>
                            <div className="flex flex-wrap gap-2">
                                {pendingAttachmentMeta.map(file => (
                                    <span key={file.id} className="px-2.5 py-1 rounded-full bg-black/20 border border-white/10">
                                        {file.name || `${file.type} pendente`}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-2 text-[#9edfff]">Reanexe os arquivos se quiser enviá-los outra vez para análise.</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <ChatBubble
                            key={message.id || index}
                            msg={message}
                            onImageLoad={scrollToBottom}
                            onMount={registerMessageElement}
                        />
                    ))}
                </div>

                {selectedFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {selectedFiles.map(file => (
                            <div key={file.id} className="relative rounded-[18px] overflow-hidden border border-[#4a5c73] bg-[#2a3646]/95 group">
                                {file.type === 'image' ? (
                                    <img src={file.data} alt={file.name || 'Preview'} className="w-full h-20 object-cover" />
                                ) : (
                                    <div className="w-full h-20 flex flex-col items-center justify-center text-[#00d9ff] gap-1">
                                        <i className="fa-solid fa-file-audio text-xl"></i>
                                        <span className="text-[10px] text-white/70 px-2 text-center truncate w-full">{file.name || 'Áudio'}</span>
                                    </div>
                                )}
                                <button onClick={() => removeSelectedFile(file.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover ${file.name || 'anexo'}`}>
                                    <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-2 pb-1">
                    <div className="p-2 rounded-[18px] bg-[#c8d1dc]/65 backdrop-blur-xl border border-[#18324f] shadow-[0_12px_24px_rgba(45,63,85,0.24)]">
                        {isRecording ? (
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 min-w-0 h-11 rounded-xl px-3 bg-red-500/10 border border-red-500/40 text-red-100 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                                    <span className="text-[12px] font-black uppercase tracking-[0.12em] truncate">
                                        Gravando {formatRecordTime(recordSeconds)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => stopRecording(false)}
                                    className="w-11 h-11 rounded-xl bg-[#24354a] border border-[#2f4a67] text-white flex items-center justify-center shrink-0 active:scale-95"
                                    aria-label="Cancelar gravação"
                                >
                                    <i className="fa-solid fa-xmark text-[15px]"></i>
                                </button>
                                <button
                                    onClick={() => stopRecording(true)}
                                    className="w-11 h-11 rounded-xl bg-[#06c8f6] border border-[#29dcff] text-white flex items-center justify-center shrink-0 active:scale-95"
                                    aria-label="Anexar áudio gravado"
                                >
                                    <i className="fa-solid fa-check text-[15px]"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-1.5 items-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoadingChat}
                                    className={`w-10 h-11 rounded-xl bg-[#24354a] border border-[#2f4a67] transition-all flex items-center justify-center shrink-0 ${selectedFiles.length > 0
                                        ? 'text-[#06c8f6] border-[#06c8f6]/70'
                                        : 'text-white hover:bg-[#2f4a67]'
                                    } ${isLoadingChat ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    aria-label="Anexar arquivo"
                                >
                                    <i className="fa-solid fa-paperclip text-[14px]"></i>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                                </button>

                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    disabled={isLoadingChat}
                                    className="w-10 h-11 rounded-xl bg-[#24354a] border border-[#2f4a67] text-white hover:bg-[#2f4a67] transition-all flex items-center justify-center shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                    aria-label="Tirar foto"
                                >
                                    <i className="fa-solid fa-camera text-[14px]"></i>
                                    <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                                </button>

                                <button
                                    onClick={() => void startRecording()}
                                    disabled={isLoadingChat}
                                    className="w-10 h-11 rounded-xl bg-[#24354a] border border-[#2f4a67] text-white hover:bg-[#2f4a67] transition-all flex items-center justify-center shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                    aria-label="Gravar áudio"
                                >
                                    <i className="fa-solid fa-microphone text-[14px]"></i>
                                </button>

                                <div className="flex-1 relative min-w-0">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                void sendMessage();
                                            }
                                        }}
                                        disabled={isLoadingChat}
                                        className="w-full h-11 rounded-xl px-3 text-[15px] bg-[#c8d1dc]/70 border border-[#18324f] text-[#203249] font-medium focus:border-[#06c8f6] outline-none transition-all placeholder:text-[#7d8da0] placeholder:font-normal disabled:opacity-70"
                                        placeholder={isOnline ? 'Mensagem...' : 'Sem internet...'}
                                    />
                                </div>

                                <button onClick={() => void sendMessage()} disabled={isLoadingChat} className="w-10 h-11 rounded-xl bg-[#ff6b16] text-white flex items-center justify-center shadow-lg shadow-[#9c4b20]/30 active:scale-95 transition-all hover:bg-[#ff7f2e] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Enviar mensagem">
                                    <i className="fa-solid fa-paper-plane text-[14px] translate-x-[1px]"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
