
import React, { useState, useEffect } from 'react';
import { Card, SectionTitle, Button, Select, Input, AIOutputBox } from './UI'; 
import { knowledgeService } from "../services/knowledgeService";
import { FieldTip } from "../types";
import { BOM_DATABASE } from "../bom_database";

export const Tool_Catalog: React.FC = () => {
    // Inicializa com o primeiro modelo da lista nova para evitar estado vazio
    const [selectedModel, setSelectedModel] = useState(Object.keys(BOM_DATABASE)[0] || '');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    // Memória de Campo
    const [tips, setTips] = useState<FieldTip[]>([]);
    const [newTip, setNewTip] = useState('');

    useEffect(() => {
        setTips(knowledgeService.getTips());
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Pequeno delay para simular consulta à biblioteca segura
        await new Promise(r => setTimeout(r, 600));
        
        const bomData = BOM_DATABASE[selectedModel];
        if (bomData) {
            const formatted = bomData.map(item => 
                `✅ **${item.descricao}**\n   Código: ${item.codigo} | Qtd: ${item.quantidade}`
            ).join('\n\n');
            setResult(formatted);
        } else {
            setResult("⚠️ MODELO EM CADASTRAMENTO: Este modelo ainda não possui lista de peças completa.");
        }
        setLoading(false);
    };

    const handleAddTip = () => {
        if (!newTip.trim()) return;
        knowledgeService.saveTip(newTip);
        setTips(knowledgeService.getTips());
        setNewTip('');
    };

    const handleDeleteTip = (id: string) => {
        knowledgeService.deleteTip(id);
        setTips(knowledgeService.getTips());
    };

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-boxes-stacked" title="6. DADOS TÉCNICOS (BOM)" />
            
            <Card className="mb-6">
                <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} label="SELECIONE O MODELO EXATO (LISTA OFICIAL)">
                    {Object.keys(BOM_DATABASE).map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                    <option value="OUTRO">OUTROS MODELOS (CONSULTAR FÁBRICA)</option>
                </Select>
                
                <div className="mb-4 p-3 rounded-lg border text-[10px] font-medium leading-relaxed flex items-start gap-2 transition-colors bg-[#1a1a1a] border-[#333] text-gray-400">
                    <i className="fa-solid fa-database mt-0.5 text-xs text-[#1abc9c]"></i>
                    <span>Consulta ESTRITA à Base V35 (Engenharia). Dados oficiais de fábrica.</span>
                </div>

                <Button onClick={fetchData} disabled={loading}>
                    CONSULTAR FICHA TÉCNICA
                </Button>
                
                <AIOutputBox content={result} isLoading={loading} title={`FICHA TÉCNICA: ${selectedModel}`} />
            </Card>

            <SectionTitle icon="fa-solid fa-brain" title="MEMÓRIA DE CAMPO (A IA APRENDE AQUI)" />
            <Card className="border-t-4 border-t-emerald-500">
                <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                    Escreva abaixo suas descobertas ou regras que a IA deve lembrar. 
                    <span className="text-emerald-400 font-bold ml-1">Ela usará isso para te dar respostas melhores no Suporte.</span>
                </p>
                <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                        <Input 
                            placeholder="Ex: No modelo X, capacitor 35uF..." 
                            value={newTip} 
                            onChange={e => setNewTip(e.target.value)}
                            className="!mb-0 !p-3 text-xs"
                        />
                    </div>
                    <button 
                        onClick={handleAddTip}
                        className="bg-emerald-600 text-white w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-emerald-500 transition-colors shrink-0 flex items-center justify-center shadow-lg active:scale-95"
                    >
                        <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {tips.length === 0 ? (
                        <p className="text-[9px] text-center text-gray-600 italic">Nenhum aprendizado registrado ainda.</p>
                    ) : (
                        tips.map(tip => (
                            <div key={tip.id} className="bg-[#1a1a1a] p-2 rounded border border-[#333] flex justify-between items-start gap-3">
                                <p className="text-[10px] text-gray-300 leading-tight flex-1">{tip.content}</p>
                                <button onClick={() => handleDeleteTip(tip.id)} className="text-red-900 hover:text-red-500 transition-colors">
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
