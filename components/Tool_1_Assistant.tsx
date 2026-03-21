import React, { useEffect, useRef, useState } from 'react';
import { generateChatResponseStream } from '../services/geminiService';
import { ChatMessage } from '../types';

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
                    className={`max-w-[min(560px,78vw)] p-4 sm:p-5 text-sm leading-relaxed shadow-lg font-sans border ${
                        isUser
                            ? 'bg-[#2a3646] text-white rounded-[22px] border-[#4a5c73]'
                            : 'bg-[#3b4c61]/92 text-white rounded-b-[24px] rounded-tl-[4px] rounded-tr-[24px] border-[#4a5c73] shadow-[0_10px_24px_rgba(24,35,49,0.18)]'
                    } ${isError ? '!bg-red-500/20 !border-red-500 !text-red-100' : ''}`}
                >
                    {msg.files && msg.files.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {msg.files.map((file, index) => (
                                <div key={index}>
                                    {file.type === 'image' && (
                                        <img src={file.data} alt={`Evidencia ${index + 1}`} className="w-full rounded-lg border border-white/10" onLoad={onImageLoad} />
                                    )}
                                    {file.type === 'audio' && (
                                        <div className="w-full">
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70">
                                                <i className="fa-solid fa-volume-high mr-1"></i>
                                                Audio {index + 1}
                                            </p>
                                            <audio controls src={file.data} className="w-full h-8 rounded opacity-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-[15px] leading-relaxed font-medium">
                        {formatText(msg.text, isUser)}
                    </div>
                </div>
            </div>
        </div>
    );
});

export const Tool_Assistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            text: 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje?\nDescreva o problema ou envie fotos/áudios para análise.'
        }
    ]);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'AUTO' | 'REF' | 'ELEC'>('AUTO');
    const [selectedFiles, setSelectedFiles] = useState<{ id: string; data: string; mime: string; type: 'image' | 'audio' }[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === 'AUTO') return;
        const modeNames = { REF: 'Refrigeração', ELEC: 'Elétrica' };
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'model', text: `Modo de Diagnóstico Focado em **${modeNames[mode]}** ativado. Descreva o problema detalhadamente.` }
        ]);
    }, [mode]);

    const scrollToBottom = React.useCallback(() => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            const type = file.type.startsWith('image') ? 'image' : 'audio';
            setSelectedFiles(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    data: base64Data,
                    mime: file.type,
                    type
                }
            ]);
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = async () => {
        let textToSend = input;
        if (!textToSend && selectedFiles.length > 0) {
            textToSend = `[${selectedFiles.length} ARQUIVO(S) ENVIADO(S) PARA ANALISE]`;
        }

        if (!textToSend.trim() && selectedFiles.length === 0) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: textToSend,
            files: selectedFiles
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFiles([]);
        setIsLoadingChat(true);

        const modelMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', isStreaming: true }]);

        try {
            const historyForApi = [...messages, userMsg].map(m => {
                const parts: any[] = [];

                if (m.text && !m.text.startsWith('[')) {
                    parts.push({ text: m.text });
                } else if (m.text && m.text.startsWith('[') && (!m.files || m.files.length === 0)) {
                    parts.push({ text: m.text });
                }

                m.files?.forEach(file => {
                    parts.push({
                        inlineData: {
                            mimeType: file.mime,
                            data: file.data.split(',')[1]
                        }
                    });
                });

                if (parts.length === 0) parts.push({ text: m.text || 'Analise de arquivo.' });
                return { role: m.role, parts };
            });

            await generateChatResponseStream(
                historyForApi,
                (chunkText: string) => {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === modelMessageId ? { ...msg, text: chunkText } : msg
                        )
                    );
                },
                (finalText, sources) => {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === modelMessageId ? { ...msg, text: finalText, sources, isStreaming: false } : msg
                        )
                    );
                },
                mode
            );
        } catch (error: any) {
            console.error('Chat Error:', error?.message || 'Unknown error');
            const errorMessage = error.message || 'FALHA DE CONEXAO. Tente novamente.';
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId ? { ...msg, text: errorMessage, isError: true, isStreaming: false } : msg
                )
            );
        } finally {
            setIsLoadingChat(false);
        }
    };

    const resetMessages = () => {
        setIsLoadingChat(false);
        setMessages([
            {
                id: 'welcome',
                role: 'model',
                text: 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje?\nDescreva o problema ou envie fotos/áudios para análise.'
            }
        ]);
        setInput('');
        setMode('AUTO');
        setSelectedFiles([]);
    };

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

            <div className="flex-1 flex flex-col min-h-0 relative">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-5 pr-1 flex flex-col pb-4 no-scrollbar">
                    {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} onImageLoad={scrollToBottom} />)}
                    {isLoadingChat && (
                        <div className="px-4 py-3 bg-[#3b4c61]/88 rounded-[20px] border border-[#4a5c73] w-20 h-12 animate-pulse self-start ml-12 shadow-lg">
                            ...
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="mt-auto pt-3 pb-1">
                    <div className="p-3 rounded-[28px] bg-[#3b4c61]/88 backdrop-blur-xl border border-[#4a5c73] shadow-[0_16px_32px_rgba(24,35,49,0.18)]">
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={() => setMode('AUTO')}
                                className={`flex-1 h-11 rounded-[18px] font-bold text-[11px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border ${
                                    mode === 'AUTO'
                                        ? 'bg-gradient-to-r from-[#00d9ff] to-[#0088ff] text-white border-transparent shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                                        : 'bg-[#2a3646] text-white/80 border-[#4a5c73] hover:text-white'
                                }`}
                            >
                                <i className="fa-solid fa-robot text-[12px]"></i>
                                <span>AUTO (IA)</span>
                            </button>

                            <button
                                onClick={() => setMode('REF')}
                                className={`flex-1 h-11 rounded-[18px] font-bold text-[11px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border ${
                                    mode === 'REF'
                                        ? 'bg-gradient-to-r from-[#00d9ff] to-[#0088ff] text-white border-transparent shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                                        : 'bg-[#2a3646] text-white/80 border-[#4a5c73] hover:text-white'
                                }`}
                            >
                                <i className="fa-solid fa-snowflake text-[12px]"></i>
                                <span>REFRIGERAÇÃO</span>
                            </button>

                            <button
                                onClick={() => setMode('ELEC')}
                                className={`flex-1 h-11 rounded-[18px] font-bold text-[11px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border ${
                                    mode === 'ELEC'
                                        ? 'bg-gradient-to-r from-[#00d9ff] to-[#0088ff] text-white border-transparent shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                                        : 'bg-[#2a3646] text-white/80 border-[#4a5c73] hover:text-white'
                                }`}
                            >
                                <i className="fa-solid fa-bolt text-[12px]"></i>
                                <span>ELÉTRICA</span>
                            </button>
                        </div>

                        <div className="flex gap-2 items-center">
                            <button
                                onClick={resetMessages}
                                className="w-11 h-11 rounded-[14px] bg-[#2a3646] border border-[#3b4c61] text-[#9ca7b8] hover:bg-[#344458] hover:text-white transition-all flex items-center justify-center shrink-0"
                                aria-label="Limpar conversa"
                            >
                                <i className="fa-solid fa-trash-can text-[12px]"></i>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-11 h-11 rounded-[14px] bg-[#2a3646] border border-[#3b4c61] transition-all flex items-center justify-center shrink-0 ${
                                    selectedFiles.length > 0
                                        ? 'text-[#00d9ff] border-[#00d9ff]/50 bg-[#00d9ff]/10'
                                        : 'text-[#9ca7b8] hover:bg-[#344458] hover:text-white'
                                }`}
                                aria-label="Anexar arquivo"
                            >
                                <i className="fa-solid fa-paperclip text-[12px]"></i>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    className="w-full h-11 rounded-[18px] px-4 text-[16px] bg-[#00000026] border border-[#4a5c73] text-white focus:border-[#00d9ff]/60 outline-none transition-all placeholder:text-[#8896a8]"
                                    placeholder="Digite sua mensagem..."
                                />
                            </div>

                            <button
                                onClick={() => sendMessage()}
                                disabled={isLoadingChat}
                                className="w-11 h-11 rounded-[14px] bg-gradient-to-r from-[#ff6600] to-[#ff8833] text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,102,0,0.35)] active:scale-95 transition-all hover:brightness-105 shrink-0"
                                aria-label="Enviar mensagem"
                            >
                                <i className="fa-solid fa-paper-plane text-[13px] translate-x-[1px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
