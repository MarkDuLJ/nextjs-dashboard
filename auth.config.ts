import { NextAuthConfig } from "next-auth";//not from v4 from beta version

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    // this callback is used to verify if the request is authorized to access a page via Next.js Middleware
    callbacks:{
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
              if (isLoggedIn) return true;
              return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
              return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
          },
    },
    providers: []
} satisfies NextAuthConfig