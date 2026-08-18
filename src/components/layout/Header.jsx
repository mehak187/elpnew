import { Link, useLocation } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  KeyRound,
  Briefcase,
  Scale,
  Wallet,
  Users,
  UserCircle,
  Archive,
  Menu,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Active Cases", path: "/litigation", icon: Scale, key: "litigation" },
  { name: "Clients", path: "/clients", icon: Users, key: "clients" },
  // { name: "My Profile", path: "/profile", icon: UserCircle, key: "profile" },
  // { name: "Corporate Matters", path: "/corporate", icon: Briefcase, key: "corporate" },
  // { name: "Invoices", path: "/finance", icon: Wallet, key: "finance" },
  // { name: "Employees", path: "/employees", icon: Users, key: "employees" },
  // { name: "Archive", path: "/archive", icon: Archive, key: "archive" },
];

export default function Header({ onNavClick, activeNav }) {
  const location = useLocation();

  const isActive = (key) => {
    return activeNav === key || location.pathname.startsWith(`/${key}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="font-serif text-3xl font-bold tracking-[0.12em] text-[#A61C1F]">
                YANDS
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    onClick={() => onNavClick && onNavClick(item.key)}
                    className={cn(
                      "flex items-center mt-1 gap-3 px-4 py-3 rounded-md text-nowrap text-sm font-medium transition-colors",
                      isActive(item.key)
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <Separator className="my-4" />
              <button className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="font-serif text-3xl font-bold tracking-[0.12em] text-[#A61C1F]">
            YANDS
          </span>
        </Link>

        {/* Desktop Navigation - left aligned, next to logo */}
        <NavigationMenu className="hidden lg:flex ml-8" viewport={false}>
          <NavigationMenuList className="gap-2">
            {navItems.map((item) => {
              const active = isActive(item.key);
              return (
                <NavigationMenuItem key={item.key}>
                  <Link
                    to={item.path}
                    onClick={() => onNavClick && onNavClick(item.key)}
                  >
                    <NavigationMenuLink
                      className={cn(
                        "inline-flex items-center gap-2 h-9 rounded-md px-3 py-2 text-sm text-nowrap font-medium transition-colors",
                        "hover:bg-secondary hover:text-secondary-foreground",
                        "focus:bg-secondary focus:text-secondary-foreground focus:outline-none",
                        active
                          ? "bg-secondary text-secondary-foreground font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      <span>{item.name}</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Spacer - push user to right */}
        <div className="flex-1" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline-block text-sm">
                Mohammed Al Yahyaei
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            <DropdownMenuItem className="sm:hidden font-medium">
              Mohammed Al Yahyaei
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem className="cursor-pointer">
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
