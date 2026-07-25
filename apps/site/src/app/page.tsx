import { ThemeToggle } from '@/components/theme-toggle';
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
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#topo" className="lp-brand display">
            <IconScissors size={22} />
            BarberSync
          </a>
          <nav className="lp-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#perguntas">Perguntas</a>
          </nav>
          <div className="lp-nav-actions">
            <ThemeToggle />
            <a href={LOGIN} className="lp-nav-login">Entrar</a>
            <a href={SIGNUP} className="btn-primary lp-nav-cta">Cadastre sua barbearia</a>
          </div>
        </div>
      </header>

      <main id="topo">
        {/* ---- Hero ---- */}
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="plaque lp-eyebrow">Sistema para barbearias</span>
            <h1 className="lp-h1">
              A sua barbearia organizada,<br />do agendamento ao caixa.
            </h1>
            <p className="lp-lead">
              Agenda, fidelidade, financeiro e relatórios num só lugar. Seus
              clientes agendam sozinhos pelo celular — você controla tudo pelo painel.
            </p>
            <div className="lp-hero-cta">
              <a href={SIGNUP} className="btn-primary">
                Cadastre sua barbearia <IconArrow size={18} />
              </a>
              <a href="#recursos" className="btn-outline">Ver recursos</a>
            </div>
            <ul className="lp-hero-checks">
              <li><IconCheck size={16} /> Configure em minutos</li>
              <li><IconCheck size={16} /> Sem instalar nada</li>
              <li><IconCheck size={16} /> Funciona no celular</li>
            </ul>
          </div>

          {/* Comanda ilustrativa (elemento de assinatura) */}
          <div className="lp-hero-art" aria-hidden="true">
            <div className="ticket lp-ticket">
              <div className="lp-ticket-head">
                <span className="display">Próximo horário</span>
                <span className="badge-confirm lp-badge">Confirmado</span>
              </div>
              <div className="ticket-perf" />
              <div className="lp-ticket-row">
                <span className="muted">Cliente</span>
                <strong>João Pereira</strong>
              </div>
              <div className="lp-ticket-row">
                <span className="muted">Serviço</span>
                <strong>Corte + Barba</strong>
              </div>
              <div className="lp-ticket-row">
                <span className="muted">Barbeiro</span>
                <strong>Rafael</strong>
              </div>
              <div className="ticket-perf" />
              <div className="lp-ticket-foot">
                <span className="mono lp-ticket-time">14:30</span>
                <span className="mono lp-ticket-price">R$ 55,00</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Recursos ---- */}
        <section id="recursos" className="lp-section">
          <div className="lp-section-head">
            <span className="lp-kicker mono">RECURSOS</span>
            <h2 className="lp-h2">Tudo que a barbearia precisa</h2>
            <div className="barber-rule lp-rule" />
            <p className="lp-section-sub">
              Deixe o caderno de agendamentos e o WhatsApp bagunçado para trás.
            </p>
          </div>
          <div className="lp-grid">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="card lp-feature">
                <span className="lp-feature-icon"><Icon size={22} /></span>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Como funciona ---- */}
        <section id="como-funciona" className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <span className="lp-kicker mono">COMO FUNCIONA</span>
            <h2 className="lp-h2">No ar em três passos</h2>
            <div className="barber-rule lp-rule" />
          </div>
          <div className="lp-steps">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="lp-step">
                <span className="lp-step-n display">{n}</span>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Destaque app do cliente ---- */}
        <section className="lp-section">
          <div className="lp-highlight card card-raised">
            <div className="lp-highlight-copy">
              <span className="lp-feature-icon"><IconBell size={22} /></span>
              <h2 className="lp-h2">Seus clientes na palma da mão</h2>
              <p className="muted">
                O cliente escolhe serviço, barbeiro e horário pelo celular, acompanha
                a fidelidade e o histórico, e recebe confirmação e lembrete
                automáticos. Menos falta, menos telefone tocando.
              </p>
              <a href={SIGNUP} className="btn-primary lp-highlight-cta">
                Começar agora <IconArrow size={18} />
              </a>
            </div>
            <ul className="lp-highlight-list">
              <li><IconCheck size={18} /> Agendamento 24h, sem depender de mensagem</li>
              <li><IconCheck size={18} /> Confirmação e lembrete por e-mail</li>
              <li><IconCheck size={18} /> Programa de fidelidade com níveis</li>
              <li><IconCheck size={18} /> Instalável na tela inicial do celular</li>
            </ul>
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section id="perguntas" className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <span className="lp-kicker mono">PERGUNTAS FREQUENTES</span>
            <h2 className="lp-h2">Ainda em dúvida?</h2>
            <div className="barber-rule lp-rule" />
          </div>
          <div className="lp-faq">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="lp-faq-item card">
                <summary className="lp-faq-q">{q}</summary>
                <p className="lp-faq-a muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---- CTA final ---- */}
        <section className="lp-cta-band">
          <h2 className="lp-cta-title display">Pronto para organizar sua barbearia?</h2>
          <p className="lp-cta-sub">Cadastre-se e comece a receber agendamentos hoje.</p>
          <a href={SIGNUP} className="btn-primary lp-cta-btn">
            Cadastre sua barbearia <IconArrow size={18} />
          </a>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-brand display">
            <IconScissors size={20} />
            BarberSync
          </span>
          <nav className="lp-footer-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href={LOGIN}>Entrar</a>
            <a href={SIGNUP}>Cadastrar</a>
          </nav>
          <span className="lp-footer-copy muted">
            © {new Date().getFullYear()} BarberSync
          </span>
        </div>
      </footer>
    </>
  );
}
