import { redirect } from 'next/navigation';

// Startseite leitet immer zum Dashboard weiter.
// Die Middleware prueft den Auth-Status und leitet ggf. zum Login.
export default function Startseite() {
  redirect('/dashboard');
}
