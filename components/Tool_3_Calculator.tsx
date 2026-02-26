
import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, Select, AIOutputBox } from './UI';
import { generateTechResponse } from '../services/geminiService';
import { CalcMode, Refrigerant } from '../types';
import { logicService } from '../services/logicService';

export const Tool_Calculator: React.FC = () => {
    const [fluid, setFluid] = useState<Refrigerant>(Refrigerant.R22);
    const [press, setPress] = useState('');
    const [temp, setTemp] = useState('');
    const [mode, setMode] = useState<CalcMode>('SH');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const run = async () => {
        if (!press || !temp) return;
        setLoading(true);
        try {
            const prompt = logicService.formatCalculatorPrompt(fluid, press as any, temp, mode);
            const text = await generateTechResponse(prompt, "CALC");
            setResult(text);
        } catch (e) { setResult("Erro ao calcular."); }
        setLoading(false);
    };

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-calculator" title="3. CÁLCULO TÉCNICO" />
            <Card>
                <Select label="Fluido Refrigerante" value={fluid} onChange={e => setFluid(e.target.value as Refrigerant)}>
                    <option value={Refrigerant.R22}>R-22</option>
                    <option value={Refrigerant.R404A}>R-404A</option>
                </Select>
                
                <div className="flex gap-2">
                    <Input label="Pressão (PSI)" type="number" value={press} onChange={e => setPress(e.target.value)} placeholder="Manômetro" />
                    <Input label="Temp. Tubo (°C)" type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder="Termômetro" />
                </div>
                
                <Select label="Modo de Cálculo" value={mode} onChange={e => setMode(e.target.value as CalcMode)}>
                    <option value="Superaquecimento">Superaquecimento (Baixa/Sucção)</option>
                    <option value="Sub-resfriamento">Sub-resfriamento (Alta/Líquido)</option>
                </Select>

                <div className="mb-4 p-3 rounded-lg border text-[10px] font-medium leading-relaxed flex items-start gap-2 transition-colors bg-blue-900/20 border-blue-800 text-blue-200">
                    <i className="fa-solid fa-circle-info mt-0.5 text-xs text-blue-400"></i>
                    <span>
                        {mode === 'SH' 
                            ? "SUPER AQUECIMENTO (SH): Meça a temperatura na tubulação de sucção, a 10cm do compressor."
                            : "SUB-RESFRIAMENTO (SR): Meça a temperatura na linha de líquido, na saída do condensador."}
                    </span>
                </div>

                <Button onClick={run} disabled={loading}>CALCULAR AGORA</Button>
                <AIOutputBox content={result} isLoading={loading} title={`RESULTADO ${mode}`} />
            </Card>
        </div>
    );
};
