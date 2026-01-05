// src/components/Layout.tsx
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/mockData";
import { useEmployee } from "@/context/EmployeeProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bell, Search, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { withEmployeeBase } from "@/lib/paths";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useEmployee();
  const isManager = true;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0 left-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">HR</span>
          </div>
          <span className="text-xl font-heading font-bold">PeoplePortal</span>
        </div>

        <div className="space-y-1">
          {navItems
            .filter((item) => !item.managerOnly || isManager)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-white",
                      )}
                    />
                    {item.label}
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border/50">
        <div className="bg-sidebar-accent/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 border border-sidebar-border">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.employee_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.employee_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Employee</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          >
            <Settings className="h-3 w-3 mr-2" />
            Preferences
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { user, logout } = useEmployee();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">HR</span>
            </div>
            <span className="text-xl font-heading font-bold">PeoplePortal</span>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.employee_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.employee_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Employee</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="mt-4 w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b border-border h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 md:hidden">
        <MobileNav />
        <span className="font-heading font-bold text-lg">PeoplePortal</span>
      </div>

      <div className="hidden md:flex items-center w-full max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for employees, policies..."
          className="pl-9 bg-secondary/50 border-transparent focus:bg-background focus:border-primary transition-all"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
        </Button>
        <div className="md:hidden">
          <Avatar className="h-8 w-8">
            <AvatarImage src={null as any} />
            <AvatarFallback>HR</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useEmployee();

  useEffect(() => {
    if (!user) window.location.href = withEmployeeBase("/login");
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
