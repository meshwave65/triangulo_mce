import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from './lib/supabase'

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-hero-background.webp'
const RESULT_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-result-background.webp'

interface LeadData {
  nome: string
  telefone: string
  email: string
}

interface ResultData {
  altM: string
  altC: string
  altE: string
  deslocM: string
  deslocC: string
  deslocE: string
  idealM: number
  idealC: number
  idealE: number
  pairedCM: { mente: number; corpo: number }
  pairedCE: { corpo: number; espirito: number }
  pairedME: { mente: number; espirito: number }
}

// ====================================================================================
// LÓGICA DE PLOTAGEM ISÓSCELES INTEGRADA DIRETAMENTE NO App.tsx
// ====================================================================================

interface Point {
  x: number;
  y: number;
}

const calculateIsoscelesPoint = (
  value: number,      
  balanceA: number,   
  balanceB: number,   
  vBase1: Point,
  vBase2: Point,
  vTip: Point
): Point => {
  const t = value / 10; 
  const midBase: Point = {
    x: (vBase1.x + vBase2.x) / 2,
    y: (vBase1.y + vBase2.y) / 2
  };
  const pHeight: Point = {
    x: midBase.x + t * (vTip.x - midBase.x),
    y: midBase.y + t * (vTip.y - midBase.y)
  };
  const widthVector = {
    x: (vBase2.x - vBase1.x) * (1 - t),
    y: (vBase2.y - vBase1.y) * (1 - t)
  };
  const balanceFactor = (balanceB - balanceA) / 10; 
  return {
    x: pHeight.x + (balanceFactor * widthVector.x) / 2,
    y: pHeight.y + (balanceFactor * widthVector.y) / 2
  };
};

// ====================================================================================

function App() {
  const [lead, setLead] = useState<LeadData>({ nome: '', telefone: '', email: '' })
  const [showIntro, setShowIntro] = useState(true)
  const [showSliders, setShowSliders] = useState(false)

  const [mente, setMente] = useState(4)
  const [corpo, setCorpo] = useState(3)
  const restante = Math.max(0, 10 - mente)
  const espirito = Math.max(0, restante - corpo)

  const [pairedCM, setPairedCM] = useState({ mente: 5, corpo: 5 })
  const [pairedCE, setPairedCE] = useState({ corpo: 5, espirito: 5 })
  const [pairedME, setPairedME] = useState({ mente: 5, espirito: 5 })

  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(false)

  const irParaSliders = () => {
    setShowIntro(false)
    setShowSliders(true)
  }

  const calcular = async () => {
    setLoading(true)
    const altM = ((mente + pairedCM.mente * 0.5 + pairedME.mente * 0.5) / 2).toFixed(1)
    const altC = ((corpo + pairedCM.corpo * 0.5 + pairedCE.corpo * 0.5) / 2).toFixed(1)
    const altE = ((espirito + pairedCE.espirito * 0.5 + pairedME.espirito * 0.5) / 2).toFixed(1)
    const deslocM = ((pairedCM.mente - pairedCM.corpo) + (pairedME.mente - pairedME.espirito)) / 2
    const deslocC = ((pairedCM.corpo - pairedCM.mente) + (pairedCE.corpo - pairedCE.espirito)) / 2
    const deslocE = ((pairedCE.espirito - pairedCE.corpo) + (pairedME.espirito - pairedME.mente)) / 2

    const res: ResultData = {
      altM, altC, altE,
      deslocM: deslocM.toFixed(1),
      deslocC: deslocC.toFixed(1),
      deslocE: deslocE.toFixed(1),
      idealM: mente,
      idealC: corpo,
      idealE: espirito,
      pairedCM, pairedCE, pairedME
    }

    try {
      // 1. Salvar Lead na tabela 'leads' (PLURAL)
      await supabase
        .from('leads')
        .insert([{
          nome: lead.nome.trim() || 'Visitante',
          telefone: lead.telefone.trim() || '00000000000',
          email: lead.email.trim() || 'no@email.com'
        }])
      
      // 2. Salvar Resultado na tabela 'results' (PLURAL)
      await supabase
        .from('results')
        .insert([{
          mental: parseFloat(altM),
          corpo: parseFloat(altC),
          espirito: parseFloat(altE),
          ideal_mental: mente,
          ideal_corpo: corpo,
          ideal_espirito: espirito,
          created_at: new Date().toISOString()
        }])

    } catch (err) {
      console.error('Erro inesperado:', err)
    } finally {
      setResult(res)
      localStorage.setItem('trianguloMCE_result', JSON.stringify(res))
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setLead({ nome: '', telefone: '', email: '' })
    setShowIntro(true)
    setShowSliders(false)
    localStorage.removeItem('trianguloMCE_result')
  }

  const getInterpretation = (res: ResultData) => {
    const m = Number(res.altM)
    const c = Number(res.altC)
    const e = Number(res.altE)
    
    const diffM = Math.abs(m - res.idealM)
    const diffC = Math.abs(c - res.idealC)
    const diffE = Math.abs(e - res.idealE)
    const maiorDiff = Math.max(diffM, diffC, diffE)

    // 1. Equilíbrio de Alta Performance
    if (maiorDiff <= 1.2 && m > 3 && c > 3 && e > 3) {
      return (
        <div className="space-y-4">
          <p className="font-bold text-emerald-800 text-xl">Perfil: Harmonia Integrativa</p>
          <p>Seu Triângulo MCE revela um estado de **equilíbrio excepcional**. Você consegue transitar entre as demandas mentais, as necessidades físicas e a conexão espiritual com fluidez.</p>
          <p>No INOVARSE, nosso foco para você será a **manutenção preventiva e o refinamento**. Sua base sólida permite tratamentos estéticos que potencializam sua vitalidade natural, focando em longevidade e bem-estar contínuo.</p>
        </div>
      )
    }

    // 2. Foco na Mente (Sobrecarga Mental)
    if (diffM === maiorDiff && m < res.idealM) {
      return (
        <div className="space-y-4">
          <p className="font-bold text-blue-800 text-xl">Perfil: Mente Sobrecarregada</p>
          <p>Seu resultado indica que sua **Mente** está consumindo mais energia do que o ideal, possivelmente gerando estresse ou fadiga cognitiva que se reflete na sua aparência.</p>
          <p>Quando a mente está em desequilíbrio, o cortisol elevado pode afetar a saúde da pele e o brilho do olhar. O Programa Inovarse para você incluirá protocolos que unem **relaxamento profundo e terapias calmantes**, ajudando a silenciar o ruído mental para que sua beleza interna volte a irradiar.</p>
        </div>
      )
    }

    // 3. Foco no Corpo (Desconexão Física)
    if (diffC === maiorDiff && c < res.idealC) {
      return (
        <div className="space-y-4">
          <p className="font-bold text-emerald-800 text-xl">Perfil: Desconexão Corporal</p>
          <p>Sua maior lacuna está no **Corpo**. Isso sugere que suas necessidades físicas — nutrição, movimento e cuidado estético — podem estar em segundo plano.</p>
          <p>O corpo é o templo que sustenta sua jornada. No INOVARSE, focaremos em **protocolos de revitalização física e estética avançada**. Queremos devolver ao seu corpo a energia e o tônus necessários para que ele acompanhe sua mente e seu espírito com vigor e saúde visível.</p>
        </div>
      )
    }

    // 4. Foco no Espírito (Busca por Propósito)
    if (diffE === maiorDiff && e < res.idealE) {
      return (
        <div className="space-y-4">
          <p className="font-bold text-purple-800 text-xl">Perfil: Busca por Essência</p>
          <p>Seu Triângulo mostra uma necessidade de maior conexão com o **Espírito**. Isso não se refere apenas à religiosidade, mas ao seu senso de propósito, paz interior e tempo para si.</p>
          <p>A beleza que não é alimentada pela alma torna-se vazia. Nosso Programa Personalizado incluirá experiências que promovem a **reconexão com sua essência**, utilizando a estética como um portal para o autocuidado sagrado, onde cada procedimento é um ritual de amor próprio.</p>
        </div>
      )
    }

    // 5. Desequilíbrio Generalizado (Necessidade de Resgate)
    return (
      <div className="space-y-4">
        <p className="font-bold text-slate-800 text-xl">Perfil: Transição e Resgate</p>
        <p>Seu Triângulo MCE indica um momento de **transição importante**. Você sente que os três pilares estão desalinhados, o que pode gerar uma sensação de desânimo ou falta de vitalidade.</p>
        <p>Este é o momento ideal para o **Programa de Resgate Inovarse**. Vamos trabalhar passo a passo para realinhar Mente, Corpo e Espírito. Começaremos cuidando do seu exterior para elevar sua autoestima, enquanto criamos o espaço necessário para que seu equilíbrio interno seja restaurado.</p>
      </div>
    )
  }

  if (showIntro) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />
        <div className="relative flex items-center justify-center min-h-screen p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-10 flex justify-center">
              <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-emerald-100 overflow-hidden">
                <img src="/logo_inovarse.jpeg" alt="Inovarse" className="w-56 h-56 object-contain" />
              </div>
            </motion.div>
            <p className="text-3xl font-medium text-emerald-700 mb-10">Estética Integrativa</p>
            <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-8 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              A verdadeira beleza nasce de dentro para fora
            </h1>
            <div className="space-y-6 text-lg text-slate-700 max-w-md mx-auto mb-12">
              <p>Vivemos em um mundo onde a estética muitas vezes se resume a procedimentos pontuais e resultados temporários.</p>
              <p>No <span className="font-semibold text-emerald-700">INOVARSE</span>, acreditamos em algo diferente: uma abordagem completa que cuida de você como um todo — <span className="font-semibold text-emerald-700">Mente, Corpo e Espírito</span>.</p>
              <p>Não queremos apenas melhorar sua aparência. Queremos ajudar você a viver com mais energia, clareza mental, equilíbrio emocional e uma beleza natural que se mantém ao longo do tempo.</p>
              <p className="font-medium text-emerald-800 italic">Este é o começo de uma jornada de cuidado constante e personalizado.</p>
              <p className="font-medium text-emerald-700">Faça o Teste Triângulo MCE agora e descubra seu perfil atual de equilíbrio. A partir dele, construiremos juntos o seu Programa Personalizado Inovarse.</p>
            </div>
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white">
              <p className="text-emerald-800 font-medium mb-6">Para personalizarmos seu contato, preencha abaixo:</p>
              <div className="space-y-5">
                <input type="text" placeholder="Nome completo" value={lead.nome} onChange={e => setLead({ ...lead, nome: e.target.value })} className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500" />
                <input type="tel" placeholder="Telefone (WhatsApp)" value={lead.telefone} onChange={e => setLead({ ...lead, telefone: e.target.value })} className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500" />
                <input type="email" placeholder="E-mail" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })} className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={irParaSliders}
              className="w-full py-7 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-2xl font-bold rounded-3xl shadow-xl transition-all"
            >
              Iniciar o Teste Triângulo MCE
            </motion.button>
            <p className="text-sm text-slate-600 mt-8">Gratuito • Confidencial • Leva apenas 5 minutos</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (showSliders && !result) {
    return (
      <div className="min-h-screen relative overflow-hidden py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
            <motion.div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Triângulo MCE</h1>
              <p className="text-emerald-700 text-lg">Equilíbrio Integral • Inovarse</p>
            </motion.div>
            <motion.section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-10 text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>1. Sua Distribuição Ideal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
                  <label className="block mb-4 font-semibold text-blue-900 text-lg">Mente</label>
                  <input type="range" min={0} max={10} step={0.5} value={mente} onChange={e => setMente(Number(e.target.value))} className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="text-center font-bold text-5xl mt-6 text-blue-600">{mente}</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
                  <label className="block mb-4 font-semibold text-emerald-900 text-lg">Corpo</label>
                  <p className="text-sm text-emerald-700 mb-2">restante: {restante.toFixed(1)}</p>
                  <input type="range" min={0} max={restante} step={0.5} value={corpo} onChange={e => setCorpo(Number(e.target.value))} className="w-full h-3 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                  <div className="text-center font-bold text-5xl mt-6 text-emerald-600">{corpo}</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
                  <label className="block mb-4 font-semibold text-purple-900 text-lg">Espírito</label>
                  <div className="h-3 bg-purple-200 rounded-full overflow-hidden mt-4">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(espirito / 10) * 100}%` }} className="h-full bg-gradient-to-r from-purple-500 to-purple-600" />
                  </div>
                  <div className="text-center font-bold text-5xl text-purple-600 mt-6">{espirito.toFixed(1)}</div>
                </motion.div>
              </div>
            </motion.section>
            <motion.section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-10 text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>2. Preferências Relativas</h2>
              <div className="space-y-12">
                <div className="bg-white p-8 rounded-3xl border border-slate-200">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span className="text-blue-600">Mente</span>
                    <span className="text-emerald-600">Corpo</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={pairedCM.mente} onChange={e => setPairedCM({ mente: Number(e.target.value), corpo: 10 - Number(e.target.value) })} className="w-full h-3 bg-gradient-to-r from-blue-200 via-slate-200 to-emerald-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-lg font-semibold mt-4">
                    <span className="text-blue-600">{pairedCM.mente.toFixed(1)}</span>
                    <span className="text-emerald-600">{pairedCM.corpo.toFixed(1)}</span>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span className="text-emerald-600">Corpo</span>
                    <span className="text-purple-600">Espírito</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={pairedCE.corpo} onChange={e => setPairedCE({ corpo: Number(e.target.value), espirito: 10 - Number(e.target.value) })} className="w-full h-3 bg-gradient-to-r from-emerald-200 via-slate-200 to-purple-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-lg font-semibold mt-4">
                    <span className="text-emerald-600">{pairedCE.corpo.toFixed(1)}</span>
                    <span className="text-purple-600">{pairedCE.espirito.toFixed(1)}</span>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span className="text-blue-600">Mente</span>
                    <span className="text-purple-600">Espírito</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={pairedME.mente} onChange={e => setPairedME({ mente: Number(e.target.value), espirito: 10 - Number(e.target.value) })} className="w-full h-3 bg-gradient-to-r from-blue-200 via-slate-200 to-purple-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-lg font-semibold mt-4">
                    <span className="text-blue-600">{pairedME.mente.toFixed(1)}</span>
                    <span className="text-purple-600">{pairedME.espirito.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </motion.section>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={calcular}
              disabled={loading}
              className="w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-2xl font-bold rounded-3xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculando...' : 'Ver Meu Triângulo MCE'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (result) {
    const whatsappMessage = encodeURIComponent(
      `Olá! Vim do site Inovarse e fiz o Teste Triângulo MCE.\n\n` +
      `📊 Meus resultados:\n` +
      `• Mente: ${result.altM} (ideal ${result.idealM})\n` +
      `• Corpo: ${result.altC} (ideal ${result.idealC})\n` +
      `• Espírito: ${result.altE} (ideal ${result.idealE})\n\n` +
      `Gostaria de agendar uma avaliação para entender melhor meu perfil e montar meu Programa Personalizado Inovarse.`
    )
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${RESULT_BG})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/50 to-white/70" />
        <div className="relative flex items-center justify-center min-h-screen p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl w-full">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>Seu Triângulo MCE</h1>
                  <p className="text-emerald-700 text-lg mt-2">Estética Integrativa • Inovarse</p>
                </div>
                <button onClick={reset} className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline">Fazer novo teste</button>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center mb-12">
                <TriangleVisualization data={result} />
              </motion.div>
              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { label: 'Mente', value: result.altM, ideal: result.idealM, color: 'from-blue-500 to-blue-600', icon: '🧠' },
                  { label: 'Corpo', value: result.altC, ideal: result.idealC, color: 'from-emerald-500 to-emerald-600', icon: '💪' },
                  { label: 'Espírito', value: result.altE, ideal: result.idealE, color: 'from-purple-500 to-purple-600', icon: '✨' }
                ].map(item => (
                  <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white shadow-lg`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-sm font-medium opacity-90">{item.label}</p>
                    <p className="text-4xl font-bold mt-2">{item.value}</p>
                    <p className="text-xs opacity-75 mt-1">ideal: {item.ideal}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 p-8 rounded-3xl mb-10">
                <div className="text-emerald-900 text-lg leading-relaxed">
                  {getInterpretation(result)}
                </div>
              </div>
              <div className="bg-white border border-emerald-200 rounded-3xl p-8 text-center">
                <a href={`https://wa.me/351914845439?text=${whatsappMessage}`} target="_blank" className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-2xl transition-all text-lg">
                  📱 Falar no WhatsApp
                </a>
              </div>
              <button onClick={reset} className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium rounded-2xl transition-all">Fazer Novo Teste</button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}

const TriangleVisualization = ({ data }: { data: ResultData }) => {
  const size = 370
  const centerX = size / 2
  const centerY = size / 2 + 10
  const radius = 152
  const L: Point = { x: centerX - radius * Math.sqrt(3) / 2, y: centerY + radius / 2 }; 
  const R: Point = { x: centerX + radius * Math.sqrt(3) / 2, y: centerY + radius / 2 }; 
  const T: Point = { x: centerX, y: centerY - radius };                               
  const Center: Point = { x: centerX, y: centerY };
  const pM = calculateIsoscelesPoint(data.idealM, data.pairedCM.corpo, data.pairedME.espirito, L, R, Center);
  const pC = calculateIsoscelesPoint(data.idealC, data.pairedCM.mente, data.pairedCE.espirito, L, T, Center);
  const pE = calculateIsoscelesPoint(data.idealE, data.pairedME.mente, data.pairedCE.corpo, R, T, Center);

  return (
    <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-white/70 shadow-2xl">
      <svg width={size} height={size + 80} viewBox={`0 0 ${size} ${size + 80}`} className="drop-shadow-2xl">
        <polygon points={`${T.x},${T.y} ${L.x},${L.y} ${Center.x},${Center.y}`} fill="#a855f7" fillOpacity="0.33" />
        <polygon points={`${T.x},${T.y} ${R.x},${R.y} ${Center.x},${Center.y}`} fill="#10b981" fillOpacity="0.33" />
        <polygon points={`${L.x},${L.y} ${R.x},${R.y} ${Center.x},${Center.y}`} fill="#3b82f6" fillOpacity="0.33" />
        <line x1={Center.x} y1={Center.y} x2={T.x} y2={T.y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1={Center.x} y1={Center.y} x2={L.x} y2={L.y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1={Center.x} y1={Center.y} x2={R.x} y2={R.y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,3" />
        <motion.polygon
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          points={`${pM.x},${pM.y} ${pC.x},${pC.y} ${pE.x},${pE.y}`}
          fill="none"
          stroke="#0f766e"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx={pM.x} cy={pM.y} r="6" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
        <circle cx={pC.x} cy={pC.y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" />
        <circle cx={pE.x} cy={pE.y} r="6" fill="#a855f7" stroke="#fff" strokeWidth="2" />
        <text x={centerX} y={centerY + radius * 0.5 + 24} textAnchor="middle" className="text-[15px] font-bold fill-[#1e40af] tracking-wider">MENTE</text>
        <text x={L.x - 25} y={L.y - 50} textAnchor="middle" transform={`rotate(-60 ${L.x - 25} ${L.y - 50})`} className="text-[15px] font-bold fill-[#166534] tracking-wider">CORPO</text>
        <text x={R.x + 25} y={R.y - 50} textAnchor="middle" transform={`rotate(60 ${R.x + 25} ${R.y - 50})`} className="text-[15px] font-bold fill-[#6b21a8] tracking-wider">ESPÍRITO</text>
      </svg>
      <div className="mt-6 text-xs text-slate-500 font-medium tracking-widest">
        TRIÂNGULO DA HARMONIA • MENTE • CORPO • ESPÍRITO
      </div>
    </div>
  )
}

export default App
