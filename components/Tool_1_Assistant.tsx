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

const WELCOME_TEXT = 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje?\nDescreva o problema ou envie fotos/áudios para análise.';

const MODE_NAMES: Record<SupportMode, string> = {
    AUTO: 'Auto (IA)',
    REF: 'Refrigeração',
    ELEC: 'Elétrica'
};

const FLUID_OPTIONS = [
    { value: '', label: 'Fluido refrigerante' },
    { value: Refrigerant.R404A, label: Refrigerant.R404A },
    { value: Refrigerant.R22, label: Refrigerant.R22 }
];

type SelectedSupportFile = {
    id: string;
    name?: string;
    data: string;
    mime: string;
    type: 'image' | 'audio';
};

const createSupportId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `support-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const showSupportAlert = (message: string) => {
    if (typeof window === 'undefined' || typeof window.alert !== 'function') {
        console.warn(`[Tool_1_Assistant] Aviso nao exibido: ${message}`);
        return;
    }

    window.alert(message);
};
const confirmSupportHistoryReset = () => {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
        console.warn('[Tool_1_Assistant] Confirmacao indisponivel para apagar historico do atendimento.');
        return false;
    }

    return window.confirm('Deseja apagar o historico deste atendimento?');
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
    text: `Modo de Diagnóstico Focado em **${MODE_NAMES[mode]}** ativado. Descreva o problema detalhadamente.`,
    createdAt: Date.now()
});

const buildAttachmentMeta = (files: SelectedSupportFile[]): SupportAttachmentMeta[] =>
    files.map(file => ({
        id: file.id,
        name: file.name,
        mime: file.mime,
        type: file.type
    }));

const readFileAsDataUrl = (file: File): Promise<SelectedSupportFile | null> =>
    new Promise(resolve => {
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');

        if (!isImage && !isAudio) {
            resolve(null);
            return;
        }

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

const hasDiagnosticContextValue = (context?: SupportDiagnosticContext) =>
    Boolean(context && (context.model?.trim() || context.voltage?.trim() || context.refrigerant?.trim()));

const isDiagnosticContextComplete = (context?: SupportDiagnosticContext) =>
    Boolean(context?.model?.trim() && context?.voltage?.trim() && context?.refrigerant?.trim());

const getDiagnosticContextSummary = (context: SupportDiagnosticContext) =>
    [context.model, context.voltage, context.refrigerant].filter(Boolean) as string[];

const formatText = (text: string, isUser: boolean) => {
    return text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const parts = line.split(/(\*\*.*?\*\*)|([A-Z ]+?:)/g);
        return (
            <p key={i} className="min-h-[1em] mb-0.5">
                {line.trim().startsWith('* ') && <span className="inline-block w-1.5 h-1.5 mr-2 rounded-full bg-[#00d9ff] opacity-80"></span>}
                {parts.map((part, j) => {
                    if (part === undefined || part === '') return null;
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className={isUser ? 'text-white font-bold' : 'text-[#ff6600] font-bold'}>{part.slice(2, -2)}</strong>;
                    }
                    if (/^[A-Z ]+:$/.test(part)) {
                        return <span key={j} className="text-[#00d9ff] font-bold">{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    });
};

const ChatBubble: React.FC<{ msg: ChatMessage; onImageLoad?: () => void }> = React.memo(({ msg, onImageLoad }) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;
    const hasText = Boolean(msg.text.trim());

    return (
        <div className={`flex flex-col max-w-[95%] mb-4 animate-slide-up ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
            {!isUser && (
                <span className="text-[10px] font-bold uppercase mb-1.5 px-1 tracking-[0.18em] font-heading text-[#ff9900]">
                    SUPORTE ORDEMILK
                </span>
            )}
            <div className="flex items-end gap-3">
                {!isUser && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#00d9ff] flex items-center justify-center bg-transparent shrink-0 mb-1">
                        <i className="fa-solid fa-headset text-[14px] text-[#00d9ff]"></i>
                    </div>
                )}
                <div
                    className={`max-w-[min(560px,78vw)] p-4 sm:p-5 text-sm leading-relaxed shadow-lg font-sans border ${isUser
                        ? 'bg-[#2a3646] text-white rounded-[22px] border-[#4a5c73]'
                        : 'bg-[#3b4c61]/92 text-white rounded-b-[24px] rounded-tl-[4px] rounded-tr-[24px] border-[#4a5c73] shadow-[0_10px_24px_rgba(24,35,49,0.18)]'
                    } ${isError ? '!bg-red-500/20 !border-red-500 !text-red-100' : ''}`}
                >
                    {msg.files && msg.files.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {msg.files.map((file, index) => (
                                <div key={file.id || `${index}-${file.mime}`}>
                                    {file.type === 'image' && (
                                        <img
                                            src={file.data}
                                            alt={file.name || `Evidencia ${index + 1}`}
                                            className="w-full rounded-lg border border-white/10"
                                            onLoad={onImageLoad}
                                        />
                                    )}
                                    {file.type === 'audio' && (
                                        <div className="w-full">
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70">
                                                <i className="fa-solid fa-volume-high mr-1"></i>
                                                {file.name || `Audio ${index + 1}`}
                                            </p>
                                            <audio controls src={file.data} className="w-full h-8 rounded opacity-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {hasText ? (
                        <div className="text-[15px] leading-relaxed font-medium">
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
        isDiagnosticContextComplete(restoredSnapshot?.diagnosticContext)
    );

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wasDiagnosticContextCompleteRef = useRef(isDiagnosticContextComplete(restoredSnapshot?.diagnosticContext));

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

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

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedFiles, pendingAttachmentMeta, scrollToBottom]);

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
        if (!isComplete) {
            setIsDiagnosticContextCollapsed(false);
        }
        wasDiagnosticContextCompleteRef.current = isComplete;
    }, [diagnosticContext]);

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
            setMessages(prev => [...prev, createModeMessage(nextMode)]);
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
            showSupportAlert('Apenas imagens e audios sao suportados neste atendimento.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeSelectedFile = (fileId: string) => {
        setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
        setPendingAttachmentMeta(prev => prev.filter(file => file.id !== fileId));
    };

    const applyLocalFallback = (modelMessageId: string, prompt: string, attachmentCount: number) => {
        const { text } = localSupportService.generateResponse(prompt, mode, diagnosticContext);
        const finalText = attachmentCount > 0
            ? `${text}\n\nANEXOS: Os anexos visuais ficam pendentes ate a conexao voltar.`
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
            textToSend = `[${filesToSend.length} arquivo(s) enviado(s) para analise]`;
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
        setInput('');
        setSelectedFiles([]);
        setPendingAttachmentMeta([]);
        setIsLoadingChat(true);
        setShowRestoreNotice(false);

        if (fileInputRef.current) fileInputRef.current.value = '';

        const localPrompt = textToSend.startsWith('[')
            ? 'Analise os anexos enviados e conduza um diagnostico tecnico objetivo.'
            : textToSend;

        if (!isOnline) {
            applyLocalFallback(modelMessageId, localPrompt, filesToSend.length);
            setIsLoadingChat(false);
            return;
        }

        try {
            const historyForApi = [...messagesRef.current, userMsg].map(message => {
                const parts: any[] = [];
                const effectiveText = message.text;

                const isAttachmentPlaceholder = message.text.startsWith('[') && Boolean(message.files?.length);

                if (effectiveText && (!isAttachmentPlaceholder || effectiveText !== message.text || !message.files?.length)) {
                    parts.push({ text: effectiveText });
                } else if (effectiveText && !message.files?.length) {
                    parts.push({ text: effectiveText });
                }

                message.files?.forEach(file => {
                    parts.push({
                        inlineData: {
                            mimeType: file.mime,
                            data: file.data.split(',')[1]
                        }
                    });
                });

                if (parts.length === 0) parts.push({ text: effectiveText || 'Analise de arquivo.' });
                return { role: message.role, parts };
            });

            await generateChatResponseStream(
                historyForApi,
                (chunkText: string) => {
                    setMessages(prev =>
                        prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: chunkText } : msg))
                    );
                },
                (finalText, sources) => {
                    setMessages(prev =>
                    prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: finalText, sources, isStreaming: false } : msg))
                    );
                },
                mode,
                diagnosticContext
            );
        } catch (error: any) {
            console.error('Chat Error:', error?.message || 'Unknown error');

            const errorMessage = error?.message || 'FALHA DE CONEXAO. Tente novamente.';
            const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
            const shouldUseLocalFallback = browserOffline || /503|conex|fetch|network/i.test(errorMessage.toLowerCase());

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
        setIsLoadingChat(false);
        setShowRestoreNotice(false);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasRestoredAttachmentMeta = pendingAttachmentMeta.length > 0 && selectedFiles.length === 0;
    const diagnosticSummary = getDiagnosticContextSummary(diagnosticContext);
    const modeOptions: Array<{ value: SupportMode; label: string; icon: string }> = [
        { value: 'AUTO', label: 'AUTO (IA)', icon: 'fa-robot' },
        { value: 'REF', label: 'REFRIGERACAO', icon: 'fa-snowflake' },
        { value: 'ELEC', label: 'ELETRICA', icon: 'fa-bolt' }
    ];

    return (
        <div className="animate-fadeIn h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-[14px] bg-[#0099ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,153,255,0.3)] border border-[#00d9ff]/50 shrink-0">
                    <i className="fa-solid fa-headset text-[16px] text-white"></i>
                </div>
                <div className="min-w-0">
                    <h2 className="text-white font-bold text-[18px] leading-tight tracking-wide font-heading">1. SUPORTE DIRETO</h2>
                    <p className="text-[#ff9900] text-[11px] font-bold tracking-[0.18em] uppercase mt-0.5 font-heading">SUPORTE ORDEMILK</p>
                </div>
            </div>

            {showRestoreNotice && (
                <div className="mb-3 rounded-[20px] border border-[#00d9ff]/35 bg-[#00d9ff]/10 px-4 py-3 text-[12px] text-[#d9f6ff]">
                    <div className="flex items-start justify-between gap-3">
                        <p className="leading-relaxed font-medium">Sessao restaurada neste dispositivo. Historico, rascunho e dados base do equipamento seguem salvos localmente.</p>
                        <button onClick={() => setShowRestoreNotice(false)} className="w-6 h-6 rounded-full border border-white/10 text-white/70 hover:text-white shrink-0" aria-label="Fechar aviso">
                            <i className="fa-solid fa-xmark text-[11px]"></i>
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-3 rounded-[20px] border border-[#4a5c73] bg-[#3b4c61]/70 px-3.5 py-2.5 shadow-[0_10px_24px_rgba(24,35,49,0.12)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[#ff9900] text-[11px] font-bold tracking-[0.18em] uppercase font-heading">Dados Base</p>
                        {!isDiagnosticContextCollapsed && (
                            <p className="text-[12px] text-white/90 font-medium leading-relaxed mt-0.5">Modelo, tensao e fluido entram automaticamente no suporte.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full border border-[#00d9ff]/20 bg-[#00d9ff]/10 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8f4ff] shrink-0">
                            Automatico
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsDiagnosticContextCollapsed(prev => !prev)}
                            className="w-8 h-8 rounded-full border border-[#4a5c73] bg-[#2a3646]/85 text-white/80 hover:text-white hover:border-[#00d9ff]/45 transition-all flex items-center justify-center"
                            aria-label={isDiagnosticContextCollapsed ? 'Expandir dados base' : 'Minimizar dados base'}
                        >
                            <i className={`fa-solid ${isDiagnosticContextCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[11px]`}></i>
                        </button>
                    </div>
                </div>

                {isDiagnosticContextCollapsed ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {diagnosticSummary.length > 0 ? diagnosticSummary.map(item => (
                            <span key={item} className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] text-white/90">
                                {item}
                            </span>
                        )) : (
                            <span className="text-[11px] text-white/65">Preencha os 3 dados para minimizar automaticamente.</span>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                        <input
                            type="text"
                            value={diagnosticContext.model ?? ''}
                            onChange={(event) => handleDiagnosticContextChange('model', event.target.value)}
                            disabled={isLoadingChat}
                            className="w-full h-9 rounded-[14px] px-3 text-[13px] bg-[#00000022] border border-[#4a5c73] text-[#F8FAFC] font-medium focus:border-[#00d9ff]/60 outline-none transition-all placeholder:text-[#8896a8] placeholder:font-normal disabled:opacity-70"
                            placeholder="Modelo do tanque"
                        />
                        <input
                            type="text"
                            value={diagnosticContext.voltage ?? ''}
                            onChange={(event) => handleDiagnosticContextChange('voltage', event.target.value)}
                            disabled={isLoadingChat}
                            className="w-full h-9 rounded-[14px] px-3 text-[13px] bg-[#00000022] border border-[#4a5c73] text-[#F8FAFC] font-medium focus:border-[#00d9ff]/60 outline-none transition-all placeholder:text-[#8896a8] placeholder:font-normal disabled:opacity-70"
                            placeholder="Tensao"
                        />
                        <select
                            value={diagnosticContext.refrigerant ?? ''}
                            onChange={(event) => handleDiagnosticContextChange('refrigerant', event.target.value)}
                            disabled={isLoadingChat}
                            className="w-full h-9 rounded-[14px] px-3 text-[13px] bg-[#00000022] border border-[#4a5c73] text-[#F8FAFC] font-medium focus:border-[#00d9ff]/60 outline-none transition-all disabled:opacity-70"
                        >
                            {FLUID_OPTIONS.map(option => (
                                <option key={option.value || 'blank'} value={option.value} className="text-black">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-5 pr-1 flex flex-col pb-4 no-scrollbar">
                    {!isOnline && (
                        <div className="self-stretch rounded-[18px] border border-[#ff6600]/35 bg-[#ff6600]/10 px-4 py-3 text-[12px] text-[#ffe0cc]">
                            Sem internet no momento. O suporte usa consulta local automatica para nao te deixar sem resposta.
                        </div>
                    )}

                    {hasRestoredAttachmentMeta && (
                        <div className="self-stretch rounded-[18px] border border-[#00d9ff]/25 bg-[#00d9ff]/8 px-4 py-3 text-[12px] text-[#d7f5ff]">
                            <p className="font-semibold mb-2">Anexos pendentes da sessao restaurada</p>
                            <div className="flex flex-wrap gap-2">
                                {pendingAttachmentMeta.map(file => (
                                    <span key={file.id} className="px-2.5 py-1 rounded-full bg-black/20 border border-white/10">
                                        {file.name || `${file.type} pendente`}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-2 text-[#9edfff]">Reanexe os arquivos se quiser envia-los novamente para analise.</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <ChatBubble key={message.id || index} msg={message} onImageLoad={scrollToBottom} />
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
                                        <span className="text-[10px] text-white/70 px-2 text-center truncate w-full">{file.name || 'Audio'}</span>
                                    </div>
                                )}
                                <button onClick={() => removeSelectedFile(file.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover ${file.name || 'anexo'}`}>
                                    <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-3 pb-1">
                    <div className="p-3 rounded-[28px] bg-[#3b4c61]/88 backdrop-blur-xl border border-[#4a5c73] shadow-[0_16px_32px_rgba(24,35,49,0.18)]">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {modeOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleModeSelect(option.value)}
                                    disabled={isLoadingChat}
                                    className={`h-11 rounded-[18px] font-bold text-[11px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border ${mode === option.value
                                        ? 'bg-gradient-to-r from-[#00d9ff] to-[#0088ff] text-white border-transparent shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                                        : 'bg-[#2a3646] text-white/80 border-[#4a5c73] hover:text-white'
                                    } ${isLoadingChat ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <i className={`fa-solid ${option.icon} text-[12px]`}></i>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center">
                            <button onClick={resetMessages} className="w-11 h-11 rounded-[14px] bg-[#2a3646] border border-[#3b4c61] text-[#9ca7b8] hover:bg-[#344458] hover:text-white transition-all flex items-center justify-center shrink-0" aria-label="Limpar conversa">
                                <i className="fa-solid fa-trash-can text-[12px]"></i>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoadingChat}
                                className={`w-11 h-11 rounded-[14px] bg-[#2a3646] border border-[#3b4c61] transition-all flex items-center justify-center shrink-0 ${selectedFiles.length > 0
                                    ? 'text-[#00d9ff] border-[#00d9ff]/50 bg-[#00d9ff]/10'
                                    : 'text-[#9ca7b8] hover:bg-[#344458] hover:text-white'
                                } ${isLoadingChat ? 'opacity-70 cursor-not-allowed' : ''}`}
                                aria-label="Anexar arquivo"
                            >
                                <i className="fa-solid fa-paperclip text-[12px]"></i>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                            </button>

                            <div className="flex-1 relative">
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
                                    className="w-full h-11 rounded-[18px] px-4 text-[16px] bg-[#00000026] border border-[#4a5c73] text-[#F8FAFC] font-medium focus:border-[#00d9ff]/60 outline-none transition-all placeholder:text-[#8896a8] placeholder:font-normal disabled:opacity-70"
                                    placeholder={isOnline ? 'Digite sua mensagem...' : 'Sem internet: descreva o sintoma para consulta local...'}
                                />
                            </div>

                            <button onClick={() => void sendMessage()} disabled={isLoadingChat} className="w-11 h-11 rounded-[14px] bg-gradient-to-r from-[#ff6600] to-[#ff8833] text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,102,0,0.35)] active:scale-95 transition-all hover:brightness-105 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed" aria-label="Enviar mensagem">
                                <i className="fa-solid fa-paper-plane text-[13px] translate-x-[1px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
