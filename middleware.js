import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/admin/login' },
});

// Protect all /admin routes except /admin/login
export const config = {
  matcher: ['/admin', '/admin/((?!login$).*)'],
};
