
import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, AIOutputBox } from './UI';
import { generateTechResponse } from '../services/geminiService';

// --- FERRAMENTA 4: DIMENSIONAMENTO ---
export const Tool_Sizing: React.FC = () => {
    const [volumeOrdenha, setVolumeOrdenha] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [calcResult, setCalcResult] = useState<{ kcalh: number, kw: number, hp: number } | null>(null);

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

            // FÍSICA EXATA ORDEMILK (Mantendo a sua regra de 16 anos)
            const massa = V * 1.03;
            const calorEspecifico = 0.93;
            const deltaT = 32;
            const tempo = 3;

            const cargaBase = (massa * calorEspecifico * deltaT) / tempo;

            // FATOR EMPÍRICO ORDEMILK (O Segredo do Puxo Térmico / Rendimento na partida)
            // Tanques < 2000L fator de 0.75
            // Tanques >= 2000L fator de 0.85
            const safetyFactor = V > 2000 ? 0.85 : 0.75;

            const cargaTotalKcal = cargaBase * safetyFactor;
            const cargaTotalKw = cargaTotalKcal / 860;
            const cargaTotalWatts = cargaTotalKw * 1000;

            // TABELA OFICIAL MANEUROP MTZ - R404A (-10°C Evap / 40°C Cond)
            // ATENÇÃO: Convertida para 60Hz (Sua realidade no Brasil) -> Rendimento 20% maior que no manual europeu.
            const CATALOGO_MANEUROP = [
                { model: 'MTZ18', watts50: 1821, hp: 1.5 },
                { model: 'MTZ22', watts50: 2362, hp: 2.0 },
                { model: 'MTZ28', watts50: 3058, hp: 2.5 },
                { model: 'MTZ32', watts50: 3447, hp: 2.8 },
                { model: 'MTZ36', watts50: 4004, hp: 3.0 },
                { model: 'MTZ40', watts50: 4578, hp: 3.3 },
                { model: 'MTZ44', watts50: 5082, hp: 3.5 },
                { model: 'MTZ50', watts50: 5756, hp: 4.0 },
                { model: 'MTZ56', watts50: 6739, hp: 4.5 },
                { model: 'MTZ64', watts50: 7550, hp: 5.0 },
                { model: 'MTZ72', watts50: 8644, hp: 6.0 },
                { model: 'MTZ80', watts50: 10919, hp: 6.5 },
                { model: 'MTZ100', watts50: 12465, hp: 8.0 },
                { model: 'MTZ125', watts50: 16189, hp: 10.0 },
                { model: 'MTZ144', watts50: 18000, hp: 12.0 },
                { model: 'MTZ160', watts50: 22357, hp: 13.0 }
            ].map(c => {
                const watts60hz = c.watts50 * 1.20; // 60Hz rende 20% a mais
                return {
                    ...c,
                    watts: watts60hz,
                    kcalh: watts60hz * 0.86
                };
            });

            // Algoritmo de Busca do Compressor Ideal - Procurar o primeiro que supre a carga ou o mais próximo se faltar menos de 2%
            let quantidadeDecisiva = 1;
            let compressorSugerido = CATALOGO_MANEUROP.find(c => c.kcalh >= (cargaTotalKcal * 0.98));

            if (!compressorSugerido) {
                // A carga excede o maior compressor individual da tabela.
                // Vamos tentar com 2, 3, 4 equipamentos iguais até achar a melhor configuração.
                let foundMultiplo = false;
                for (let qty = 2; qty <= 20; qty++) {
                    const cargaPorUnidade = cargaTotalKcal / qty;
                    const opcao = CATALOGO_MANEUROP.find(c => c.kcalh >= (cargaPorUnidade * 0.98));
                    if (opcao) {
                        compressorSugerido = opcao;
                        quantidadeDecisiva = qty;
                        foundMultiplo = true;
                        break;
                    }
                }

                // Redundância de segurança extrema
                if (!foundMultiplo) {
                    const maiorCompressor = CATALOGO_MANEUROP[CATALOGO_MANEUROP.length - 1];
                    quantidadeDecisiva = Math.ceil((cargaTotalKcal * 0.98) / maiorCompressor.kcalh);
                    compressorSugerido = maiorCompressor;
                }
            }

            const compInfo = compressorSugerido!;

            setCalcResult({
                kcalh: cargaTotalKcal,
                kw: cargaTotalKw,
                hp: compInfo.hp * quantidadeDecisiva
            });

            // Resposta Instantânea Offline
            const resultText = `
**SUGESTÃO DE ENGENHARIA ORDEMILK**

Para suprir esta carga térmica industrial, o projeto exige um **Rack / Conjunto Frigorífico da Série MTZ Maneurop (Danfoss)**.

*   **Quantidade Necessária:** ${quantidadeDecisiva}x Unidade(s)
*   **Modelo Indicado:** ${compInfo.model}
*   **Potência Nominal por Motor:** ${compInfo.hp} HP (Potência Total do Sistema: ${(compInfo.hp * quantidadeDecisiva).toFixed(1)} HP)
*   **Rendimento Extraído do Catálogo (por unidade):** ${(compInfo.kcalh).toFixed(0)} kcal/h (${(compInfo.watts / 1000).toFixed(2)} kW)
*   *Base de Cálculo:* R-404A | TEM -10°C | TCM 40°C.

**Atenção Técnico:** Esta seleção foi feita de forma 100% matemática e determinística baseada na tabela oficial de performance, considerando Delta de 32°C em 3 horas. Cargas extremas foram divididas em unidades múltiplas idênticas para suprir a demanda frigorífica calculada.
            `;

            setResult(resultText);

        } catch (e: any) {
            setResult(`ERRO NO CÁLCULO: ${e.message || "Falha ao processar dimensionamento."}`);
        }
        setLoading(false);
    };

    return (
        <div className="animate-fadeIn pb-24">
            <SectionTitle icon="fa-solid fa-ruler-combined" title="4. DIMENSIONAMENTO" />

            {/* SWITCH DE MODO */}
            <div className="flex bg-[#252525] p-1 rounded-lg mb-4 border border-[#404040] gap-1">
                <button
                    onClick={() => { setInputMode('ordenha'); setInputRaw(''); setVolumeOrdenha(''); setResult(''); setCalcResult(null); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all leading-tight ${inputMode === 'ordenha'
                        ? 'bg-brand text-white shadow-lg'
                        : 'text-slate-500 hover:text-slate-300 bg-techDark/50'
                        }`}
                >
                    Por Ordenha
                </button>
                <button
                    onClick={() => { setInputMode('tanque'); setInputRaw(''); setVolumeOrdenha(''); setResult(''); setCalcResult(null); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all leading-tight ${inputMode === 'tanque'
                        ? 'bg-brand text-white shadow-lg'
                        : 'text-slate-500 hover:text-slate-300 bg-techDark/50'
                        }`}
                >
                    Capacidade Tanque
                </button>
            </div>

            <Card>
                <div className="mb-4">
                    <Input
                        label={inputMode === 'ordenha' ? "Litros na Ordenha (Carga Real)" : "Capacidade Total do Tanque"}
                        placeholder={inputMode === 'ordenha' ? "Ex: 1000 Litros" : "Ex: 4000 Litros"}
                        type="number"
                        value={inputRaw}
                        onChange={e => handleInputChange(e.target.value)}
                        autoFocus
                    />

                    {volumeOrdenha && inputMode === 'tanque' && (
                        <div className="text-right text-[9px] sm:text-[10px] text-brand font-bold -mt-2 mb-2 px-1">
                            Considerando 2 ordenhas/dia: {volumeOrdenha} L/ordenha
                        </div>
                    )}
                </div>

                {/* VISUALIZAÇÃO DOS PARÂMETROS DE PROJETO (FIXOS) */}
                <div className="mb-6">
                    <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 text-white">Parâmetros do Projeto</span>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-techDark/60 p-3 sm:p-4 rounded-xl border border-techBorder flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1">SST (°C)</span>
                            <span className="text-white font-bold text-lg sm:text-xl">-10</span>
                        </div>
                        <div className="bg-techDark/60 p-3 sm:p-4 rounded-xl border border-techBorder flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1">SDT (°C)</span>
                            <span className="text-white font-bold text-lg sm:text-xl">40</span>
                        </div>
                        <div className="bg-techDark/60 p-3 sm:p-4 rounded-xl border border-techBorder flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1">DELTA T (°C)</span>
                            <span className="text-white font-bold text-lg sm:text-xl">31</span>
                        </div>
                        <div className="bg-techDark/60 p-3 sm:p-4 rounded-xl border border-techBorder flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1">TEMPO (H)</span>
                            <span className="text-white font-bold text-lg sm:text-xl">3</span>
                        </div>
                    </div>
                </div>

                <Button onClick={run} disabled={loading}>
                    CALCULAR CARGA TÉRMICA
                </Button>

                {calcResult && (
                    <div className="mt-6 mb-2 p-5 rounded-2xl border border-dashed border-techBorder/50 bg-techDark/40">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#3b82f6]">Estimativa Preliminar</h3>
                        </div>
                        <div className="flex items-baseline justify-center gap-3">
                            <span className="text-2xl sm:text-3xl font-black text-white tracking-widest">{calcResult.kcalh.toFixed(0)}</span>
                            <span className="text-base sm:text-lg text-white font-medium">kcal/h</span>
                        </div>
                    </div>
                )}

                <AIOutputBox content={result} isLoading={loading} title="SUGESTÃO DE COMPRESSOR" />
            </Card>
        </div>
    );
};
