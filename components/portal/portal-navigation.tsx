"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Home,
  Briefcase,
  ClipboardList,
  Globe,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";

/**
 * Navigation item definition for the portal top bar.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

/**
 * Props for the PortalNavigation component.
 */
interface PortalNavigationProps {
  className?: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Open Jobs", href: "/open-jobs", icon: Briefcase },
  { label: "My Jobs", href: "/my-jobs", icon: ClipboardList, badgeCount: 3 },
  { label: "Action Center", href: "/action-center", icon: ClipboardList },
];

/**
 * Extracts initials from a display name string.
 * Returns up to 2 uppercase characters.
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formats a lifecycle stage or role string for display.
 * Converts snake_case / lowercase to Title Case.
 */
function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Desktop-first top navigation bar for authenticated portal pages.
 * Matches the Physics Wallah design with dark pill active states,
 * green pill for Action Center, badge counts, and user avatar dropdown.
 */
export function PortalNavigation({ className }: PortalNavigationProps) {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = getInitials(displayName);

  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;

  const userRole = profile?.role ? formatRole(profile.role) : "Candidate";

  const isActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card shadow-sm",
        className
      )}
    >
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Left side: Mobile Menu + PW Logo */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-3 shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-bold text-lg">Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 py-6">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.badgeCount && item.badgeCount > 0 && (
                          <Badge
                            className={cn(
                              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold border-none",
                              active
                                ? "bg-background/20 text-background"
                                : "bg-orange-500 text-white"
                            )}
                          >
                            {item.badgeCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop/Mobile PW Logo */}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image
              src="/brand2.png"
              alt="Physics Wallah"
              width={32}
              height={32}
              priority
              className="shrink-0"
            />
            <span className="text-[14px] sm:text-base font-extrabold text-black uppercase hidden sm:block">Physics Wallah</span>
          </Link>
        </div>

        {/* Center: Nav links with pill-style active states (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-300 ease-in-out",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span>{item.label}</span>
                {/* Badge count for My Jobs */}
                {item.badgeCount && item.badgeCount > 0 && (
                  <Badge
                    className={cn(
                      "ml-0.5 flex items-center justify-center rounded-full px-1.5 py-1 text-[10px] font-semibold border-none",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {item.badgeCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Language selector + User dropdown */}
        <div className="flex items-center gap-3">
          {/* Language selector (non-functional) */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-medium">EN</span>
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden max-w-[120px] flex-col items-start md:flex">
                  <span className="truncate text-sm font-medium text-foreground w-full text-left">
                    {displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {userRole}
                  </span>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              {/* User info header */}
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                  {profile?.lifecycle_stage && (
                    <Badge variant="secondary" className="mt-1 w-fit text-xs">
                      {formatRole(profile.lifecycle_stage)}
                    </Badge>
                  )}
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Profile link */}
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              {/* Settings link */}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Sign out */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
