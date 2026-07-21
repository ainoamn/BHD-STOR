"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

// import { AIAssistant } from "@/components/ai/AIAssistant";
// import { SmartCart, CartTrigger } from "@/components/cart/SmartCart";

import {
  Menu,
  Search,
  ShoppingCart,
  User,
  Store,
  LogOut,
  Settings,
  Shield,
  Heart,
  Package,
  ChevronDown,
  Moon,
  Sun,
  Globe,
  Home,
  TrendingUp,
  Tag,
} from "lucide-react";

function Navbar({ onCartOpen }: { onCartOpen: () => void }) {
  const t = useTranslations("layout");
  const { user, logout, isLoading } = useAuth();
  const { data: cart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = mounted
    ? (cart?.items?.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      ) ?? 0)
    : 0;

  const showAuthLoading = !mounted || isLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogout = () => {
    logout.mutate();
  };

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/products", label: t("nav.products"), icon: Package },
    { href: "/stores", label: t("nav.stores"), icon: Store },
    { href: "/deals", label: t("nav.deals"), icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <div className="flex flex-col gap-6 mt-4">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">BHD</span>
                  </div>
                  <span className="font-bold text-lg">{t("brand")}</span>
                </Link>
                <Separator />
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <Separator />
                {showAuthLoading ? (
                  <div className="h-9 rounded-lg bg-muted animate-pulse" />
                ) : user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-muted-foreground" />
                      {t("nav.dashboard")}
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      {t("nav.wishlist")}
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="h-5 w-5 text-muted-foreground" />
                      {t("nav.orders")}
                    </Link>
                    {isAdminRole(user.role) && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        {t("nav.admin")}
                      </Link>
                    )}
                    <Separator />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      {t("nav.logout")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-muted-foreground" />
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      {t("nav.register")}
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">{t("brand")}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => (window.location.href = "/wishlist")}
            >
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartOpen}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {showAuthLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden sm:flex">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium max-w-[80px] truncate">{user.fullName || user.email}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.fullName || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/orders")}>
                    <Package className="mr-2 h-4 w-4" />
                    {t("nav.orders")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/wishlist")}>
                    <Heart className="mr-2 h-4 w-4" />
                    {t("nav.wishlist")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  {isAdminRole(user.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        {t("nav.admin")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === "seller" && (
                    <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/store")}>
                      <Store className="mr-2 h-4 w-4" />
                      {t("nav.store")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/auth/login")}>
                  {t("nav.login")}
                </Button>
                <Button size="sm" onClick={() => (window.location.href = "/auth/register")}>
                  {t("nav.register")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const t = useTranslations("layout.footer");

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-lg">{t("brand")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("links.shop.title")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  {t("links.shop.products")}
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-foreground transition-colors">
                  {t("links.shop.stores")}
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-foreground transition-colors">
                  {t("links.shop.deals")}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-foreground transition-colors">
                  {t("links.shop.categories")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("links.support.title")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  {t("links.support.help")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  {t("links.support.contact")}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-foreground transition-colors">
                  {t("links.support.shipping")}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-foreground transition-colors">
                  {t("links.support.returns")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("links.company.title")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  {t("links.company.about")}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-foreground transition-colors">
                  {t("links.company.careers")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  {t("links.company.terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  {t("links.company.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <p>{t("madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CurrencyProvider>
      <ThemeProvider defaultTheme="light" storageKey="bhd-theme">
        <div className="flex min-h-screen flex-col">
              <Navbar onCartOpen={() => setCartOpen(true)} />

              <main className="flex-1">{children}</main>

              <Footer />
            </div>

            {/* Global UI Components */}
            {/* <SmartCart isOpen={cartOpen} onClose={() => setCartOpen(false)} /> */}
            {/* <AIAssistant /> */}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
        </ThemeProvider>
    </CurrencyProvider>
  );
}
