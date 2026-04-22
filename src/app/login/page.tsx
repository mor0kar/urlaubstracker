'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Modus = 'passwort' | 'magiclink';

export default function LoginPage() {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>('passwort');
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler(null);

    const supabase = createClient();

    if (modus === 'passwort') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
      if (error) {
        setFehler('E-Mail oder Passwort falsch.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setFehler(error.message);
      } else {
        setGesendet(true);
      }
    }

    setLaedt(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-1">UrlaubsPlaner</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Melde dich mit deiner E-Mail an</p>

        {/* Modus-Umschalter */}
        <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setModus('passwort'); setFehler(null); }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
              modus === 'passwort'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            Passwort
          </button>
          <button
            type="button"
            onClick={() => { setModus('magiclink'); setFehler(null); }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
              modus === 'magiclink'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            Magic Link
          </button>
        </div>

        {gesendet ? (
          <div className="text-center">
            <p className="text-gray-700 dark:text-slate-200 font-medium">Link gesendet!</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
              Schau in dein Postfach bei <strong className="text-gray-800 dark:text-slate-200">{email}</strong> und klicke den Link
              auf diesem PC.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {modus === 'passwort' && (
              <div>
                <label htmlFor="passwort" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Passwort
                </label>
                <input
                  id="passwort"
                  type="password"
                  required
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {fehler && (
              <p className="text-sm text-red-600 dark:text-red-400">{fehler}</p>
            )}

            <button
              type="submit"
              disabled={laedt}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {laedt
                ? 'Lädt...'
                : modus === 'passwort'
                  ? 'Einloggen'
                  : 'Magic Link senden'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
