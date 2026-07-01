import { Link, useLocation } from '@tanstack/react-router';
import {
  Home, Database, Package, Settings,
  ArrowLeftRight, Upload,
  FileText, History
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  useSidebar
} from '../ui/sidebar';
import { NavUser } from './NavUser';
import { useAuth } from '@/contexts/AuthContext';

const navData = {
  mainNav: [
    {
      title: "Início",
      items: [
        { title: "Home", url: "/", icon: Home },
      ],
    },
    {
      title: "Pautas Fiscais",
      items: [
        { title: "Importar PDF", url: "/import", icon: Upload },
        { title: "Dados Pauta", url: "/dados", icon: Database },
      ],
    },
    {
      title: "Cadastros",
      items: [
        { title: "Produtos", url: "/produtos", icon: Package },
        { title: "De-Para", url: "/de-para", icon: ArrowLeftRight },
      ],
    },
    {
      title: "Administração",
      items: [
        { title: "Auditoria", url: "/auditoria", icon: History },
        { title: "Configurações", url: "/settings", icon: Settings },
      ],
    },
  ],
}

export default function AppSidebar() {
  const { appName } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex items-center justify-center shrink-0 size-8 bg-primary dark:bg-primary rounded-md border border-primary dark:border-primary">
                  <FileText className='text-white dark:text-white'/>
                </div>
                {!collapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{appName}</span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navData.mainNav.map((group) => {
          const filteredItems = group.items.filter(item => {
            if ((item.url === '/users' || item.url === '/auditoria') && !isAdmin) return false;
            return true;
          });

          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link to={item.url as any}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
