// Navbar component
// App ke top par navigation bar dikhata hai
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PenLine, LogOut, Plus, FileText, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [userEmail, setUserEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn && session?.user?.email) {
      setUserEmail(session.user.email);
    } else {
      setUserEmail("");
    }
    setMobileMenuOpen(false);
  }, [isLoggedIn, session]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const navLinks = (
    <>
      {isLoggedIn && (
        <>
          <Link
            href="/notes/new"
            className={`block py-2 text-sm font-medium transition-colors hover:text-foreground ${pathname === "/notes/new" ? "text-foreground" : "text-muted-foreground"}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Create Note
          </Link>
          <Link
            href="/dashboard"
            className={`block py-2 text-sm font-medium transition-colors hover:text-foreground ${pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/notes"
            className={`block py-2 text-sm font-medium transition-colors hover:text-foreground ${pathname === "/notes" ? "text-foreground" : "text-muted-foreground"}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Notes
          </Link>
        </>
      )}
    </>
  );

  // Navbar ka UI
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and brand name */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PenLine className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight">Note App</span>
        </Link>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {isLoggedIn && (
            <>
              <Link
                href="/notes/new"
                className={`transition-colors hover:text-foreground ${pathname === "/notes/new" ? "text-foreground" : ""}`}
              >
                Create Note
              </Link>
              <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <Link
                  href="/dashboard"
                  className={`transition-colors hover:text-foreground ${pathname === "/dashboard" ? "text-foreground" : ""}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/notes"
                  className={`transition-colors hover:text-foreground ${pathname === "/notes" ? "text-foreground" : ""}`}
                >
                  Notes
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Auth buttons or user menu */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Desktop user dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-medium">
                          {userEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs text-muted-foreground leading-none">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/notes/new"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Note</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile hamburger menu */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                  <SheetContent onClose={() => setMobileMenuOpen(false)}>
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-4 px-4">
                      {navLinks}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start px-2">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {userEmail.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{userEmail}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="left" align="start" className="w-56">
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">Account</p>
                              <p className="text-xs text-muted-foreground leading-none truncate">
                                {userEmail}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/notes/new" className="flex items-center gap-2 cursor-pointer">
                              <Plus className="h-4 w-4" />
                              <span>New Note</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                              <FileText className="h-4 w-4" />
                              <span>Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-600 cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Log out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            /* Guest user ke liye login and register buttons */
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
