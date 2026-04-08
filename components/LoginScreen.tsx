import React, { useState } from 'react';
import { Card, Button, Input } from './UI';

interface LoginScreenProps {
    onLogin: (techData: { name: string; company: string }) => void;
    installPrompt?: any;
    isIOS?: boolean;
    isAndroid?: boolean;
    isInstalled?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, installPrompt, isIOS, isAndroid, isInstalled }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const [installSheet, setInstallSheet] = useState<'ios' | 'generic' | null>(null);
    const [installDismissed, setInstallDismissed] = useState(false);

    const showInstallBar = !isInstalled && !installDismissed;

    const handleInstallClick = async () => {
        if (isIOS) {
            setInstallSheet('ios');
            return;
        }

        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') setInstallDismissed(true);
            return;
        }

        setInstallSheet('generic');
    };

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
            onLogin({ name: inputName, company: 'Ordemilk' });
            return;
        }
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    return (
        <div className="h-dvh w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-transparent relative overflow-hidden">

            {showInstallBar && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 border-b border-white/5" style={{ background: 'rgba(10,14,20,0.92)' }}>
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#f97316]/70 hover:text-[#f97316] active:scale-95 transition-all"
                    >
                        <i className={`${isIOS ? 'fa-solid fa-arrow-up-from-bracket' : 'fa-solid fa-download'} text-xs`}></i>
                        DOWNLOAD APP
                    </button>
                    <button onClick={() => setInstallDismissed(true)} className="text-white/20 hover:text-white/50 transition-colors text-xs">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            {installSheet && (
                <div className="fixed inset-0 z-50 flex items-end" onClick={() => setInstallSheet(null)}>
                    <div
                        className="w-full max-w-md mx-auto bg-[#111827] border-t border-[#f97316]/20 rounded-t-2xl p-6 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">
                                {installSheet === 'ios' ? 'Instalar no iPhone' : 'Instalar app'}
                            </h3>
                            <button onClick={() => setInstallSheet(null)} className="text-white/30 text-[10px] font-bold uppercase tracking-widest">FECHAR</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#1d2d40] rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i className={`${installSheet === 'ios' ? 'fa-solid fa-arrow-up-from-bracket' : 'fa-solid fa-ellipsis-vertical'} text-[#f97316]`}></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Passo 1</p>
                                    <p className="text-xs text-white/70">
                                        {installSheet === 'ios'
                                            ? <>Toque em <span className="text-white font-bold">Compartilhar</span> na barra do Safari</>
                                            : <>Abra o <span className="text-white font-bold">menu do navegador</span>{isAndroid ? ' no Chrome/Android' : ''}</>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#1d2d40] rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i className={`${installSheet === 'ios' ? 'fa-solid fa-square-plus' : 'fa-solid fa-download'} text-[#f97316]`}></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Passo 2</p>
                                    <p className="text-xs text-white/70">
                                        {installSheet === 'ios'
                                            ? <>Toque em <span className="text-white font-bold">Adicionar à Tela de Início</span></>
                                            : <>Toque em <span className="text-white font-bold">Instalar app</span> ou <span className="text-white font-bold">Adicionar à tela inicial</span></>}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setInstallSheet(null); setInstallDismissed(true); }}
                            className="mt-6 w-full bg-[#f97316] text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                        >
                            ENTENDI
                        </button>
                    </div>
                </div>
            )}
            
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                style={{ 
                    backgroundImage: `linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)`, 
                    backgroundSize: '25px 25px' 
                }}
            ></div>

            <div className="w-full max-w-sm z-10 animate-slide-up">
                
                <div className="flex flex-col items-center mb-10 select-none">
                    <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#3d3d3d] flex items-center justify-center shadow-[0_0_30px_rgba(189,195,199,0.15)] transform rotate-3">
                            <i className="fa-solid fa-shield-halved text-3xl text-[#E8EAF6]/60"></i>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg mb-4 shadow-lg">
                        <span className="font-inter font-black italic text-2xl tracking-tighter text-black">ORDEMILK</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <h1 className="flex items-baseline gap-2 mb-1">
                            <span className="font-inter font-black italic text-2xl tracking-tighter leading-none text-[#ce1126]">TECH V51</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E8EAF6]/60">Terminal TÃ©cnico Privado</p>
                    </div>
                </div>

                <Card className={`border-t-4 border-t-[#00d9ff]/50 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                    <div className="mb-6 text-center">
                        <h2 className="text-[#E8EAF6] font-bold text-sm uppercase tracking-wide mb-1">AutenticaÃ§Ã£o</h2>
                        <p className="text-[10px] text-[#E8EAF6]/60">
                            Identifique-se para acessar o sistema.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input 
                                type="text" 
                                placeholder="NOME DO TÃ‰CNICO" 
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value.toUpperCase());
                                    setError(false);
                                }}
                                className={`text-center tracking-widest font-bold text-xs !py-3 transition-all duration-300 ${error && !name ? '!border-red-600' : ''}`}
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
                                className={`text-center tracking-widest font-mono text-lg !py-4 transition-all duration-300 ${error && password ? '!border-red-600 !text-red-500 placeholder-red-900/50' : ''}`}
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
                    <p className="text-[9px] font-mono text-gray-600 tracking-widest uppercase">Ordemilk Engineering Â© 2026</p>
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
