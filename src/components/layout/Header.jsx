import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  KeyRound,
  Building2,
  ListTree,
  LayoutDashboard,
  ReceiptText,
  Truck,
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
  NavigationMenuTrigger,
  NavigationMenuContent,
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
import { useFirm } from "@/lib/firm/context";

/**
 * Header navigation.
 *
 * An entry with `items` is a section that opens as a menu; one with `path` is a
 * plain link. Further pages for the Partner Menu go in its `items` array - nothing
 * else has to change.
 */
const navSections = [
  { name: "Active Cases", path: "/litigation", key: "litigation", icon: Scale },
  {
    name: "Partner Menu",
    key: "private",
    icon: ListTree,
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        key: "dashboard",
        icon: LayoutDashboard,
        description: "Daily operations and management overview",
      },
      {
        name: "Clients",
        path: "/clients",
        key: "clients",
        icon: Users,
        description: "Client directory and profiles",
      },
      {
        name: "Suppliers",
        path: "/suppliers",
        key: "suppliers",
        icon: Truck,
        description: "Supplier directory and tax numbers",
      },
      {
        name: "Expenses",
        path: "/expenses",
        key: "expenses",
        icon: Wallet,
        description: "Every expense, and what has been paid against it",
      },
    ],
  },
  {
    name: "Payment Request",
    path: "/expense-requests",
    key: "expense-requests",
    icon: ReceiptText,
  },
  // { name: "Corporate Matters", path: "/corporate", icon: Briefcase, key: "corporate" },
  // { name: "Invoices", path: "/finance", icon: Wallet, key: "finance" },
  // { name: "Employees", path: "/employees", icon: Users, key: "employees" },
  // { name: "Archive", path: "/archive", icon: Archive, key: "archive" },
];

export default function Header({ onNavClick, activeNav }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firmInfo } = useFirm();

  const isActive = (key) => {
    return activeNav === key || location.pathname.startsWith(`/${key}`);
  };

  // A section highlights when any page inside it is open.
  const isSectionActive = (section) =>
    section.items
      ? section.items.some((item) => isActive(item.key))
      : isActive(section.key);

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
              <SheetTitle className="font-serif text-3xl font-bold tracking-[0.12em] text-primary">
                {firmInfo.nameEn}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {navSections.map((section) =>
                section.items ? (
                  <div key={section.key} className="mt-2">
                    <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.name}
                    </p>
                    {section.items.map((item) => (
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
                    ))}
                  </div>
                ) : (
                  <Link
                    key={section.key}
                    to={section.path}
                    onClick={() => onNavClick && onNavClick(section.key)}
                    className={cn(
                      "flex items-center mt-1 gap-3 px-4 py-3 rounded-md text-nowrap text-sm font-medium transition-colors",
                      isActive(section.key)
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                  >
                    {section.name}
                  </Link>
                )
              )}
              <Separator className="my-4" />
              <Link
                to="/settings/password"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </Link>
              <button
                onClick={() => navigate("/sign-in")}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="font-serif text-3xl font-bold tracking-[0.12em] text-primary">
            {firmInfo.nameEn}
          </span>
        </Link>

        {/* Desktop Navigation - left aligned, next to logo */}
        <NavigationMenu className="hidden lg:flex ml-8" viewport={false}>
          <NavigationMenuList className="gap-2">
            {navSections.map((section) => {
              const active = isSectionActive(section);

              // A plain link
              if (!section.items) {
                return (
                  <NavigationMenuItem key={section.key}>
                    <Link
                      to={section.path}
                      onClick={() => onNavClick && onNavClick(section.key)}
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
                        <span>{section.name}</span>
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                );
              }

              // A section that opens as a menu
              return (
                <NavigationMenuItem key={section.key}>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-9 px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-secondary text-secondary-foreground font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.name}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-72 p-2">
                      {section.items.map((item) => (
                        <li key={item.key}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.path}
                              onClick={() => onNavClick && onNavClick(item.key)}
                              className={cn(
                                "flex items-start gap-3 rounded-md p-3 transition-colors",
                                isActive(item.key)
                                  ? "bg-secondary text-secondary-foreground"
                                  : "hover:bg-secondary hover:text-secondary-foreground"
                              )}
                            >
                              <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                <span className="block text-sm font-medium">
                                  {item.name}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
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
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/settings/firm">
                <Building2 className="mr-2 h-4 w-4" />
                Company Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/settings/password">
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => navigate("/sign-in")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
