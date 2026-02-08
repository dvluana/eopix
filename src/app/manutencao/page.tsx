import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/consulta/exemplo?variant=maintenance');
}
