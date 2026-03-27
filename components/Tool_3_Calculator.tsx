
import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, Select, AIOutputBox } from './UI';
import { generateTechResponse } from '../services/geminiService';
import { CalcMode, Refrigerant } from '../types';
import { logicService } from '../services/logicService';

export const Tool_Calculator: React.FC = () => {
    const [fluid, setFluid] = useState<Refrigerant>(Refrigerant.R22);
    const [press, setPress] = useState('');
    const [temp, setTemp] = useState('');
    const [mode, setMode] = useState<CalcMode>('Superaquecimento');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const localAudit = logicService.getCalculatorAudit(fluid, press, temp, mode);
    const pressureLabel = mode === 'Superaquecimento' ? 'Pressão de Baixa (PSI)' : 'Pressão de Alta (PSI)';
    const temperatureLabel = mode === 'Superaquecimento' ? 'Temp. Sucção (°C)' : 'Temp. Linha Líquido (°C)';
    const temperaturePlaceholder = mode === 'Superaquecimento' ? 'Tubulação de sucção' : 'Saída do condensador';

    const run = async () => {
        if (!press || !temp) return;
        setLoading(true);
        try {
            const prompt = logicService.formatCalculatorPrompt(fluid, press, temp, mode);
            const text = await generateTechResponse(prompt, "CALC");
            setResult(text);
        } catch (error) { 
            const errorMessage = error instanceof Error ? error.message : "Falha na comunicação com a IA.";
            setResult(`ERRO TÉCNICO: ${errorMessage}`); 
        }
        setLoading(false);
    };

    const classificationTone = localAudit.classification === 'IDEAL'
        ? 'border-[#00d9ff]/35 bg-[#00d9ff]/8 text-[#d8f7ff]'
        : localAudit.classification
            ? 'border-[#ff6600]/35 bg-[#ff6600]/10 text-[#ffe5d1]'
            : 'border-[#4a5c73] bg-[#2a3646]/65 text-[#d7dee8]';

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-calculator" title="3. CÁLCULO TÉCNICO" />
            <Card>
                <Select label="Fluido Refrigerante" value={fluid} onChange={e => setFluid(e.target.value as Refrigerant)}>
                    <option value={Refrigerant.R22}>R-22</option>
                    <option value={Refrigerant.R404A}>R-404A</option>
                </Select>
                
                <div className="flex gap-2">
                    <Input label={pressureLabel} type="number" value={press} onChange={e => setPress(e.target.value)} placeholder="Manômetro" />
                    <Input label={temperatureLabel} type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder={temperaturePlaceholder} />
                </div>
                
                <Select label="Modo de Cálculo" value={mode} onChange={e => setMode(e.target.value as CalcMode)}>
                    <option value="Superaquecimento">Superaquecimento (Baixa/Sucção)</option>
                    <option value="Sub-resfriamento">Sub-resfriamento (Alta/Líquido)</option>
                </Select>

                <div className="mb-4 p-3 rounded-lg border text-[10px] font-medium leading-relaxed flex items-start gap-2 transition-colors bg-[#2a3646]/50 border-[#4a5c73] text-[#9ca7b8]">
                    <i className="fa-solid fa-circle-info mt-0.5 text-xs text-[#00d9ff]"></i>
                    <span>
                        {mode === 'Superaquecimento' 
                            ? "SUPER AQUECIMENTO (SH): Meça a temperatura na tubulação de sucção, a 10cm do compressor."
                            : "SUB-RESFRIAMENTO (SC): Meça a temperatura na linha de líquido, na saída do condensador."}
                    </span>
                </div>

                <div className={`mb-4 rounded-[18px] border overflow-hidden ${classificationTone}`}>
                    <div className="px-4 py-2.5 border-b border-white/10 bg-black/10 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] font-heading">CALCULO LOCAL AUDITAVEL</p>
                            <p className="text-[11px] mt-1 opacity-90">A conta abaixo e o valor de referencia do app.</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[10px] font-bold uppercase tracking-[0.12em]">
                            {localAudit.modeShortLabel}
                        </div>
                    </div>

                    <div className="px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80 mb-2">
                            DIRECAO DO CALCULO
                        </div>
                        <div className="rounded-[14px] border border-white/10 bg-black/15 px-3 py-2.5 text-[13px] font-mono text-white mb-3">
                            {localAudit.directionLabel}
                        </div>

                        {localAudit.ready ? (
                            <>
                                <div className="rounded-[16px] border border-white/10 bg-[#111827]/55 px-3 py-3 font-mono text-[14px] text-white space-y-2">
                                    <p>{localAudit.tsatLabel}</p>
                                    <p>{localAudit.resultLabel}</p>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] font-semibold">
                                        {localAudit.classificationLabel}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] font-semibold">
                                        {localAudit.referenceLabel}
                                    </span>
                                </div>

                                <p className="mt-3 text-[11px] leading-relaxed opacity-90">
                                    Fonte local: {localAudit.sourceLabel}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="rounded-[16px] border border-[#ff6600]/25 bg-[#111827]/55 px-3 py-3 text-[12px] leading-relaxed text-white">
                                    {localAudit.warning}
                                </div>
                                <p className="mt-3 text-[11px] leading-relaxed opacity-90">
                                    Fonte local: {localAudit.sourceLabel}
                                </p>
                                <p className="mt-2 text-[11px] leading-relaxed opacity-90">
                                    Revise os dados e confira a tabela PT antes de agir no equipamento.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <Button onClick={run} disabled={loading}>CALCULAR AGORA</Button>
                <AIOutputBox content={result} isLoading={loading} title={`ANALISE COMPLEMENTAR ${mode}`} />
            </Card>
        </div>
    );
};
