import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. If not logged in, 'withAuth' handles redirect to login automatically.
    
    // 2. Role Based Access Control
    const userRole = token?.role;

    // Admin & Cashier -> Allow access to /dashboard
    // Others (Employee, etc) -> Redirect to /employee (or restricts from /dashboard)
    
    // If trying to access /dashboard and NOT Admin or Cashier
    if (path.startsWith("/dashboard") && userRole !== "Admin" && userRole !== "Cashier") {
       // Redirect unauthorized roles to a dedicated employee page or home
       return NextResponse.redirect(new URL("/employee", req.url));
    }

    // Allow access
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Ensure user is authenticated first
    },
  }
);

export const config = { 
  matcher: ["/dashboard/:path*", "/employee/:path*"] 
};
