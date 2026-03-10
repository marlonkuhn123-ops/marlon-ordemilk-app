import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponseStream, ChatMessage } from '../services/geminiService';
import { Card, SectionTitle } from './UI';

const ChatBubble: React.FC<{ msg: ChatMessage; onImageLoad?: () => void }> = React.memo(({ msg, onImageLoad }) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;

    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;

            const parts = line.split(/(\*\*.*?\*\*)|(⚠️.*?):|(🔧.*?):|(✅.*?):/g);
            return (
                <p key={i} className="min-h-[1em] mb-0.5">
                    {line.trim().startsWith('* ') && <span className="inline-block w-1.5 h-1.5 mr-2 rounded-full bg-electricBlue opacity-80"></span>}
                    {parts.map((part, j) => {
                        if (part === undefined) return null;
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className={isUser ? "text-white font-bold" : "text-electricBlue font-bold"}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('⚠️')) {
                            return <span key={j} className="text-red-400 font-bold">{part}</span>;
                        }
                        if (part.startsWith('🔧')) {
                            return <span key={j} className="text-slate-400 font-bold">{part}</span>;
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
            <span className={`text-[8px] font-black uppercase mb-1 px-1 tracking-widest ${isUser ? 'text-gray-500' : 'text-electricBlue'}`}>
                {isUser ? 'TÉCNICO' : 'SUPORTE ORDEMILK'}
            </span>
            <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-lg ${isUser ? 'bg-brand text-white rounded-tr-sm' : 'bg-techPanel text-gray-100 border border-techBorder rounded-tl-sm shadow-black/60'} ${isError ? 'bg-red-900/80 border-red-500 text-red-100' : ''}`}>
                {msg.files && msg.files.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {msg.files.map((file, index) => (
                            file.type === 'image' ? (
                                <img key={index} src={file.data} alt="Upload" className="rounded-lg border border-white/20 w-48 object-cover max-h-48" onLoad={onImageLoad} />
                            ) : (
                                <div key={index} className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/10 w-48">
                                    <i className="fa-solid fa-file-audio text-brand"></i>
                                    <span className="text-[10px] truncate text-white/80">Áudio Anexado</span>
                                </div>
                            )
                        ))}
                    </div>
                )}
                {formatText(msg.text)}

                {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-1.5 ml-1 bg-electricBlue rounded-full animate-pulse"></span>
                )}

                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-techBorder">
                        <p className="text-[9px] font-black uppercase text-gray-500 mb-2 tracking-widest">Fontes Externas (Busca IA):</p>
                        <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src, idx) => (
                                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-techDark hover:bg-electricBlue/20 hover:text-electricBlue px-2 py-1 rounded transition-colors border border-techBorder truncate max-w-[150px]">
                                    <i className="fa-solid fa-link mr-1 text-[8px]"></i> {src.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export const Tool_Assistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'model',
            text: 'Olá! Sou o Assistente Técnico Ordemilk. Como posso ajudar você hoje?\nDescreva o problema ou envie fotos/áudios para análise.'
        }
    ]);
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const [input, setInput] = useState('');
    const [chatContext, setChatContext] = useState<'AUTO' | 'REFRIGERACAO' | 'ELETRICA'>('AUTO');

    const [selectedFiles, setSelectedFiles] = useState<{ id: string, data: string, mime: string, type: 'image' | 'audio' }[]>([]);

    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isStarted, setIsStarted] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoadingChat, selectedFiles]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as string;
                const isImage = file.type.startsWith('image/');
                const isAudio = file.type.startsWith('audio/') || file.type.startsWith('video/');

                if (isImage || isAudio) {
                    setSelectedFiles(prev => [...prev, {
                        id: crypto.randomUUID(),
                        data,
                        mime: file.type,
                        type: isImage ? 'image' : 'audio'
                    }]);
                } else {
                    alert("Apenas imagens ou arquivos de áudio são suportados.");
                }
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const runAutomatedTest = async () => {
        const TEST_QUESTIONS = [
            "1. O painel do resfriador está completamente apagado e não liga, o que verificar primeiro?",
            "2. A placa eletrônica está piscando erro E04, o que significa?",
            "3. Qual a bitola de cabo ideal para motor de 3cv 220v monofásico?",
            "4. O agitador do resfriador parou de funcionar mas o compressor liga, qual o diagnóstico provável?",
            "5. Qual a pressão ideal de trabalho do R404a na baixa e na alta para um Maneurop MTZ64?"
        ];

        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: '🔧 **MODO DE TREINAMENTO INICIADO**\nInjetando 5 perguntas técnicas simuladas consecutivas no chat para avaliar a consistência da IA...', isStreaming: false }]);

        for (const question of TEST_QUESTIONS) {
            await sendMessage(question);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: '✅ **TREINAMENTO SIMULADO CONCLUIDO**\nTodas as perguntas foram injetadas com sucesso.', isStreaming: false }]);
    };

    const sendMessage = async (forcedText?: string) => {
        const textToSend = typeof forcedText === 'string' ? forcedText : input.trim();
        if (!textToSend && selectedFiles.length === 0) return;

        if (textToSend.toLowerCase().trim() === '/teste') {
            setInput('');
            runAutomatedTest();
            return;
        }

        if (textToSend.toLowerCase().startsWith('/chave ')) {
            const newKey = textToSend.substring(7).trim();
            if (newKey) {
                localStorage.setItem('om_gemini_api_key', newKey);
                setMessages(prev => [...prev,
                { id: crypto.randomUUID(), role: 'user', text: textToSend },
                { id: crypto.randomUUID(), role: 'model', text: '✅ **CHAVE CONFIGURADA COM SUCESSO!**\nEla foi salva de forma segura apenas na memória deste dispositivo (Offline).\n\nComo posso te ajudar agora?' }
                ]);
                setInput('');
                return;
            }
        }

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: textToSend,
            files: [...selectedFiles]
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFiles([]);
        setIsLoadingChat(true);

        const modelMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', isStreaming: true }]);

        try {
            const historyForApi = [...messagesRef.current, userMsg].map(m => {
                const parts: any[] = [];
                if (m.text && !m.text.startsWith('[')) {
                    parts.push({ text: m.text });
                } else if (!m.files || m.files.length === 0) {
                    parts.push({ text: m.text });
                }
                m.files?.forEach(file => {
                    parts.push({
                        inlineData: { data: file.data.split(',')[1], mimeType: file.mime }
                    });
                });
                if (parts.length === 0) parts.push({ text: m.text || "Análise de arquivo." });
                return { role: m.role, parts };
            });

            await generateChatResponseStream(
                historyForApi,
                chatContext,
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
                    setIsLoadingChat(false);
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
            setIsLoadingChat(false);
        }
    };

    const resetMessages = () => {
        if (window.confirm("Deseja apagar todo o histórico de diagnóstico?")) {
            setMessages([
                { id: '1', role: 'model', text: 'Olá! Sou o Assistente Técnico Ordemilk. Memória apagada. Como posso ajudar?' }
            ]);
            setSelectedFiles([]);
        }
    };

    if (!isStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fadeIn pb-24 px-4 sm:px-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-techPanel rounded-full shadow-lg shadow-black/40 border border-techBorder border-t-electricBlue animate-pulse flex items-center justify-center mb-6">
                    <i className="fa-solid fa-headset text-2xl sm:text-3xl text-electricBlue"></i>
                </div>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter mb-2 text-center text-white">IA DE DIAGNÓSTICO</h2>
                <p className="text-center text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
                    Sistema especialista conectado ao manual da Ordemilk. Analisa erros, placas e dimensionamentos.
                </p>
                <div className="mt-8 sm:mt-10 max-w-xs w-full">
                    <button
                        onClick={() => setIsStarted(true)}
                        className="w-full bg-techPanel border border-techBorder hover:border-electricBlue text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 group"
                    >
                        <span className="flex items-center justify-center gap-3 w-full">
                            INICIALIZAR MOTOR IA
                            <i className="fa-solid fa-power-off text-electricBlue group-hover:scale-110 transition-transform"></i>
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn pb-24">
            <SectionTitle icon="fa-solid fa-headset" title="1. SUPORTE DIRETO" />

            <Card className="min-h-[65vh] flex flex-col border-t-4 border-t-electricBlue !bg-techPanel">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 max-h-[500px] flex flex-col">
                    {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} onImageLoad={scrollToBottom} />)}
                    {isLoadingChat && <div className="p-4 bg-techDark rounded-xl w-16 h-8 animate-pulse self-start">...</div>}
                    <div ref={bottomRef} />
                </div>

                {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 mb-2 p-1 bg-techDark rounded border border-electricBlue">
                        {selectedFiles.map((file) => (
                            <div key={file.id} className="relative group">
                                {file.type === 'image' ? (
                                    <img src={file.data} alt="Preview" className="w-full h-16 object-cover rounded" />
                                ) : (
                                    <div className="w-full h-16 bg-black rounded flex items-center justify-center">
                                        <i className="fa-solid fa-file-audio text-2xl text-electricBlue"></i>
                                    </div>
                                )}
                                <button onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))} className="absolute top-0 right-0 bg-red-600/80 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-1.5 sm:gap-2 mt-auto pt-3 sm:pt-4 border-t border-techBorder">
                    <button onClick={resetMessages} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-techDark border border-techBorder hover:text-red-500 shrink-0 flex items-center justify-center">
                        <i className="fa-solid fa-trash text-xs sm:text-base"></i>
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-techDark border border-techBorder transition-colors shrink-0 flex items-center justify-center ${selectedFiles.length > 0 ? 'text-electricBlue border-electricBlue' : 'text-gray-500 hover:text-electricBlue'}`}>
                        <i className="fa-solid fa-paperclip text-xs sm:text-base"></i>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} multiple />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 min-w-0 rounded-xl px-3 sm:px-4 text-xs sm:text-sm bg-techDark/50 border border-techBorder text-white focus:border-electricBlue outline-none"
                        placeholder="Digite sua mensagem..."
                    />

                    <button onClick={() => sendMessage()} disabled={isLoadingChat} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand hover:bg-orange-600 text-white flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-paper-plane text-xs sm:text-base"></i>
                    </button>
                </div>

                {/* Botões de Seleção de Contexto (Abaixo do Input para melhor UX) */}
                <div className="flex gap-2 mt-2 px-1 pb-1">
                    <button
                        onClick={() => setChatContext('AUTO')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${chatContext === 'AUTO' ? 'bg-electricBlue text-white border-electricBlue' : 'bg-techDark text-gray-400 border-techBorder hover:border-gray-500'}`}
                    >
                        <i className="fa-solid fa-robot mr-1"></i> Auto (IA)
                    </button>
                    <button
                        onClick={() => setChatContext('REFRIGERACAO')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${chatContext === 'REFRIGERACAO' ? 'bg-blue-600 text-white border-blue-400' : 'bg-techDark text-gray-400 border-techBorder hover:border-gray-500'}`}
                    >
                        <i className="fa-solid fa-snowflake mr-1"></i> Foco Refrigeração
                    </button>
                    <button
                        onClick={() => setChatContext('ELETRICA')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${chatContext === 'ELETRICA' ? 'bg-yellow-600 text-white border-yellow-400' : 'bg-techDark text-gray-400 border-techBorder hover:border-gray-500'}`}
                    >
                        <i className="fa-solid fa-bolt mr-1"></i> Foco Elétrica
                    </button>
                </div>
            </Card>
        </div>
    );
};
