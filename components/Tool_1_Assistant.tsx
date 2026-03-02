
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
                            return <strong key={j} className={isUser ? "text-white font-bold" : "text-[#1abc9c] font-bold"}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('⚠️')) {
                            return <span key={j} className="text-red-400 font-bold">{part}</span>;
                        }
                        if (part.startsWith('🔧')) {
                            return <span key={j} className="text-[#bdc3c7] font-bold">{part}</span>;
                        }
                        if (part.startsWith('✅')) {
                            return <span key={j} className="text-emerald-400 font-bold">{part}</span>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className={`flex flex-col max-w-[95%] mb-3 animate-slide-up ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
            <span className={`text-[8px] font-black uppercase mb-1 px-1 tracking-widest ${isUser ? 'text-gray-500' : 'text-[#1abc9c]'}`}>
                {isUser ? 'TÉCNICO' : 'SUPORTE ORDEMILK'}
            </span>
            <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-lg ${isUser ? 'bg-[#16a085] text-white rounded-tr-sm' : 'bg-[#1a1a1a] text-gray-100 border border-[#333] rounded-tl-sm shadow-black/60'} ${isError ? 'bg-red-900/80 border-red-500 text-red-100' : ''}`}>
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
                
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#333]">
                        <p className="text-[9px] font-black uppercase text-gray-500 mb-2 tracking-widest">Fontes Externas (Busca IA):</p>
                        <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src, idx) => (
                                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-[#333] hover:bg-[#1abc9c]/20 hover:text-[#1abc9c] px-2 py-1 rounded transition-colors border border-[#444] truncate max-w-[150px]">
                                    <i className="fa-solid fa-link mr-1 text-[8px]"></i> {src.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
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
            text: 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje? Descreva o problema ou envie fotos/áudios para análise.'
        }
    ]);
    const [input, setInput] = useState('');
    
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
                }
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
                text: 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje? Descreva o problema ou envie fotos/áudios para análise.'
            }
        ]);
        setInput('');
        setSelectedFiles([]);
        setIsStarted(true);
    };

    const shareChatWhatsapp = () => {
        if (messages.length === 0) return;
        const historyText = messages.map(m => {
            const sender = m.role === 'user' ? 'TÉCNICO' : 'SUPORTE ORDEMILK';
            return `*[${sender}]*: ${m.text.replace(/\*\*/g, '')}`;
        }).join('\n\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(`*DIAGNÓSTICO ORDEMILK*\n\n${historyText}`)}`, '_blank');
    };

    return (
        <div className="animate-fadeIn pb-24">
            <SectionTitle icon="fa-solid fa-headset" title="1. SUPORTE DIRETO" />
            
            <Card className="min-h-[65vh] flex flex-col border-t-4 border-t-[#1abc9c] !bg-[#121212]">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 max-h-[500px] flex flex-col">
                    {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} onImageLoad={scrollToBottom} />)}
                    {isLoadingChat && <div className="p-4 bg-[#1a1a1a] rounded-xl w-16 h-8 animate-pulse self-start">...</div>}
                    <div ref={bottomRef} />
                </div>
                
                {/* PREVIEW DE MÚLTIPLOS ARQUIVOS NO CHAT */}
                {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 mb-2 p-1 bg-[#1a1a1a] rounded border border-[#1abc9c]">
                        {selectedFiles.map((file) => (
                            <div key={file.id} className="relative group">
                                {file.type === 'image' ? (
                                    <img src={file.data} alt="Preview" className="w-full h-16 object-cover rounded" />
                                ) : (
                                    <div className="w-full h-16 bg-black rounded flex items-center justify-center">
                                        <i className="fa-solid fa-file-audio text-2xl text-[#1abc9c]"></i>
                                    </div>
                                )}
                                <button onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))} className="absolute top-0 right-0 bg-red-600/80 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-1.5 sm:gap-2 mt-auto pt-3 sm:pt-4 border-t border-[#333]">
                    <button onClick={resetMessages} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1a1a1a] border border-[#333] hover:text-red-500 shrink-0 flex items-center justify-center">
                        <i className="fa-solid fa-trash text-xs sm:text-base"></i>
                    </button>
                    
                    <button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1a1a1a] border border-[#333] transition-colors shrink-0 flex items-center justify-center ${selectedFiles.length > 0 ? 'text-[#1abc9c] border-[#1abc9c]' : 'text-gray-500 hover:text-[#1abc9c]'}`}>
                        <i className="fa-solid fa-paperclip text-xs sm:text-base"></i>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                    </button>
                    
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 min-w-0 rounded-xl px-3 sm:px-4 text-xs sm:text-sm bg-[#0a0a0a] border border-[#333] text-white focus:border-[#1abc9c] outline-none"
                        placeholder="Digite sua mensagem..."
                    />
                    
                    <button onClick={() => sendMessage()} disabled={isLoadingChat} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1abc9c] text-white flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-paper-plane text-xs sm:text-base"></i>
                    </button>
                    
                    <button onClick={shareChatWhatsapp} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                        <i className="fa-brands fa-whatsapp text-xs sm:text-base"></i>
                    </button>
                </div>
            </Card>
        </div>
    );
};
