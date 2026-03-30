import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from './lib/supabase'

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-hero-background-bn8BAEpnMXQuXzmBSzj6Px.webp'
const RESULT_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-result-background-RLC42rJSQoSM7RjPvU6tyv.webp'

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
}

function App() {
  const [mente, setMente] = useState(4)
  const [corpo, setCorpo] = useState(3)
  const restante = Math.max(0, 10 - mente)
  const espirito = Math.max(0, restante - corpo)

  const [pairedCM, setPairedCM] = useState({ mente: 5, corpo: 5 })
  const [pairedCE, setPairedCE] = useState({ corpo: 5, espirito: 5 })
  const [pairedME, setPairedME] = useState({ mente: 5, espirito: 5 })

  const [result, setResult] = useState<ResultData | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // Limpa resultado antigo ao carregar (para forçar mostrar o formulário)
  useEffect(() => {
    localStorage.removeItem('trianguloMCE_result')
    setResult(null)
  }, [])

  const handleMenteChange = (value: number) => {
    setMente(value)
    if (value > 10 - corpo) setCorpo(Math.max(0, 10 - value))
  }

  const adjustPaired = (pair: string, side: string, value: number) => {
    const comp = 10 - value
    if (pair === 'CM') {
      setPairedCM(side === 'mente' ? { mente: value, corpo: comp } : { mente: comp, corpo: value })
    }
    if (pair === 'CE') {
      setPairedCE(side === 'corpo' ? { corpo: value, espirito: comp } : { corpo: comp, espirito: value })
    }
    if (pair === 'ME') {
      setPairedME(side === 'mente' ? { mente: value, espirito: comp } : { mente: comp, espirito: value })
    }
  }

  const calcular = async () => {
    setLoading(true)
    setStatus('Gerando seu Triângulo MCE...')

    const altM = ((mente + pairedCM.mente * 0.5 + pairedME.mente * 0.5) / 2).toFixed(1)
    const altC = ((corpo + pairedCM.corpo * 0.5 + pairedCE.corpo * 0.5) / 2).toFixed(1)
    const altE = ((espirito + pairedCE.espirito * 0.5 + pairedME.espirito * 0.5) / 2).toFixed(1)

    const deslocM = ((pairedCM.mente - pairedCM.corpo) + (pairedME.mente - pairedME.espirito)) / 2
    const deslocC = ((pairedCM.corpo - pairedCM.mente) + (pairedCE.corpo - pairedCE.espirito)) / 2
    const deslocE = ((pairedCE.espirito - pairedCE.corpo) + (pairedME.espirito - pairedME.mente)) / 2

    const res: ResultData = {
      altM,
      altC,
      altE,
      deslocM: deslocM.toFixed(1),
      deslocC: deslocC.toFixed(1),
      deslocE: deslocE.toFixed(1),
      idealM: mente,
      idealC: corpo,
      idealE: espirito
    }

    try {
      await supabase
        .from('results')
        .insert({
          mental: parseFloat(altM),
          corpo: parseFloat(altC),
          espirito: parseFloat(altE),
          ideal_mental: mente,
          ideal_corpo: corpo,
          ideal_espirito: espirito,
        }, { returning: 'minimal' })

      setResult(res)
      localStorage.setItem('trianguloMCE_result', JSON.stringify(res))
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setResult(res)
      localStorage.setItem('trianguloMCE_result', JSON.stringify(res))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setStatus('')
    localStorage.removeItem('trianguloMCE_result')
    // Força voltar para o formulário
    setShowIntro(true)
  }

  const getInterpretation = (res: ResultData) => {
    const diffM = Math.abs(Number(res.altM) - res.idealM)
    const diffC = Math.abs(Number(res.altC) - res.idealC)
    const diffE = Math.abs(Number(res.altE) - res.idealE)
    const maior = Math.max(diffM, diffC, diffE)

    if (maior <= 1.5) {
      return "Seu Triângulo MCE revela um excelente equilíbrio entre Mente, Corpo e Espírito. Você já possui uma base sólida. Na avaliação presencial vamos refinar ainda mais esse equilíbrio e potencializar sua vitalidade e beleza natural."
    }
    if (diffC === maior) {
      return "Sua maior lacuna está no **Corpo**. Isso é extremamente comum e indica que, apesar de cuidar da aparência, sua energia vital e saúde física não estão alinhadas com o que você realmente deseja. Na avaliação presencial, além de analisarmos seu Triângulo MCE, faremos o exame de Bio Ressonância Quântica para identificar exatamente quais protocolos vão trazer mais resultado para você."
    }
    if (diffM === maior) {
      return "Sua maior lacuna está na **Mente**. Mesmo que você se cuide fisicamente, a sobrecarga mental e emocional pode estar sabotando seus resultados estéticos e seu bem-estar. Na avaliação vamos mapear isso com profundidade e montar um programa que integra clareza mental, redução de estresse e beleza visível."
    }
    return "Sua maior lacuna está no **Espírito**. Muitas pessoas desenvolvem Corpo e Mente, mas deixam o Espírito em segundo plano. Isso cria uma beleza incompleta. Na avaliação presencial vamos entender sua conexão interna e construir um programa realmente transformador, que une estética e propósito."
  }

  // ==================== TELA DE INTRODUÇÃO ====================
  if (showIntro) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />

        <div className="relative flex items-center justify-center min-h-screen p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-10 flex justify-center">
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
              <p>No <span className="font-semibold text-emerald-700">Inovarse</span>, acreditamos em algo diferente: uma abordagem completa que cuida de você como um todo — <span className="font-semibold text-emerald-700">Mente, Corpo e Espírito</span>.</p>
              <p>Mesmo quando desenvolvemos as três áreas de forma espontânea, sem uma visão holística integrada, é fácil criar distorções que limitam nossos resultados e nosso bem-estar.</p>
              <p className="font-medium text-emerald-800 italic">Este teste é o primeiro passo para uma jornada de cuidado constante, personalizado e verdadeiramente transformador.</p>
            </div>

            <button 
              onClick={() => setShowIntro(false)}
              className="w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xl font-semibold rounded-3xl shadow-xl transition-all"
            >
              Iniciar o Teste Triângulo MCE
            </button>

            <p className="text-sm text-slate-600 mt-8">Gratuito • Confidencial • Leva apenas 5 minutos</p>
          </motion.div>
        </div>
      </div>
    )
  }

  // ==================== TELA DE RESULTADO COM WHATSAPP ====================
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Seu Triângulo MCE
                  </h1>
                  <p className="text-emerald-700 text-lg mt-2">Estética Integrativa • Inovarse</p>
                </div>
                <button onClick={reset} className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline">
                  Fazer novo teste
                </button>
              </div>

              {/* Triângulo SVG */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center mb-12">
                <svg width="420" height="380" viewBox="0 0 320 290" className="mx-auto drop-shadow-lg">
                  <polygon points="160,40 40,260 280,260" fill="#f0fdf4" stroke="#d1fae5" strokeWidth="3" />
                  <defs>
                    <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                  <polygon 
                    points={`160,95 ${160 + Number(result.deslocC)*16},245 ${160 - Number(result.deslocM)*13},245`} 
                    fill="url(#triangleGradient)" 
                    opacity="0.85" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeLinejoin="round"
                  />
                  <circle cx="160" cy="95" r="14" fill="#3b82f6" />
                  <circle cx={160 + Number(result.deslocC)*16} cy="245" r="14" fill="#10b981" />
                  <circle cx={160 - Number(result.deslocM)*13} cy="245" r="14" fill="#a855f7" />

                  <text x="160" y="103" fill="white" fontSize="22" fontWeight="700" textAnchor="middle">M</text>
                  <text x={160 + Number(result.deslocC)*16} y="253" fill="white" fontSize="22" fontWeight="700" textAnchor="middle">C</text>
                  <text x={160 - Number(result.deslocM)*13} y="253" fill="white" fontSize="22" fontWeight="700" textAnchor="middle">E</text>
                </svg>
              </motion.div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { label: 'Mente', value: result.altM, ideal: result.idealM, color: 'from-blue-500 to-blue-600', icon: '🧠' },
                  { label: 'Corpo', value: result.altC, ideal: result.idealC, color: 'from-emerald-500 to-emerald-600', icon: '💪' },
                  { label: 'Espírito', value: result.altE, ideal: result.idealE, color: 'from-purple-500 to-purple-600', icon: '✨' }
                ].map((item) => (
                  <motion.div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white shadow-lg`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-sm font-medium opacity-90">{item.label}</p>
                    <p className="text-4xl font-bold mt-2">{item.value}</p>
                    <p className="text-xs opacity-75 mt-1">ideal: {item.ideal}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 p-8 rounded-3xl mb-10">
                <p className="text-emerald-900 text-lg leading-relaxed">
                  {getInterpretation(result)}
                </p>
              </div>

              {/* WhatsApp com dados */}
              <div className="bg-white border border-emerald-200 rounded-3xl p-8 text-center">
                <p className="text-slate-700 text-lg mb-6">
                  Este diagnóstico é apenas o ponto de partida.<br />
                  <strong>Agende sua avaliação</strong> para aprofundarmos com Bio Ressonância Quântica.
                </p>

                <a 
                  href={`https://wa.me/351914845439?text=${whatsappMessage}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-2xl transition-all text-lg"
                >
                  📱 Falar no WhatsApp
                </a>
              </div>

              <button onClick={reset} className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium rounded-2xl transition-all">
                Fazer Novo Teste
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ==================== FORMULÁRIO (Sliders) ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
          <motion.div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Triângulo MCE
            </h1>
            <p className="text-emerald-700 text-lg">Equilíbrio Integral • Inovarse</p>
          </motion.div>

          {/* Seção 1 - Distribuição Ideal */}
          <motion.section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10 text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              1. Sua Distribuição Ideal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
                <label className="block mb-4 font-semibold text-blue-900 text-lg">Mente</label>
                <input type="range" min={0} max={10} step={0.5} value={mente} onChange={e => handleMenteChange(Number(e.target.value))} className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
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

          {/* Seção 2 - Preferências Relativas */}
          <motion.section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10 text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              2. Preferências Relativas
            </h2>
            <div className="space-y-10">
              <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-8 border-2 border-blue-200 shadow-md">
                <p className="text-center font-semibold text-slate-800 mb-6 text-lg">Mente × Corpo</p>
                <input type="range" min={0} max={10} step={0.5} value={pairedCM.mente} onChange={e => adjustPaired('CM', 'mente', Number(e.target.value))} className="w-full h-3 bg-gradient-to-r from-blue-200 to-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <div className="flex justify-between mt-4 text-lg font-bold">
                  <span className="text-blue-600">{pairedCM.mente}</span>
                  <span className="text-emerald-600">{pairedCM.corpo}</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-r from-emerald-50 to-purple-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-md">
                <p className="text-center font-semibold text-slate-800 mb-6 text-lg">Corpo × Espírito</p>
                <input type="range" min={0} max={10} step={0.5} value={pairedCE.corpo} onChange={e => adjustPaired('CE', 'corpo', Number(e.target.value))} className="w-full h-3 bg-gradient-to-r from-emerald-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <div className="flex justify-between mt-4 text-lg font-bold">
                  <span className="text-emerald-600">{pairedCE.corpo}</span>
                  <span className="text-purple-600">{pairedCE.espirito}</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-md">
                <p className="text-center font-semibold text-slate-800 mb-6 text-lg">Mente × Espírito</p>
                <input type="range" min={0} max={10} step={0.5} value={pairedME.mente} onChange={e => adjustPaired('ME', 'mente', Number(e.target.value))} className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <div className="flex justify-between mt-4 text-lg font-bold">
                  <span className="text-blue-600">{pairedME.mente}</span>
                  <span className="text-purple-600">{pairedME.espirito}</span>
                </div>
              </motion.div>
            </div>
          </motion.section>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={calcular}
            disabled={loading}
            className="w-full py-6 px-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-400 disabled:to-emerald-500 text-white text-xl font-bold rounded-2xl shadow-xl transition-all"
          >
            {loading ? 'Gerando seu Triângulo...' : 'Gerar Meu Triângulo MCE'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default App
