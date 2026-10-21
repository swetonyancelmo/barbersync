import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchBarbearia } from '@/lib/public-api';
import { brl } from '@/lib/format';
import { BarberAvatar } from '@/components/ui';
import { RememberBarbearia } from '@/components/remember-barbearia';
import { IconStar } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Props = { params: { slug: string } };

/** Título/descrição por barbearia: é o que aparece ao colar o link no WhatsApp/Instagram. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await fetchBarbearia(params.slug);
  if (!b) return { title: 'Barbearia não encontrada · BarberSync' };
  const description = `Agende seu horário na ${b.nome}: escolha o serviço, o barbeiro e o horário.`;
  return {
    title: `${b.nome} · Agende seu horário`,
    description,
    openGraph: { title: b.nome, description, type: 'website', siteName: 'BarberSync' },
  };
}

/** Vitrine da barbearia — a página que vai na bio do Instagram. */
export default async function BarbeariaPage({ params }: Props) {
  const b = await fetchBarbearia(params.slug);
  if (!b) notFound();

  const agendar = `/${b.slug}/agendar`;

  return (
    <div className="px-[18px] pb-12 pt-7">
      <RememberBarbearia barbearia={{ id: b.id, nome: b.nome, slug: b.slug }} />

      <header className="mb-6 text-center">
        <p className="mono mb-2 text-xs uppercase tracking-[0.1em] text-slate">Agende seu horário</p>
        <h1 className="mb-3 text-[34px] leading-tight">{b.nome}</h1>
        <div className="barber-rule mx-auto w-20" />
      </header>

      <Button asChild size="lg" className="mb-8 w-full">
        <Link href={agendar}>Agendar horário</Link>
      </Button>

      <h2 className="mb-2.5 text-lg">Serviços</h2>
      {b.servicos.length === 0 ? (
        <p className="mb-7 text-sm text-slate">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="mb-7 flex flex-col gap-2.5">
          {b.servicos.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <strong>{s.nome}</strong>
                <p className="text-[13px] text-slate">
                  {s.descricao ? `${s.descricao} · ` : ''}
                  <span className="mono">{s.duracaoMin} min</span>
                </p>
              </div>
              <strong className="mono shrink-0 text-verd">{brl(s.preco)}</strong>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2.5 text-lg">Barbeiros</h2>
      {b.barbeiros.length === 0 ? (
        <p className="text-sm text-slate">Nenhum barbeiro disponível no momento.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {b.barbeiros.map((barb) => (
            <Card key={barb.id} className="flex items-center gap-3 p-3.5">
              <BarberAvatar nome={barb.nome} />
              <div className="flex-1">
                <strong>{barb.nome}</strong>
                <p className="text-[13px] text-slate">{barb.especialidade ?? 'Barbeiro'}</p>
              </div>
              <Badge variant="ouro">
                <IconStar size={12} /> <span className="mono">{barb.rating.toFixed(1)}</span>
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
