
import React, { useState, useRef, useEffect } from 'react';
import { Card, SectionTitle, Button, FileUpload, Select, Input, AIOutputBox } from './UI';
import { generateChatResponseStream, analyzePlateImage, generateTechResponse } from '../services/geminiService';
import { ChatMessage, ElectricReading } from '../types';
import { useGlobal } from '../contexts/GlobalContext';

// --- SUB-COMPONENTE: BALÃO DE CHAT ---
const ChatBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
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
                {msg.image && (
                    <img src={msg.image} alt="Evidência" className="w-full rounded-lg mb-3 border border-white/10" />
                )}
                {msg.audio && (
                    <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase mb-1 opacity-70"><i className="fa-solid fa-volume-high mr-1"></i> Áudio Anexado</p>
                        <audio controls src={msg.audio} className="w-full h-8 rounded opacity-90" />
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
    const { techData } = useGlobal(); 
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    
    // Estado unificado para arquivo (Imagem ou Audio)
    const [selectedFile, setSelectedFile] = useState<{data: string, mime: string, type: 'image' | 'audio'} | null>(null);
    
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [reading, setReading] = useState<ElectricReading>({ phase: 'tri' });
    const [voltR, setVoltR] = useState('');
    const [voltS, setVoltS] = useState('');
    const [voltT, setVoltT] = useState('');
    const [ampNow, setAmpNow] = useState('');
    const [ampNominal, setAmpNominal] = useState('');
    const [electricResult, setElectricResult] = useState('');
    const [isLoadingElectric, setIsLoadingElectric] = useState(false);
    const [isReadingPlate, setIsReadingPlate] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result as string;
                const type = file.type.startsWith('image') ? 'image' : 'audio';
                setSelectedFile({
                    data: base64Data,
                    mime: file.type,
                    type: type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartChat = async () => {
        if (!input && !selectedFile) return;
        setIsStarted(true);
        await sendMessage();
    };

    const sendMessage = async () => { 
        let textToSend = input;
        if (!textToSend && selectedFile) {
            textToSend = selectedFile.type === 'image' 
                ? "[FOTO ENVIADA P/ ANÁLISE VISUAL]" 
                : "[ÁUDIO ENVIADO P/ ANÁLISE SONORA]";
        }
        
        if (!textToSend && !selectedFile && !isLoadingChat) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: textToSend,
            image: selectedFile?.type === 'image' ? selectedFile.data : undefined,
            audio: selectedFile?.type === 'audio' ? selectedFile.data : undefined,
            fileMimeType: selectedFile?.mime
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFile(null); // Limpa anexo
        setIsLoadingChat(true);

        const modelMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', isStreaming: true }]);

        try {
            const apiHistory = messages.map(m => {
                const parts: any[] = [{ text: m.text }];
                if (m.image) {
                    parts.push({ inlineData: { mimeType: m.fileMimeType || 'image/jpeg', data: m.image.split(',')[1] } });
                }
                if (m.audio) {
                    parts.push({ inlineData: { mimeType: m.fileMimeType || 'audio/mp3', data: m.audio.split(',')[1] } });
                }
                return { role: m.role, parts };
            });

            const filePayload = userMsg.image || userMsg.audio 
                ? { 
                    data: (userMsg.image || userMsg.audio)!.split(',')[1], 
                    mimeType: userMsg.fileMimeType! 
                  } 
                : undefined;
            
            await generateChatResponseStream(
                apiHistory, 
                userMsg.text, 
                filePayload,
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
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: "⚠️ FALHA DE CONEXÃO. Tente novamente.", isError: true, isStreaming: false } : msg
                )
            );
        } finally {
            setIsLoadingChat(false);
        }
    };

    const resetMessages = () => {
        setIsLoadingChat(false);
        setMessages([]);
        setInput(''); 
        setSelectedFile(null);
        setIsStarted(false);
    };

    const shareChatWhatsapp = () => {
        if (messages.length === 0) return;
        const historyText = messages.map(m => {
            const sender = m.role === 'user' ? 'TÉCNICO' : 'SUPORTE ORDEMILK';
            return `*[${sender}]*: ${m.text.replace(/\*\*/g, '')}`;
        }).join('\n\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(`*DIAGNÓSTICO ORDEMILK*\n\n${historyText}`)}`, '_blank');
    };

    const handlePlateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsReadingPlate(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const jsonStr = await analyzePlateImage(base64);
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.volts) setVoltR(data.volts.toString());
                    if (data.amps) setAmpNominal(data.amps.toString());
                    if (data.phase) setReading(prev => ({ ...prev, phase: data.phase }));
                } catch (e) { alert("Leitura manual necessária."); }
            };
            reader.readAsDataURL(file);
        } finally { setIsReadingPlate(false); }
    };

    const analyzeElectric = async () => {
        setIsLoadingElectric(true);
        const prompt = `Fase: ${reading.phase}. R=${voltR}, S=${voltS}, T=${voltT}. Corrente: ${ampNow}A (Nom: ${ampNominal}A).`;
        try {
            const text = await generateTechResponse(prompt, "ELECTRIC");
            setElectricResult(text);
        } finally { setIsLoadingElectric(false); }
    };

    return (
        <div className="animate-fadeIn pb-24">
            <SectionTitle icon="fa-solid fa-headset" title="1. SUPORTE DIRETO" />
            
            <Card className="min-h-[65vh] flex flex-col border-t-4 border-t-[#1abc9c] !bg-[#121212]">
                {!isStarted ? (
                    <div className="flex flex-col gap-4 py-4 animate-fadeIn">
                        <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                            <p className="text-xs text-gray-300 leading-relaxed font-bold">
                                "Sistema de suporte técnico pronto. Descreva o problema, envie FOTOS ou ÁUDIOS do equipamento (ruídos, relatos). EM CASO DE DÚVIDA, PROCURE SEMPRE A AJUDA DE UM PROFISSIONAL QUALIFICADO."
                            </p>
                        </div>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={4} 
                            className="w-full p-4 rounded-xl outline-none border bg-[#0a0a0a] border-[#333] text-white focus:border-[#1abc9c] text-sm"
                            placeholder="Descreva o problema ou envie áudio..."
                        />
                        
                        {/* COMPONENTE DE UPLOAD ATUALIZADO */}
                        <label className="group relative flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border cursor-pointer transition-all duration-300 mb-4 overflow-hidden active:scale-[0.98] bg-[#2a2a2a] border-[#4d4d4d] hover:border-[#1abc9c]/50 hover:bg-[#333333]">
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-300 bg-[#4d4d4d] group-hover:bg-[#1abc9c]"></div>
                            <div className="flex items-center justify-center transition-colors duration-300 text-white/60 group-hover:text-[#1abc9c]">
                                <i className={`fa-solid ${selectedFile ? 'fa-check' : 'fa-paperclip'} text-sm`}></i>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 text-white group-hover:text-white">
                                {selectedFile 
                                    ? (selectedFile.type === 'audio' ? 'ÁUDIO SELECIONADO' : 'IMAGEM SELECIONADA') 
                                    : 'ANEXAR FOTO OU ÁUDIO'}
                            </span>
                            <input type="file" accept="image/*,audio/*" className="hidden" onChange={handleFileUpload} />
                        </label>

                        {/* PREVIEW DO ARQUIVO ANTES DO START */}
                        {selectedFile && (
                            <div className="relative mb-2 p-2 bg-[#1a1a1a] rounded border border-[#333]">
                                {selectedFile.type === 'image' ? (
                                    <img src={selectedFile.data} alt="Preview" className="h-32 object-cover rounded mx-auto" />
                                ) : (
                                    <audio controls src={selectedFile.data} className="w-full h-8" />
                                )}
                                <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        )}

                        <Button onClick={handleStartChat} disabled={!input && !selectedFile}>ACIONAR SUPORTE</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 max-h-[500px] flex flex-col">
                            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
                            {isLoadingChat && <div className="p-4 bg-[#1a1a1a] rounded-xl w-16 h-8 animate-pulse">...</div>}
                            <div ref={bottomRef} />
                        </div>
                        
                        {/* MINI PREVIEW DENTRO DO CHAT */}
                        {selectedFile && (
                            <div className="relative w-fit max-w-[200px] mb-2 p-1 bg-[#1a1a1a] rounded border border-[#1abc9c]">
                                {selectedFile.type === 'image' ? (
                                    <img src={selectedFile.data} alt="Preview" className="w-20 h-20 object-cover rounded" />
                                ) : (
                                    <div className="flex items-center gap-2 px-2 py-1">
                                        <i className="fa-solid fa-file-audio text-[#1abc9c]"></i>
                                        <span className="text-[10px] uppercase font-bold text-white">Áudio Pronto</span>
                                    </div>
                                )}
                                <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        )}

                        <div className="flex gap-2 mt-auto pt-4 border-t border-[#333]">
                            <button onClick={resetMessages} className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                            
                            <button onClick={() => fileInputRef.current?.click()} className={`w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] transition-colors ${selectedFile ? 'text-[#1abc9c] border-[#1abc9c]' : 'text-gray-500 hover:text-[#1abc9c]'}`}>
                                <i className="fa-solid fa-paperclip"></i>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileUpload} />
                            </button>
                            
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1 rounded-xl px-4 text-sm bg-[#0a0a0a] border border-[#333] text-white focus:border-[#1abc9c] outline-none"
                                placeholder="Digite..."
                            />
                            <button onClick={() => sendMessage()} disabled={isLoadingChat} className="w-12 h-12 rounded-xl bg-[#1abc9c] text-white flex items-center justify-center"><i className="fa-solid fa-paper-plane"></i></button>
                            <button onClick={shareChatWhatsapp} className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center"><i className="fa-brands fa-whatsapp"></i></button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};
