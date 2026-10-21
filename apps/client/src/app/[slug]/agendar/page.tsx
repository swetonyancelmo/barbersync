import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBarbearia } from '@/lib/public-api';
import { BookingFlow } from '@/components/booking-flow';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await fetchBarbearia(params.slug);
  return { title: b ? `Agendar · ${b.nome}` : 'Barbearia não encontrada · BarberSync' };
}

export default async function AgendarBarbeariaPage({ params }: Props) {
  const barbearia = await fetchBarbearia(params.slug);
  if (!barbearia) notFound();
  return <BookingFlow barbearia={barbearia} />;
}
