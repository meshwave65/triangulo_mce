import React, { useMemo } from 'react';

/**
 * Representação de pontos no espaço SVG
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Valores de entrada do usuário
 */
export interface HarmonyData {
  // Distribuição Principal (10 horas totais)
  mente: number;    // 0-10 (altura no triângulo MENTE)
  corpo: number;    // 0-10 (altura no triângulo CORPO)
  espirito: number; // 0-10 (altura no triângulo ESPÍRITO)

  // Balanços Secundários (Soma 10 em cada par)
  // Estes valores determinam o deslocamento lateral dentro de cada sub-triângulo.
  // Por exemplo, para Mente, o balanço é entre Corpo e Espírito.
  // balanceMente.corpo: quanto de 'corpo' puxa o ponto da mente para o lado do corpo.
  // balanceMente.espirito: quanto de 'espirito' puxa o ponto da mente para o lado do espirito.
  balancoMente: { corpo: number; espirito: number }; 
  balancoCorpo: { mente: number; espirito: number }; 
  balancoEspirito: { mente: number; corpo: number }; 
}

const HarmonyTriangle: React.FC<{ data: HarmonyData }> = ({ data }) => {
  // Configurações do SVG
  const size = 600;
  const height = (Math.sqrt(3) / 2) * size;
  const padding = 60;
  const viewBox = `0 0 ${size + 2 * padding} ${height + 2 * padding}`;

  // Vértices do Triângulo da Harmonia (TH) Principal (Equilátero)
  const L: Point = { x: padding, y: height + padding };        // Inferior Esquerdo
  const R: Point = { x: size + padding, y: height + padding }; // Inferior Direito
  const T: Point = { x: size / 2 + padding, y: padding };      // Topo Superior
  
  // O Centro (Baricentro) do TH
  // Em um triângulo equilátero, o centro fica a 1/3 da altura a partir da base.
  const Center: Point = { x: size / 2 + padding, y: height * (2 / 3) + padding };

  /**
   * Função de Plotagem para Sub-triângulos Isósceles:
   * vBase1 e vBase2 formam a base externa (lado do TH).
   * vTip é o centro do TH (vértice comum aos 3 sub-triângulos).
   * 
   * @param value - Valor principal (0-10) que define a 'altura' do ponto da base para o vTip.
   * @param balanceA - Peso (0-10) para o lado do vBase1 (influência da área 'A').
   * @param balanceB - Peso (0-10) para o lado do vBase2 (influência da área 'B').
   * @param vBase1 - Primeiro vértice da base externa do sub-triângulo.
   * @param vBase2 - Segundo vértice da base externa do sub-triângulo.
   * @param vTip - Vértice oposto à base externa (o centro do TH).
   * @returns As coordenadas (x, y) do ponto plotado.
   */
  const calculatePoint = (
    value: number,      
    balanceA: number,   
    balanceB: number,   
    vBase1: Point,
    vBase2: Point,
    vTip: Point
  ): Point => {
    // Normalização da altura (t vai de 0 na base até 1 no centro)
    const t = value / 10; 
    
    // 1. Ponto Médio da Base Externa
    const midBase: Point = {
      x: (vBase1.x + vBase2.x) / 2,
      y: (vBase1.y + vBase2.y) / 2
    };

    // 2. Ponto na Linha de Altura (Interpolação Linear)
    // Este ponto 'sobe' da base externa em direção ao centro do TH.
    const pHeight: Point = {
      x: midBase.x + t * (vTip.x - midBase.x),
      y: midBase.y + t * (vTip.y - midBase.y)
    };

    // 3. Cálculo da Largura Disponível na altura 't'
    // Como o triângulo é isósceles e fecha no Center, a largura da base 
    // diminui linearmente: Largura(t) = LarguraBase * (1 - t)
    const widthVector = {
      x: (vBase2.x - vBase1.x) * (1 - t),
      y: (vBase2.y - vBase1.y) * (1 - t)
    };

    // 4. Deslocamento Lateral (Balanço entre as outras duas áreas)
    // balanceFactor varia de -1 (totalmente para vBase1) a 1 (totalmente para vBase2)
    // Se balanceA = 7 e balanceB = 3, o balanceFactor será (3-7)/10 = -0.4, puxando para vBase1.
    const balanceFactor = (balanceB - balanceA) / 10; 

    // O ponto final é o pHeight deslocado lateralmente ao longo do vetor de largura
    return {
      x: pHeight.x + (balanceFactor * widthVector.x) / 2,
      y: pHeight.y + (balanceFactor * widthVector.y) / 2
    };
  };

  // Plotagem dos 3 vértices do Triângulo MCE (Mente, Corpo, Espírito)
  // Cada um dentro de seu respectivo sub-triângulo isósceles.
  
  // MENTE: Base é a linha inferior (L -> R), Topo é o Centro
  // O balanço da Mente é entre Corpo (puxa para L) e Espírito (puxa para R)
  const pMente = useMemo(() => 
    calculatePoint(data.mente, data.balancoMente.corpo, data.balancoMente.espirito, L, R, Center),
    [data]
  );

  // CORPO: Base é o lado esquerdo (L -> T), Topo é o Centro
  // O balanço do Corpo é entre Mente (puxa para L) e Espírito (puxa para T)
  const pCorpo = useMemo(() => 
    calculatePoint(data.corpo, data.balancoCorpo.mente, data.balancoCorpo.espirito, L, T, Center),
    [data]
  );

  // ESPÍRITO: Base é o lado direito (R -> T), Topo é o Centro
  // O balanço do Espírito é entre Mente (puxa para R) e Corpo (puxa para T)
  const pEspirito = useMemo(() => 
    calculatePoint(data.espirito, data.balancoEspirito.mente, data.balancoEspirito.corpo, R, T, Center),
    [data]
  );

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-slate-100">
      <svg width={size + 2 * padding} height={height + 2 * padding} viewBox={viewBox} className="drop-shadow-sm">
        {/* Sub-triângulos Isósceles de Fundo (Preenchimento suave) */}
        <polygon points={`${L.x},${L.y} ${R.x},${R.y} ${Center.x},${Center.y}`} fill="#3b82f6" fillOpacity="0.1" /> {/* MENTE */}
        <polygon points={`${L.x},${L.y} ${T.x},${T.y} ${Center.x},${Center.y}`} fill="#10b981" fillOpacity="0.1" /> {/* CORPO */}
        <polygon points={`${R.x},${R.y} ${T.x},${T.y} ${Center.x},${Center.y}`} fill="#8b5cf6" fillOpacity="0.1" /> {/* ESPÍRITO */}

        {/* Linhas de Contorno e Divisórias */}
        <polygon points={`${L.x},${L.y} ${R.x},${R.y} ${T.x},${T.y}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={L.x} y1={L.y} x2={Center.x} y2={Center.y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />
        <line x1={R.x} y1={R.y} x2={Center.x} y2={Center.y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />
        <line x1={T.x} y1={T.y} x2={Center.x} y2={Center.y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />

        {/* Triângulo MCE (Individualidade) */}
        <polygon 
          points={`${pMente.x},${pMente.y} ${pCorpo.x},${pCorpo.y} ${pEspirito.x},${pEspirito.y}`} 
          fill="rgba(79, 70, 229, 0.25)" 
          stroke="#4f46e5" 
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Vértices Plotados */}
        <circle cx={pMente.x} cy={pMente.y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
        <circle cx={pCorpo.x} cy={pCorpo.y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
        <circle cx={pEspirito.x} cy={pEspirito.y} r="5" fill="#8b5cf6" stroke="white" strokeWidth="2" />

        {/* Rótulos das Áreas */}
        <text x={size/2 + padding} y={height + padding + 35} textAnchor="middle" className="text-sm font-bold fill-blue-700">MENTE</text>
        <text x={padding - 30} y={padding + height/2} textAnchor="middle" transform={`rotate(-60, ${padding-30}, ${padding+height/2})`} className="text-sm font-bold fill-green-700">CORPO</text>
        <text x={size + padding + 30} y={padding + height/2} textAnchor="middle" transform={`rotate(60, ${size+padding+30}, ${padding+height/2})`} className="text-sm font-bold fill-purple-700">ESPÍRITO</text>
      </svg>
    </div>
  );
};

export default HarmonyTriangle;
