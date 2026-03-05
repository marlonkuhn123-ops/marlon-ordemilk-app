
import React, { useState } from 'react';
import { Card, Button, Input } from './UI';

interface LoginScreenProps {
    onLogin: (success: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleLogin = () => {
        const inputPass = password.trim();
        const inputName = name.trim();
        
        if (!inputName) {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        if (inputPass === 'om2026') {
            // Salva o nome no localStorage para o contexto global usar
            localStorage.setItem('ordemilk_tech_data', JSON.stringify({ name: inputName, company: 'Ordemilk' }));
            onLogin(true);
            return;
        }
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1a1a1a] relative overflow-hidden">
            
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                style={{ 
                    backgroundImage: `linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)`, 
                    backgroundSize: '25px 25px' 
                }}
            ></div>

            <div className="w-full max-w-sm z-10 animate-slide-up">
                
                <div className="flex flex-col items-center mb-10 select-none">
                    <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-[#242424] border border-[#3d3d3d] flex items-center justify-center shadow-[0_0_30px_rgba(189,195,199,0.15)] transform rotate-3">
                            <i className="fa-solid fa-shield-halved text-4xl text-[#bdc3c7]"></i>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-4 transform -rotate-1">
                            <svg viewBox="0 0 400 80" className="h-10 sm:h-14 w-auto" xmlns="http://www.w3.org/2000/svg">
                                {/* Top Black Line */}
                                <polygon points="25,10 390,10 385,20 20,20" fill="#1a1a1a" />
                                
                                {/* ORDEMILK Text */}
                                <g transform="skewX(-15)">
                                    <text x="45" y="65" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="55" fill="#1a1a1a" letterSpacing="-2">ORDE</text>
                                    <text x="210" y="65" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="55" fill="#b91c1c" letterSpacing="-2">MILK</text>
                                </g>
                                
                                {/* Bottom Red Line */}
                                <polygon points="10,75 185,75 195,35 180,35 172,65 5,65" fill="#b91c1c" />
                            </svg>
                        </div>
                        <h1 className="flex items-baseline gap-2 mb-1">
                            <span className="font-inter font-black italic text-2xl tracking-tighter leading-none text-[#ce1126]">TECH V51</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Terminal Técnico Privado</p>
                    </div>
                </div>

                <Card className={`border-t-4 border-t-[#bdc3c7] !bg-[#242424] ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                    <div className="mb-6 text-center">
                        <h2 className="text-white/90 font-bold text-sm uppercase tracking-wide mb-1">Autenticação</h2>
                        <p className="text-[10px] text-gray-500">
                            Identifique-se para acessar o sistema.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input 
                                type="text" 
                                placeholder="NOME DO TÉCNICO" 
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value.toUpperCase());
                                    setError(false);
                                }}
                                className={`!bg-[#1a1a1a] text-center tracking-widest font-bold text-xs !py-3 transition-all duration-300 ${error && !name ? '!border-red-600' : 'focus:!border-[#1abc9c]'}`}
                            />
                            
                            <Input 
                                type="password" 
                                placeholder="SENHA DE ACESSO" 
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                className={`!bg-[#1a1a1a] text-center tracking-widest font-mono text-lg !py-4 transition-all duration-300 ${error && password ? '!border-red-600 !text-red-500 placeholder-red-900/50' : 'focus:!border-[#1abc9c]'}`}
                            />
                        </div>

                        {error && (
                            <p className="text-center text-[10px] font-bold text-red-500 uppercase tracking-wider animate-fadeIn">
                                <i className="fa-solid fa-xmark mr-1"></i> {!name ? 'Informe seu nome' : 'Senha Negada'}
                            </p>
                        )}

                        <Button onClick={handleLogin} className="mt-2 group">
                            <span className="group-hover:mr-2 transition-all">LIBERAR SISTEMA</span>
                            <i className="fa-solid fa-unlock opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0"></i>
                        </Button>
                    </div>
                </Card>

                <div className="mt-8 text-center opacity-20">
                    <p className="text-[9px] font-mono text-gray-600 tracking-widest uppercase">Ordemilk Engineering © 2026</p>
                </div>
            </div>
            
             <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
};
