import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import AuthProvider from './components/AuthProvider';
import AdminNav from './components/AdminNav';

export const metadata = { title: 'NrichSouls CMS' };

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {session && <AdminNav email={session.user?.email} />}
        <div className="flex-1">{children}</div>
      </div>
    </AuthProvider>
  );
}
