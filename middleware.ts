export { auth as middleware } from "./app/lib/auth";

export const config = {
  matcher: ["/api/notes/:path*", "/api/share/:path*", "/dashboard/:path*"],
};
