import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { supabase } from "./lib/supabase"

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-hero-background.webp"
const RESULT_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029287297/oB8kVE32CcVmCbr6pyHqsc/inovarse-result-background.webp"

interface LeadData {
  id?: string
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

interface Point {
  x: number
  y: number
}

const calculateIsoscelesPoint = (
  value: number,
  balanceA: number,
  balanceB: number,
  vBase1: Point,
  vBase2: Point,
  vTip: Point
): Point => {
  const t = value / 10
  const midBase: Point = {
    x: (vBase1.x + vBase2.x) / 2,
    y: (vBase1.y + vBase2.y) / 2,
  }
  const pHeight: Point = {
    x: midBase.x + t * (vTip.x - midBase.x),
    y: midBase.y + t * (vTip.y - midBase.y),
  }
  const widthVector = {
    x: (vBase2.x - vBase1.x) * (1 - t),
    y: (vBase2.y - vBase1.y) * (1 - t),
  }
  const balanceFactor = (balanceB - balanceA) / 10
  return {
    x: pHeight.x + (balanceFactor * widthVector.x) / 2,
    y: pHeight.y + (balanceFactor * widthVector.y) / 2,
  }
}

function App() {
  const [leads, setLead] = useState<LeadData>({
    nome: "",
    telefone: "",
    email: "",
  })
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
      altM,
      altC,
      altE,
      deslocM: deslocM.toFixed(1),
      deslocC: deslocC.toFixed(1),
      deslocE: deslocE.toFixed(1),
      idealM: mente,
      idealC: corpo,
      idealE: espirito,
      pairedCM,
      pairedCE,
      pairedME,
    }

    try {
      const leadId = crypto.randomUUID()

      const { error: leadsError } = await supabase.from("leads").insert([
        {
          id: leadId,
          nome: leads.nome.trim() || "Visitante",
          telefone: leads.telefone.trim() || "00000000000",
          email: leads.email.trim() || "no@email.com",
        },
      ])

      if (leadsError) {
        console.error("Erro ao salvar na tabela leads:", leadsError.message)
      }

      const { error: resultsError } = await supabase.from("results").insert([
        {
          lead_id: leadId,
          mental: parseFloat(altM),
          corpo: parseFloat(altC),
          espirito: parseFloat(altE),
          ideal_mental: mente,
          ideal_corpo: corpo,
          ideal_espirito: espirito,
          created_at: new Date().toISOString(),
        },
      ])

      if (resultsError) {
        console.error("Erro ao salvar na tabela results:", resultsError.message)
      }
    } catch (err) {
      console.error("Erro inesperado no salvamento:", err)
    } finally {
      setResult(res)
      localStorage.setItem("trianguloMCE_result", JSON.stringify(res))
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setLead({ nome: "", telefone: "", email: "" })
    setShowIntro(true)
    setShowSliders(false)
    localStorage.removeItem("trianguloMCE_result")
  }

  const getInterpretation = (res: ResultData) => {
    const m = Number(res.altM)
    const c = Number(res.altC)
    const e = Number(res.altE)

    const diffM = Math.abs(m - res.idealM)
    const diffC = Math.abs(c - res.idealC)
    const diffE = Math.abs(e - res.idealE)
    const maiorDiff = Math.max(diffM, diffC, diffE)

    if (maiorDiff <= 1.2 && m > 3 && c > 3 && e > 3) {
      return (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Perfil: Harmonia Integrativa
          </p>
          <p>
            Seu Triângulo MCE revela um estado de equilíbrio excepcional. Você consegue
            transitar entre as demandas mentais, as necessidades físicas e a conexão
            espiritual com fluidez.
          </p>
          <p>
            No INOVARSE, nosso foco para você será a manutenção preventiva e o refinamento.
            Sua base sólida permite tratamentos estéticos que potencializam sua vitalidade
            natural, focando em longevidade e bem-estar contínuo.
          </p>
        </div>
      )
    }

    if (diffM === maiorDiff) {
      return (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
            Perfil: Mente Sobrecarregada
          </p>
          <p>
            Seu resultado indica que sua mente está consumindo mais energia do que o ideal,
            possivelmente gerando estresse ou fadiga cognitiva que se reflete na sua aparência.
          </p>
          <p>
            Quando a mente está em desequilíbrio, o cortisol elevado pode afetar a saúde da
            pele e o brilho do olhar. O Programa Inovarse para você incluirá protocolos que
            unem relaxamento profundo e terapias calmantes.
          </p>
        </div>
      )
    }

    if (diffC === maiorDiff) {
      return (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Perfil: Desconexão Corporal
          </p>
          <p>
            Sua maior lacuna está no corpo. Isso sugere que suas necessidades físicas —
            nutrição, movimento e cuidado estético — podem estar em segundo plano.
          </p>
          <p>
            No INOVARSE, focaremos em protocolos de revitalização física e estética
            avançada. Queremos devolver ao seu corpo a energia e o tônus necessários.
          </p>
        </div>
      )
    }

    if (diffE === maiorDiff) {
      return (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">
            Perfil: Busca por Essência
          </p>
          <p>
            Seu Triângulo mostra uma necessidade de maior conexão com o espírito. Isso não
            se refere apenas à religiosidade, mas ao seu senso de propósito, paz interior e
            tempo para si.
          </p>
          <p>
            A beleza que não é alimentada pela alma torna-se vazia. Nosso Programa
            Personalizado incluirá experiências que promovem a reconexão com sua essência.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
          Perfil: Transição e Resgate
        </p>
        <p>
          Seu Triângulo MCE indica um momento de transição importante. Você sente que os
          três pilares estão desalinhados, o que pode gerar uma sensação de desânimo ou
          falta de vitalidade.
        </p>
        <p>
          Este é o momento ideal para o Programa de Resgate Inovarse. Vamos trabalhar passo
          a passo para realinhar Mente, Corpo e Espírito.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_18px_40px_-18px_rgba(13,148,136,0.7)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgba(13,148,136,0.82)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"

  if (showIntro) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/68 via-white/72 to-white/88" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.10),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.10),transparent_25%)]" />

        <div className="relative flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="w-full max-w-3xl text-center"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-8 flex justify-center"
            >
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/90 shadow-[0_26px_60px_-24px_rgba(15,23,42,0.4)] backdrop-blur-xl md:h-52 md:w-52">
                <img
                  src="/logo_inovarse.jpeg"
                  alt="Inovarse"
                  className="h-36 w-36 object-contain md:h-44 md:w-44"
                />
              </div>
            </motion.div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Estética Integrativa
            </div>

            <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.04em] text-slate-900 md:text-6xl">
              A verdadeira beleza nasce de dentro para fora
            </h1>

            <div className="mx-auto mt-6 max-w-xl space-y-4 text-[15px] leading-relaxed text-slate-700 md:text-[16px]">
              <p>
                Vivemos em um mundo onde a estética muitas vezes se resume a procedimentos
                pontuais e resultados temporários.
              </p>
              <p>
                No <span className="font-semibold text-emerald-700">INOVARSE</span>, acreditamos
                em algo diferente: uma abordagem completa que cuida de você como um todo —
                <span className="font-semibold text-emerald-700"> mente, corpo e espírito</span>.
              </p>
              <p>
                Não queremos apenas melhorar sua aparência. Queremos ajudar você a viver com
                mais energia, clareza mental, equilíbrio emocional e uma beleza natural que se
                mantém ao longo do tempo.
              </p>
              <p className="font-medium text-emerald-800">
                Descubra seu Triângulo MCE e entenda qual é o seu caminho para a beleza integral.
              </p>
            </div>

            <div className="mx-auto mt-8 rounded-[2rem] border border-white/70 bg-white/82 p-6 text-left shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl md:p-8">
              <p className="mb-5 text-sm font-medium text-slate-700">
                Para personalizarmos seu contato, preencha abaixo:
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={leads.nome}
                  onChange={(e) => setLead({ ...leads, nome: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="tel"
                  placeholder="Telefone (WhatsApp)"
                  value={leads.telefone}
                  onChange={(e) => setLead({ ...leads, telefone: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={leads.email}
                  onChange={(e) => setLead({ ...leads, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={irParaSliders}
              className={`${primaryButtonClass} mt-6 w-full py-3.5 text-[15px] md:text-base`}
            >
              Iniciar o Teste Triângulo MCE
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <p className="mt-5 text-xs text-slate-600 md:text-sm">
              Gratuito • Confidencial • Leva apenas 5 minutos
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (showSliders && !result) {
    return (
      <div className="min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_26px_80px_-34px_rgba(15,23,42,0.34)] backdrop-blur-2xl md:p-10"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Triângulo MCE
                </p>
                <h1 className="mt-2 font-display text-4xl tracking-[-0.04em] text-slate-900 md:text-5xl">
                  Equilíbrio Integral
                </h1>
              </div>
              <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800 md:block">
                Inovarse • avaliação guiada
              </div>
            </div>

            <section className="mb-10">
              <h2 className="mb-6 text-center font-display text-2xl tracking-[-0.03em] text-slate-800 md:text-3xl">
                1. Sua Distribuição Ideal
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="rounded-[1.75rem] border border-blue-200/70 bg-gradient-to-br from-blue-50 to-white p-6 shadow-soft"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-800">
                      Mente
                    </label>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {mente.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={mente}
                    onChange={(e) => setMente(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-600"
                  />
                  <div className="mt-5 text-center text-4xl font-semibold tracking-[-0.04em] text-blue-700">
                    {mente}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="rounded-[1.75rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
                      Corpo
                    </label>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {corpo.toFixed(1)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-emerald-700">restante: {restante.toFixed(1)}</p>
                  <input
                    type="range"
                    min={0}
                    max={restante}
                    step={0.5}
                    value={corpo}
                    onChange={(e) => setCorpo(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-600"
                  />
                  <div className="mt-5 text-center text-4xl font-semibold tracking-[-0.04em] text-emerald-700">
                    {corpo}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="rounded-[1.75rem] border border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-6 shadow-soft"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-800">
                      Espírito
                    </label>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {espirito.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(espirito / 10) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
                    />
                  </div>
                  <div className="mt-5 text-center text-4xl font-semibold tracking-[-0.04em] text-violet-700">
                    {espirito.toFixed(1)}
                  </div>
                </motion.div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-6 text-center font-display text-2xl tracking-[-0.03em] text-slate-800 md:text-3xl">
                2. Preferências Relativas
              </h2>

              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em]">
                    <span className="text-blue-700">Mente</span>
                    <span className="text-emerald-700">Corpo</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={pairedCM.mente}
                    onChange={(e) =>
                      setPairedCM({
                        mente: Number(e.target.value),
                        corpo: 10 - Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer accent-emerald-600"
                  />
                  <div className="mt-3 flex justify-between text-sm font-semibold text-slate-700">
                    <span>{pairedCM.mente.toFixed(1)}</span>
                    <span>{pairedCM.corpo.toFixed(1)}</span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em]">
                    <span className="text-emerald-700">Corpo</span>
                    <span className="text-violet-700">Espírito</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={pairedCE.corpo}
                    onChange={(e) =>
                      setPairedCE({
                        corpo: Number(e.target.value),
                        espirito: 10 - Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer accent-violet-600"
                  />
                  <div className="mt-3 flex justify-between text-sm font-semibold text-slate-700">
                    <span>{pairedCE.corpo.toFixed(1)}</span>
                    <span>{pairedCE.espirito.toFixed(1)}</span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em]">
                    <span className="text-blue-700">Mente</span>
                    <span className="text-violet-700">Espírito</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={pairedME.mente}
                    onChange={(e) =>
                      setPairedME({
                        mente: Number(e.target.value),
                        espirito: 10 - Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer accent-blue-600"
                  />
                  <div className="mt-3 flex justify-between text-sm font-semibold text-slate-700">
                    <span>{pairedME.mente.toFixed(1)}</span>
                    <span>{pairedME.espirito.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </section>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={calcular}
              disabled={loading}
              className={`${primaryButtonClass} w-full py-3.5 text-[15px] md:text-base`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  Ver Meu Triângulo MCE
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${RESULT_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/72 to-white/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.08),transparent_24%)]" />

        <div className="relative flex min-h-screen items-center justify-center px-4 py-8 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="w-full max-w-5xl"
          >
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.38)] backdrop-blur-2xl md:p-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Resultado
                  </p>
                  <h1 className="mt-2 font-display text-4xl tracking-[-0.04em] text-slate-900 md:text-5xl">
                    Seu Triângulo MCE
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 md:text-[15px]">
                    Estética Integrativa • Inovarse
                  </p>
                </div>

                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Fazer novo teste
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="mb-8 flex justify-center"
              >
                <TriangleVisualization data={result} />
              </motion.div>

              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: "Mente", value: result.altM, ideal: result.idealM, icon: "🧠", color: "from-blue-600 to-cyan-600" },
                  { label: "Corpo", value: result.altC, ideal: result.idealC, icon: "💪", color: "from-emerald-600 to-teal-600" },
                  { label: "Espírito", value: result.altE, ideal: result.idealE, icon: "✨", color: "from-violet-600 to-fuchsia-600" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-[1.75rem] bg-gradient-to-br ${item.color} p-5 text-white shadow-[0_20px_50px_-26px_rgba(15,23,42,0.45)]`}
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-85">
                      {item.label}
                    </p>
                    <p className="mt-1 text-4xl font-semibold tracking-[-0.05em]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[11px] opacity-75">ideal: {item.ideal}</p>
                  </div>
                ))}
              </div>

              <div className="mb-8 rounded-[1.75rem] border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-white p-6 shadow-soft md:p-8">
                <div className="text-slate-800">{getInterpretation(result)}</div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 text-center shadow-soft">
                <a
                  href={`https://wa.me/351914845439?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(22,163,74,0.72)] transition hover:-translate-y-0.5 hover:bg-green-700"
                >
                  📱 Falar no WhatsApp
                </a>
              </div>

              <button
                onClick={reset}
                className="mt-4 w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Fazer Novo Teste
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}

const TriangleVisualization = ({ data }: { data: ResultData }) => {
  const size = 380
  const centerX = size / 2
  const centerY = size / 2 + 10
  const radius = 152

  const L: Point = { x: centerX - (radius * Math.sqrt(3)) / 2, y: centerY + radius / 2 }
  const R: Point = { x: centerX + (radius * Math.sqrt(3)) / 2, y: centerY + radius / 2 }
  const T: Point = { x: centerX, y: centerY - radius }
  const Center: Point = { x: centerX, y: centerY }

  const pM = calculateIsoscelesPoint(
    data.idealM,
    data.pairedCM.corpo,
    data.pairedME.espirito,
    L,
    R,
    Center
  )
  const pC = calculateIsoscelesPoint(
    data.idealC,
    data.pairedCM.mente,
    data.pairedCE.espirito,
    L,
    T,
    Center
  )
  const pE = calculateIsoscelesPoint(
    data.idealE,
    data.pairedME.mente,
    data.pairedCE.corpo,
    R,
    T,
    Center
  )

  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 p-4 shadow-[0_26px_80px_-34px_rgba(15,23,42,0.4)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.10),transparent_30%)]" />
      <div className="relative">
        <svg
          width={size}
          height={size + 86}
          viewBox={`0 0 ${size} ${size + 86}`}
          className="drop-shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
        >
          <defs>
            <linearGradient id="sectorM" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.46" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="sectorC" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.44" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="sectorE" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="outlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          <polygon points={`${T.x},${T.y} ${L.x},${L.y} ${Center.x},${Center.y}`} fill="url(#sectorE)" />
          <polygon points={`${T.x},${T.y} ${R.x},${R.y} ${Center.x},${Center.y}`} fill="url(#sectorC)" />
          <polygon points={`${L.x},${L.y} ${R.x},${R.y} ${Center.x},${Center.y}`} fill="url(#sectorM)" />

          <line
            x1={Center.x}
            y1={Center.y}
            x2={T.x}
            y2={T.y}
            stroke="#dbeafe"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
          <line
            x1={Center.x}
            y1={Center.y}
            x2={L.x}
            y2={L.y}
            stroke="#dcfce7"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
          <line
            x1={Center.x}
            y1={Center.y}
            x2={R.x}
            y2={R.y}
            stroke="#f3e8ff"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />

          <motion.polygon
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, strokeDashoffset: [0, -40] }}
            transition={{ duration: 1.3, ease: "easeOut" }}
            points={`${pM.x},${pM.y} ${pC.x},${pC.y} ${pE.x},${pE.y}`}
            fill="none"
            stroke="url(#outlineGrad)"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="10 10"
            style={{
              filter: "drop-shadow(0 0 10px rgba(16,185,129,0.25))",
            }}
          />

          <motion.circle
            cx={pM.x}
            cy={pM.y}
            r="6.5"
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth="2.5"
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx={pC.x}
            cy={pC.y}
            r="6.5"
            fill="#10b981"
            stroke="#fff"
            strokeWidth="2.5"
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          />
          <motion.circle
            cx={pE.x}
            cy={pE.y}
            r="6.5"
            fill="#a855f7"
            stroke="#fff"
            strokeWidth="2.5"
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />

          <text
            x={centerX}
            y={centerY + radius * 0.5 + 24}
            textAnchor="middle"
            className="text-[14px] font-bold fill-[#1d4ed8] tracking-[0.28em]"
          >
            MENTE
          </text>
          <text
            x={L.x - 28}
            y={L.y - 75}
            textAnchor="middle"
            transform={`rotate(-60 ${L.x - 28} ${L.y - 155})`}
            className="text-[14px] font-bold fill-[#047857] tracking-[0.28em]"
          >
            CORPO
          </text>
          <text
            x={R.x + 28}
            y={R.y - 70}
            textAnchor="middle"
            transform={`rotate(60 ${R.x + 28} ${R.y - 155})`}
            className="text-[14px] font-bold fill-[#7c3aed] tracking-[0.28em]"
          >
            ESPÍRITO
          </text>
        </svg>

        <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Triângulo da Harmonia • Mente • Corpo • Espírito
        </div>
      </div>
    </motion.div>
  )
}

export default App
