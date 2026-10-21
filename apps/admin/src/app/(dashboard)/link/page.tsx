'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { BarbeariaRef, slugProblem, UserRole } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { IconCopy, IconDownload, IconLink } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

/** Origem do app do cliente — o link da barbearia é `<CLIENT_URL>/<slug>`. */
const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');
const CLIENT_HOST = CLIENT_URL.replace(/^https?:\/\//, '');

export default function LinkPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [barbearia, setBarbearia] = useState<BarbeariaRef | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroSlug, setErroSlug] = useState<string | null>(null);

  useEffect(() => {
    api<BarbeariaRef>('/tenants/me')
      .then((b) => {
        setBarbearia(b);
        setSlug(b.slug);
      })
      .catch((err) => setErroCarga(err instanceof ApiError ? err.message : 'Falha ao carregar.'));
  }, []);

  const link = barbearia ? `${CLIENT_URL}/${barbearia.slug}` : '';

  useEffect(() => {
    if (!link) return;
    // Verde-esmalte sobre branco: contraste alto o bastante p/ qualquer câmera.
    QRCode.toDataURL(link, { width: 640, margin: 2, color: { dark: '#1e3a33', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

  const slugNormalizado = slug.trim().toLowerCase();
  const problemaLocal = slugNormalizado ? slugProblem(slugNormalizado) : null;
  const mudou = barbearia !== null && slugNormalizado !== barbearia.slug;

  async function salvarSlug(e: React.FormEvent) {
    e.preventDefault();
    if (!mudou || problemaLocal) return;
    setSalvando(true);
    setErroSlug(null);
    try {
      const b = await api<BarbeariaRef>('/tenants/me', {
        method: 'PATCH',
        body: JSON.stringify({ slug: slugNormalizado }),
      });
      setBarbearia(b);
      setSlug(b.slug);
      toast.success('Endereço atualizado. Lembre de trocar o link na sua bio.');
    } catch (err) {
      setErroSlug(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-[760px]">
      <h1 className="m-0 text-[28px]">Link de agendamento</h1>
      <div className="barber-rule my-2 w-[60px]" />
      <p className="mb-5 mt-0 text-sm text-slate">
        Seus clientes agendam por este link: escolhem o serviço, o barbeiro e o horário — sem
        precisar procurar sua barbearia. Coloque na bio do Instagram, nos stories (figurinha de
        link) e no WhatsApp.
      </p>

      {erroCarga && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{erroCarga}</AlertDescription>
        </Alert>
      )}

      {!barbearia && !erroCarga && <Skeleton className="h-40 w-full" />}

      {barbearia && (
        <div className="grid gap-4 min-[901px]:grid-cols-[1fr_260px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconLink size={20} /> Seu link
              </CardTitle>
              <CardDescription>Toque para copiar e cole onde quiser divulgar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="mono break-all rounded-input border border-line bg-paper px-4 py-3 text-[15px]">
                {CLIENT_HOST}/<strong className="text-pole">{barbearia.slug}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copiar}>
                  <IconCopy size={18} /> Copiar link
                </Button>
                <Button asChild variant="secondary">
                  <a href={link} target="_blank" rel="noreferrer">Abrir página</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code</CardTitle>
              <CardDescription>Imprima e cole no espelho ou no balcão.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qr ? (
                <img
                  src={qr}
                  alt={`QR Code do link ${CLIENT_HOST}/${barbearia.slug}`}
                  className="w-full max-w-[200px] rounded-ticket border border-line"
                />
              ) : (
                <Skeleton className="aspect-square w-full max-w-[200px]" />
              )}
              <Button asChild variant="outline" size="sm" disabled={!qr}>
                <a href={qr ?? undefined} download={`qrcode-${barbearia.slug}.png`}>
                  <IconDownload size={16} /> Baixar PNG
                </a>
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="min-[901px]:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Endereço do link</CardTitle>
                <CardDescription>
                  Ao trocar, o link antigo para de funcionar — atualize a bio e o QR Code impresso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={salvarSlug} className="flex flex-col gap-3">
                  <Label htmlFor="slug">Endereço</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono text-sm text-slate">{CLIENT_HOST}/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setErroSlug(null);
                      }}
                      maxLength={40}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!!(problemaLocal || erroSlug)}
                      aria-describedby="slug-ajuda"
                      className="mono max-w-[320px] flex-1"
                    />
                    <Button type="submit" disabled={!mudou || !!problemaLocal || salvando}>
                      {salvando ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </div>
                  <p id="slug-ajuda" className="m-0 text-[13px] text-slate">
                    {problemaLocal ?? 'Letras minúsculas, números e hífen. Ex.: barbearia-do-ze'}
                  </p>
                  {erroSlug && (
                    <Alert variant="destructive">
                      <AlertDescription>{erroSlug}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
