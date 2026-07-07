import { auth } from "@/lib/auth";

export default auth(async (req) => {
  const session = await req.auth;
  const url = req.nextUrl;

  const protectedRoutes = ["/dashboard", "/notes", "/notes/new"];
  const publicRoutes = ["/login", "/register"];

  const isAuthenticated = !!session?.user;

  if (protectedRoutes.some((route) => url.pathname === route || url.pathname.startsWith(`${route}/`))) {
    if (!isAuthenticated) {
      url.pathname = "/login";
      return Response.redirect(url);
    }
  } else if (publicRoutes.includes(url.pathname) && isAuthenticated) {
    url.pathname = "/dashboard";
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*", "/login", "/register"],
};
