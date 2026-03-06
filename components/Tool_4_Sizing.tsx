
import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, AIOutputBox } from './UI';
import { generateTechResponse } from '../services/geminiService';

// --- FERRAMENTA 4: DIMENSIONAMENTO ---
export const Tool_Sizing: React.FC = () => {
    const [volumeOrdenha, setVolumeOrdenha] = useState(''); 
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const [inputMode, setInputMode] = useState<'ordenha' | 'tanque'>('ordenha');
    const [inputRaw, setInputRaw] = useState('');

    const handleInputChange = (val: string) => {
        setInputRaw(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            if (inputMode === 'tanque') setVolumeOrdenha((num / 2).toString());
            else setVolumeOrdenha(val);
        } else {
            setVolumeOrdenha('');
        }
    };

    const run = async () => {
        if (!volumeOrdenha) return;
        setLoading(true);
        
        try {
            const V = parseFloat(volumeOrdenha);
            // Ajuste Dinâmico do Fator de Segurança
            // Tanques pequenos (<2000L ordenha): 0.75 (Eficiência padrão)
            // Tanques grandes (>2000L ordenha): 0.85 (Maior margem de segurança devido à inércia térmica e distribuição)
            const safetyFactor = V > 2000 ? 0.85 : 0.75;

            const massa = V * 1.03;
            const cargaBase = (massa * 0.93 * 31) / 3;
            const cargaTotalKcal = cargaBase * safetyFactor; 
            const cargaTotalKw = cargaTotalKcal / 860;

            const prompt = `
            COMANDO: DIMENSIONAMENTO TÉCNICO RIGOROSO (DANFOSS).
            
            PARÂMETROS DE PROJETO (FIXOS - NÃO ALTERAR):
            - Regime: Resfriamento de Leite.
            - Evaporação (SST): -10°C.
            - Condensação (SDT): 40°C (Verão Tropical).
            - Tempo de Resfriamento: 3 Horas (Norma ISO).
            - Fator de Segurança Aplicado: ${safetyFactor} (Ajustado por Volume).
            
            DADOS CALCULADOS PELO SISTEMA (USAR EXATAMENTE ESTES):
            - Volume por Ordenha: ${V} Litros.
            - Carga Térmica Requerida: ${cargaTotalKcal.toFixed(0)} kcal/h.
            - Potência Frigorífica: ${cargaTotalKw.toFixed(2)} kW.
            
            INSTRUÇÃO DE SAÍDA:
            1. Gere um "MEMORIAL DE CÁLCULO" listando os 3 principais indicadores: KCAL/H, KW e HP.
            2. Destaque em negrito a condição de projeto: "Considerando Evaporação -10°C e Condensação 40°C".
            3. Com base na **Carga Térmica Requerida (kcal/h)** e **Potência Frigorífica (kW)**, sugira o compressor Danfoss (série MT/MTZ) ou equivalente comercial **MAIS ADEQUADO (evitando superdimensionamento)**, indicando um modelo e sua potência nominal em HP. Finalize com a nota: "O uso de compressores com capacidade inferior ao recomendado resultará em tempo de resfriamento excedente ao limite normativo e risco de acidificação do leite."
            4. Seja extremamente técnico e direto. Sem saudações.
            `;

            const text = await generateTechResponse(prompt, "SIZING");
            setResult(text);
            
        } catch (e: any) { 
            setResult(`ERRO NO CÁLCULO: ${e.message || "Falha ao processar dimensionamento."}`); 
        }
        setLoading(false);
    };

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-ruler-combined" title="4. DIMENSIONAMENTO" />
            
            {/* SWITCH DE MODO */}
            <div className="flex bg-[#050912] p-1 rounded-xl mb-4 border border-white/5 gap-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                <button 
                    onClick={() => { setInputMode('ordenha'); setInputRaw(''); setVolumeOrdenha(''); setResult(''); }}
                    className={`flex-1 py-2.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all leading-tight font-heading ${
                        inputMode === 'ordenha' 
                        ? 'bg-[#FF8F00] text-white shadow-md' 
                        : 'text-[#E8EAF6]/40 hover:text-[#E8EAF6]'
                    }`}
                >
                    Por Ordenha
                </button>
                <button 
                    onClick={() => { setInputMode('tanque'); setInputRaw(''); setVolumeOrdenha(''); setResult(''); }}
                    className={`flex-1 py-2.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all leading-tight font-heading ${
                        inputMode === 'tanque' 
                        ? 'bg-[#FF8F00] text-white shadow-md' 
                        : 'text-[#E8EAF6]/40 hover:text-[#E8EAF6]'
                    }`}
                >
                    Capacidade Tanque
                </button>
            </div>

            <Card>
                <div className="mb-4">
                    <Input 
                        label={inputMode === 'ordenha' ? "Litros na Ordenha (Carga Real)" : "Capacidade Total do Tanque"}
                        placeholder={inputMode === 'ordenha' ? "Ex: 5000 L" : "Ex: 10000 L"}
                        type="number" 
                        value={inputRaw} 
                        onChange={e => handleInputChange(e.target.value)} 
                        autoFocus
                    />
                    
                    {volumeOrdenha && inputMode === 'tanque' && (
                        <div className="text-right text-[9px] sm:text-[10px] text-[#FF8F00] font-bold -mt-2 mb-2 px-1 font-heading">
                            Considerando 2 ordenhas/dia: {volumeOrdenha} L/ordenha
                        </div>
                    )}
                </div>

                {/* VISUALIZAÇÃO DOS PARÂMETROS DE PROJETO (FIXOS) */}
                <div className="mb-4 p-3 rounded-xl border flex flex-col gap-2 bg-[#050912] border-white/5">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <i className="fa-solid fa-temperature-low text-[#FF8F00] text-xs"></i>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#E8EAF6]/80 uppercase font-heading">Parâmetros de Projeto (Danfoss)</span>
                    </div>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] sm:text-[10px] text-[#E8EAF6]/60 font-sans">
                        <div className="flex justify-between xs:block">Evaporação (SST): <span className="text-white font-bold">-10°C</span></div>
                        <div className="flex justify-between xs:block">Condensação (SDT): <span className="text-white font-bold">40°C</span></div>
                        <div className="flex justify-between xs:block">Delta T (Leite): <span className="text-white font-bold">31°C</span></div>
                        <div className="flex justify-between xs:block">Tempo Limite: <span className="text-white font-bold">3 Horas</span></div>
                    </div>
                </div>
                
                <Button onClick={run} disabled={loading}>
                    CALCULAR CARGA TÉRMICA
                </Button>
                
                <AIOutputBox content={result} isLoading={loading} title="MEMORIAL DE CÁLCULO" />
            </Card>
        </div>
    );
};
