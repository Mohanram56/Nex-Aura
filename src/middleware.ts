import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    const role = token.role as string;
    
    // Redirect /dashboard root to the appropriate sub-dashboard
    if (path === "/dashboard" || path === "/dashboard/") {
      if (role === "HR_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else if (role === "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard/manager", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard/employee", req.url));
      }
    }
    
    // HR/Admin dashboards check
    if (path.startsWith("/dashboard/admin") && role !== "HR_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    
    // Manager dashboard check
    if (
      path.startsWith("/dashboard/manager") &&
      role !== "MANAGER" &&
      role !== "HR_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
