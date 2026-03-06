
import React, { useState, useRef, useEffect } from 'react';
import { Card, SectionTitle } from './UI';
import { generateChatResponseStream } from '../services/geminiService';
import { ChatMessage } from '../types';

// --- SUB-COMPONENTE: BALÃO DE CHAT ---
const ChatBubble: React.FC<{ msg: ChatMessage; onImageLoad?: () => void }> = ({ msg, onImageLoad }) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;
    
    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;
            
            const parts = line.split(/(\*\*.*?\*\*)|(⚠️.*?):|(🔧.*?):|(✅.*?):/g);
            return (
                <p key={i} className="min-h-[1em] mb-0.5">
                     {line.trim().startsWith('* ') && <span className="inline-block w-1.5 h-1.5 mr-2 rounded-full bg-[#1abc9c] opacity-80"></span>}
                     {parts.map((part, j) => {
                        if (part === undefined) return null;
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className={isUser ? "text-white font-bold" : "text-[#FF8F00] font-bold"}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('⚠️')) {
                            return <span key={j} className="text-red-400 font-bold">{part}</span>;
                        }
                        if (part.startsWith('🔧')) {
                            return <span key={j} className="text-[#fdba74] font-bold">{part}</span>;
                        }
                        if (part.startsWith('✅')) {
                            return <span key={j} className="text-[#3b82f6] font-bold">{part}</span>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className={`flex flex-col max-w-[95%] mb-4 animate-slide-up ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
            {!isUser && (
                <span className="text-[9px] font-bold uppercase mb-1 px-1 tracking-widest font-heading text-[#FF8F00]">
                    SUPORTE ORDEMILK
                </span>
            )}
            <div className="flex items-end gap-2">
                {!isUser && (
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-[#111827] text-[#E8EAF6]/60 shrink-0 mb-1 shadow-lg">
                        <i className="fa-solid fa-headset text-xs"></i>
                    </div>
                )}
                <div className={`p-4 rounded-[20px] text-sm leading-relaxed shadow-lg font-sans backdrop-blur-xl border ${
                    isUser 
                    ? 'bg-[#111827]/90 text-[#E8EAF6] rounded-tr-sm border-white/5' 
                    : 'bg-[#E8EAF6]/10 text-[#E8EAF6] rounded-tl-sm shadow-black/20 border-white/10'
                } ${isError ? 'bg-red-500/20 border-red-500 text-red-100' : ''}`}>
                    {msg.files && msg.files.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {msg.files.map((file, index) => (
                                <div key={index}>
                                    {file.type === 'image' && (
                                        <img src={file.data} alt={`Evidência ${index + 1}`} className="w-full rounded-lg border border-white/10" onLoad={onImageLoad} />
                                    )}
                                    {file.type === 'audio' && (
                                        <div className="w-full">
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70"><i className="fa-solid fa-volume-high mr-1"></i> Áudio {index + 1}</p>
                                            <audio controls src={file.data} className="w-full h-8 rounded opacity-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-sm font-medium">
                        {formatText(msg.text)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- FERRAMENTA 1: ASSISTENTE (CHAT + ELÉTRICA) ---
export const Tool_Assistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            text: 'Olá sou seu assistente OM, no que posso ajudar hj?'
        }
    ]);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'AUTO' | 'REF' | 'ELEC'>('AUTO');
    
    useEffect(() => {
        if (mode === 'AUTO') return;
        const modeNames = { 'REF': 'Refrigeração', 'ELEC': 'Elétrica' };
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            text: `🔧 Modo de análise alterado para: ${modeNames[mode]}. Foco total em ${mode === 'REF' ? 'ciclo frigorífico e mecânica' : 'comandos elétricos e esquemas'}.`
        }]);
    }, [mode]);
    
    // Estado unificado para múltiplos arquivos (Imagem ou Audio) com ID para chaves únicas
    const [selectedFiles, setSelectedFiles] = useState<{id: string, data: string, mime: string, type: 'image' | 'audio'}[]>([]);
    
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isStarted, setIsStarted] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100); // Pequeno delay para garantir que o DOM foi atualizado
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result as string;
                const type = file.type.startsWith('image') ? 'image' : 'audio';
                setSelectedFiles(prev => [...prev, {
                    id: crypto.randomUUID(),
                    data: base64Data,
                    mime: file.type,
                    type: type
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartChat = async () => {
        if (!input && selectedFiles.length === 0) return;
        setIsStarted(true);
        await sendMessage();
    };

    const sendMessage = async () => {
        let textToSend = input;
        if (!textToSend && selectedFiles.length > 0) {
            textToSend = `[${selectedFiles.length} ARQUIVO(S) ENVIADO(S) PARA ANÁLISE]`;
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
            // BUGFIX: Construir o histórico COMPLETO e LIMPO para a API.
            // Evita enviar partes de texto vazias quando há apenas arquivos, o que causa erro na API.
            const historyForApi = [...messages, userMsg].map(m => {
                const parts: any[] = [];
                
                // Só adiciona texto se ele não for apenas o marcador de arquivos ou se houver texto real
                if (m.text && !m.text.startsWith('[')) {
                    parts.push({ text: m.text });
                } else if (m.text && m.text.startsWith('[') && (!m.files || m.files.length === 0)) {
                    // Se por algum motivo for o marcador mas não tiver arquivos, envia o texto
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

                // Garantia: Gemini exige ao menos uma parte por mensagem
                if (parts.length === 0) parts.push({ text: m.text || "Análise de arquivo." });
                
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
            console.error("CAUGHT IN COMPONENT:", error);
            const errorMessage = error.message || "FALHA DE CONEXÃO. Tente novamente.";
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: `${errorMessage}`, isError: true, isStreaming: false } : msg
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
                text: 'Olá sou seu assistente OM, no que posso ajudar hj?'
            }
        ]);
        setInput('');
        setMode('AUTO');
        setSelectedFiles([]);
        setIsStarted(true);
    };

    return (
        <div className="animate-fadeIn h-full flex flex-col">
            <SectionTitle icon="fa-solid fa-headset" title="1. SUPORTE DIRETO" />
            
            <div className="flex-1 flex flex-col min-h-0 relative">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-6 pr-1 flex flex-col pb-4 no-scrollbar">
                    {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} onImageLoad={scrollToBottom} />)}
                    {isLoadingChat && <div className="p-4 bg-[#111827] rounded-xl w-16 h-8 animate-pulse self-start ml-4">...</div>}
                    <div ref={bottomRef} />
                </div>
                
                {/* ÁREA DE COMANDO ESTILIZADA - FIXA NO RODAPÉ DO CARD */}
                <div className="mt-auto pt-2">
                    <div className="p-2 rounded-[30px] bg-[#111827]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                        
                        {/* BARRA DE MODOS DE DIAGNÓSTICO */}
                        <div className="flex items-center justify-between bg-[#050912]/60 rounded-full p-1 mb-2 border border-white/5 relative overflow-hidden">
                        
                        {/* AUTO (IA) - Botão Sólido Ciano */}
                        <button 
                            onClick={() => setMode('AUTO')}
                            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-full transition-all text-[8px] font-bold uppercase tracking-wider font-heading z-10 ${
                                mode === 'AUTO' 
                                ? 'bg-[#00E5FF] text-[#050912] shadow-[0_0_15px_rgba(0,229,255,0.5)]' 
                                : 'text-[#E8EAF6]/70 hover:text-[#E8EAF6]'
                            }`}
                        >
                            <i className="fa-solid fa-robot"></i>
                            <span>AUTO (IA)</span>
                        </button>
                        
                        <div className="w-[1px] h-3 bg-white/10"></div>

                        {/* REFRIGERAÇÃO - Texto com Ícone */}
                        <button 
                            onClick={() => setMode('REF')}
                            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-full transition-all text-[8px] font-bold uppercase tracking-wider font-heading z-10 ${
                                mode === 'REF' 
                                ? 'text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]' 
                                : 'text-[#E8EAF6]/70 hover:text-[#E8EAF6]'
                            }`}
                        >
                            <i className="fa-solid fa-snowflake"></i>
                            <span>REFRIGERAÇÃO</span>
                        </button>

                        <div className="w-[1px] h-3 bg-white/10"></div>

                        {/* ELÉTRICA - Texto com Ícone */}
                        <button 
                            onClick={() => setMode('ELEC')}
                            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-full transition-all text-[8px] font-bold uppercase tracking-wider font-heading z-10 ${
                                mode === 'ELEC' 
                                ? 'text-[#FF8F00] drop-shadow-[0_0_5px_rgba(255,143,0,0.8)]' 
                                : 'text-[#E8EAF6]/70 hover:text-[#E8EAF6]'
                            }`}
                        >
                            <i className="fa-solid fa-bolt"></i>
                            <span>ELÉTRICA</span>
                        </button>
                    </div>

                    <div className="flex gap-2 items-center px-1 pb-1">
                        <button onClick={resetMessages} className="w-7 h-7 rounded-full bg-[#122837] border border-white/5 text-[#E8EAF6]/40 hover:text-white transition-all flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30">
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                        
                        <button onClick={() => fileInputRef.current?.click()} className={`w-7 h-7 rounded-full bg-[#122837] border border-white/5 transition-all flex items-center justify-center ${selectedFiles.length > 0 ? 'text-[#00E5FF] border-[#00E5FF]/50 bg-[#00E5FF]/10' : 'text-[#E8EAF6]/40 hover:text-white'}`}>
                            <i className="fa-solid fa-paperclip text-[10px]"></i>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="w-full h-7 rounded-full px-3 text-[11px] bg-[#050912]/50 border border-white/5 text-[#E8EAF6] focus:border-[#00E5FF]/30 outline-none transition-all placeholder:text-[#E8EAF6]/50"
                                placeholder="Digite sua mensagem..."
                            />
                        </div>
                        
                        <button onClick={() => sendMessage()} disabled={isLoadingChat} className="w-7 h-7 rounded-full bg-[#FF8F00] text-white flex items-center justify-center shadow-[0_4px_15px_rgba(255,143,0,0.4)] active:scale-95 transition-all hover:brightness-110">
                            <i className="fa-solid fa-paper-plane text-[10px]"></i>
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};
