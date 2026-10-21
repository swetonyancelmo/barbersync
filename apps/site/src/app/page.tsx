import { MobileNav } from '@/components/mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  IconArrow,
  IconBell,
  IconCalendar,
  IconChart,
  IconCheck,
  IconMoney,
  IconPhone,
  IconScissors,
  IconStar,
  IconUsers,
} from '@/components/icons';

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
const SIGNUP = `${ADMIN}/login?cadastro=1`;
const LOGIN = `${ADMIN}/login`;

const NAV = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#perguntas', label: 'Perguntas' },
];

// Contêiner padrão das seções
const WRAP = 'mx-auto w-full max-w-[1120px] px-6';
const H2 = 'm-0 mt-2.5 text-[clamp(28px,4vw,40px)] text-ink';

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-11 text-center">
      <span className="font-mono text-xs font-bold tracking-[0.16em] text-pole">{kicker}</span>
      <h2 className={H2}>{title}</h2>
      <div className="barber-rule mx-auto mt-4 w-[60px]" />
      {sub && <p className="mt-4 text-[17px] text-slate">{sub}</p>}
    </div>
  );
}

const FEATURES = [
  {
    Icon: IconCalendar,
    title: 'Agenda do dia',
    desc: 'Veja e confirme os horários de todos os barbeiros numa tela só, com o faturado e os atendimentos do dia sempre à vista.',
  },
  {
    Icon: IconPhone,
    title: 'Clientes agendam sozinhos',
    desc: 'Cada cliente escolhe serviço, barbeiro e horário pelo celular. Você recebe a solicitação e confirma com um toque.',
  },
  {
    Icon: IconStar,
    title: 'Fidelidade automática',
    desc: 'Pontos e níveis Bronze, Prata e Ouro calculados a cada atendimento — sem planilha, sem cartãozinho carimbado.',
  },
  {
    Icon: IconMoney,
    title: 'Controle financeiro',
    desc: 'Registre o pagamento (Pix, cartão ou dinheiro) e acompanhe ticket médio e o que já entrou no caixa.',
  },
  {
    Icon: IconChart,
    title: 'Relatórios e PDF',
    desc: 'Desempenho por dia, semana ou mês, com os melhores clientes e serviços — e exportação em PDF num clique.',
  },
  {
    Icon: IconUsers,
    title: 'Equipe e serviços',
    desc: 'Cadastre barbeiros, o catálogo de serviços com preço e duração, e os horários de funcionamento da barbearia.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Cadastre sua barbearia',
    desc: 'Crie sua conta em segundos — só o nome da barbearia, seu nome, e-mail e senha.',
  },
  {
    n: '2',
    title: 'Configure o essencial',
    desc: 'Adicione serviços, sua equipe e os dias e horários de atendimento.',
  },
  {
    n: '3',
    title: 'Compartilhe e pronto',
    desc: 'Seus clientes passam a agendar sozinhos e você gerencia tudo pelo painel.',
  },
];

const FAQ = [
  {
    q: 'Preciso instalar algum programa?',
    a: 'Não. O BarberSync é 100% online — você acessa pelo navegador, no computador ou no celular. Nada para baixar ou instalar.',
  },
  {
    q: 'Meus clientes precisam baixar um aplicativo?',
    a: 'Não. Eles agendam pelo navegador do celular. Se quiserem, podem adicionar o BarberSync à tela inicial e usar como um app.',
  },
  {
    q: 'Como funcionam os pagamentos?',
    a: 'O pagamento é registrado manualmente por você depois do atendimento (Pix, cartão ou dinheiro). Não há cobrança online nem taxa por transação.',
  },
  {
    q: 'Os clientes são avisados do horário?',
    a: 'Sim. O cliente recebe a confirmação por e-mail e um lembrete automático perto do horário marcado.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ---- Navbar ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-porcelain/90 backdrop-blur-[10px] backdrop-saturate-[1.4]">
        <div className={`${WRAP} flex items-center justify-between gap-5 py-3.5`}>
          <a href="#topo" className="inline-flex items-center gap-[9px] font-display text-[22px] tracking-[0.5px] text-ink">
            <IconScissors size={22} className="text-verd" />
            BarberSync
          </a>
          <nav className="ml-3 hidden flex-1 gap-1.5 md:flex" aria-label="Seções">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-pill px-3.5 py-2 text-[15px] font-semibold text-slate transition-colors hover:bg-tile-2 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href={LOGIN} className="hidden px-1.5 py-2 text-[15px] font-bold text-ink hover:text-pole md:inline">
              Entrar
            </a>
            <Button asChild size="sm" className="hidden h-10 px-[18px] sm:inline-flex">
              <a href={SIGNUP}>Cadastre sua barbearia</a>
            </Button>
            <MobileNav links={NAV} loginHref={LOGIN} signupHref={SIGNUP} />
          </div>
        </div>
      </header>

      <main id="topo">
        {/* ---- Hero ---- */}
        <section className={`${WRAP} grid items-center gap-10 py-12 text-center md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:py-[72px] md:text-left`}>
          <div>
            <span className="plaque mb-[22px] text-[13px]">Sistema para barbearias</span>
            <h1 className="m-0 mb-5 text-[clamp(38px,6vw,60px)] text-ink">
              A sua barbearia organizada,<br />do agendamento ao caixa.
            </h1>
            <p className="mx-auto mb-[30px] max-w-[30em] text-[19px] leading-[1.55] text-slate md:mx-0">
              Agenda, fidelidade, financeiro e relatórios num só lugar. Seus
              clientes agendam sozinhos pelo celular — você controla tudo pelo painel.
            </p>
            <div className="mb-[26px] flex flex-wrap justify-center gap-3.5 md:justify-start">
              <Button asChild size="lg">
                <a href={SIGNUP}>
                  Cadastre sua barbearia <IconArrow size={18} />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#recursos">Ver recursos</a>
              </Button>
            </div>
            <ul className="m-0 flex list-none flex-wrap justify-center gap-x-[22px] gap-y-2 p-0 md:justify-start">
              {['Configure em minutos', 'Sem instalar nada', 'Funciona no celular'].map((t) => (
                <li key={t} className="inline-flex items-center gap-[7px] text-sm font-semibold text-slate">
                  <IconCheck size={16} className="text-ok" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Comanda ilustrativa (elemento de assinatura) */}
          <div className="order-first flex justify-center md:order-none" aria-hidden="true">
            <div className="ticket w-full max-w-[340px] px-6 pb-[22px] pt-[26px] text-left md:rotate-[1.5deg]">
              <div className="mt-1 flex items-center justify-between gap-2.5">
                <span className="display text-xl text-ink">Próximo horário</span>
                <Badge variant="confirm">Confirmado</Badge>
              </div>
              <div className="ticket-perf" />
              {[
                ['Cliente', 'João Pereira'],
                ['Serviço', 'Corte + Barba'],
                ['Barbeiro', 'Rafael'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 py-1.5 text-[15px]">
                  <span className="text-slate">{k}</span>
                  <strong className="text-ink">{v}</strong>
                </div>
              ))}
              <div className="ticket-perf" />
              <div className="flex items-baseline justify-between">
                <span className="mono text-[30px] text-ink">14:30</span>
                <span className="mono text-xl font-bold text-verd">R$ 55,00</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Recursos ---- */}
        <section id="recursos" className={`${WRAP} py-[52px] sm:py-[72px]`}>
          <SectionHead
            kicker="RECURSOS"
            title="Tudo que a barbearia precisa"
            sub="Deixe o caderno de agendamentos e o WhatsApp bagunçado para trás."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, desc }) => (
              <Card key={title}>
                <CardHeader className="gap-0 px-6 pb-0 pt-7">
                  <span className="mb-4 inline-flex size-[46px] items-center justify-center rounded-input bg-verd/[0.12] text-verd">
                    <Icon size={22} />
                  </span>
                  <CardTitle className="mb-2 text-xl leading-[1.05] text-ink">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-7">
                  <CardDescription className="text-[15px] leading-[1.55]">{desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- Como funciona ---- */}
        <section id="como-funciona" className="border-y border-line bg-tile py-[52px] sm:py-[72px]">
          <div className={WRAP}>
            <SectionHead kicker="COMO FUNCIONA" title="No ar em três passos" />
            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="p-2 text-center">
                  <span className="display mb-4 inline-flex size-[54px] items-center justify-center rounded-full bg-pine text-[26px] text-on-enamel shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                    {n}
                  </span>
                  <h3 className="m-0 mb-2 text-xl text-ink">{title}</h3>
                  <p className="m-0 text-slate">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Destaque app do cliente ---- */}
        <section className={`${WRAP} py-[52px] sm:py-[72px]`}>
          <Card className="grid items-center gap-10 px-6 py-8 shadow-raised md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-11">
            <div>
              <span className="inline-flex size-[46px] items-center justify-center rounded-input bg-verd/[0.12] text-verd">
                <IconBell size={22} />
              </span>
              <h2 className={`${H2} mt-3`}>Seus clientes na palma da mão</h2>
              <p className="mb-6 mt-3.5 text-base leading-[1.6] text-slate">
                O cliente escolhe serviço, barbeiro e horário pelo celular, acompanha
                a fidelidade e o histórico, e recebe confirmação e lembrete
                automáticos. Menos falta, menos telefone tocando.
              </p>
              <Button asChild>
                <a href={SIGNUP}>
                  Começar agora <IconArrow size={18} />
                </a>
              </Button>
            </div>
            <ul className="m-0 grid list-none gap-3.5 p-0">
              {[
                'Agendamento 24h, sem depender de mensagem',
                'Confirmação e lembrete por e-mail',
                'Programa de fidelidade com níveis',
                'Instalável na tela inicial do celular',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-base font-semibold text-ink">
                  <IconCheck size={18} className="mt-0.5 shrink-0 text-ok" /> {t}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ---- FAQ ---- */}
        <section id="perguntas" className="border-y border-line bg-tile py-[52px] sm:py-[72px]">
          <div className={WRAP}>
            <SectionHead kicker="PERGUNTAS FREQUENTES" title="Ainda em dúvida?" />
            {/*
              SEO: forceMount mantém as respostas no HTML (Radix desmonta o conteúdo fechado
              por padrão); fechado, o Radix aplica o atributo `hidden`, então ficam ocultas
              visualmente mas presentes no DOM para crawlers/leitores.
            */}
            <Accordion type="single" collapsible className="mx-auto grid max-w-[760px] gap-3.5">
              {FAQ.map(({ q, a }, i) => (
                <AccordionItem
                  key={q}
                  value={`faq-${i}`}
                  className="rounded-card border bg-tile px-6 shadow-hairline"
                >
                  <AccordionTrigger className="py-5 text-[17px] text-ink">{q}</AccordionTrigger>
                  <AccordionContent forceMount className="text-[15px] leading-[1.6]">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ---- CTA final ---- */}
        <section className="relative bg-pine px-6 py-[72px] text-center text-on-enamel">
          <div className="absolute inset-x-0 top-0 h-[5px]" style={{ background: 'var(--pole-stripe)' }} aria-hidden="true" />
          <h2 className="display m-0 text-[clamp(28px,4vw,42px)] text-on-enamel">
            Pronto para organizar sua barbearia?
          </h2>
          <p className="mb-[30px] mt-3.5 text-lg text-on-enamel/80">
            Cadastre-se e comece a receber agendamentos hoje.
          </p>
          <Button asChild size="lg">
            <a href={SIGNUP}>
              Cadastre sua barbearia <IconArrow size={18} />
            </a>
          </Button>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="bg-porcelain">
        <Separator />
        <div className={`${WRAP} flex flex-col items-center gap-4 py-7 text-center md:flex-row md:gap-5 md:text-left`}>
          <span className="inline-flex items-center gap-[9px] font-display text-[22px] tracking-[0.5px] text-ink">
            <IconScissors size={20} className="text-verd" />
            BarberSync
          </span>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-3.5 md:flex-1 md:justify-start md:gap-[18px]" aria-label="Rodapé">
            {[
              ['#recursos', 'Recursos'],
              ['#como-funciona', 'Como funciona'],
              [LOGIN, 'Entrar'],
              [SIGNUP, 'Cadastrar'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-[15px] font-semibold text-slate hover:text-pole">
                {label}
              </a>
            ))}
          </nav>
          <span className="text-sm text-slate">© {new Date().getFullYear()} BarberSync</span>
        </div>
      </footer>
    </>
  );
}
