import { Link, useLocation } from '@tanstack/react-router';
import {
  Home, FileUp, FileText,
  Database, BarChart3, Package, Users2, User
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  useSidebar
} from '../ui/sidebar';
import { NavUser } from './NavUser';
import Logo from '@/assets/logo-em.png';
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
      title: "Operações",
      items: [
        { title: "Importação", url: "/importacao", icon: FileUp },
        { title: "Dados", url: "/dados", icon: Database },
        { title: "Relatórios", url: "/relatorio", icon: BarChart3 },
        { title: "Faturas", url: "/faturas", icon: FileText },
      ],
    },
    {
      title: "Cadastros",
      items: [
        { title: "Clientes", url: "/clientes", icon: Users2 },
        { title: "Equipamentos", url: "/equipamentos", icon: Package },
        { title: "Usuários", url: "/usuarios", icon: User },
      ],
    },
  ],
}

export default function AppSidebar() {
  const { appName } = useApp();
  const { state } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const rows = state.rows;
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex items-center justify-center shrink-0 size-8">
                  <img src={Logo} alt="Logo" />
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
            if (item.url === '/usuarios' && !isAdmin) return false;
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
                          <Link to={item.url}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                            {item.url === '/dados' && rows.length > 0 && !collapsed && (
                              <SidebarMenuBadge>
                                {rows.length}
                              </SidebarMenuBadge>
                            )}
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
