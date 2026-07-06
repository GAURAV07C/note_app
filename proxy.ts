export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/api/notes/:path*", "/api/share/:path*", "/dashboard/:path*"],
};  