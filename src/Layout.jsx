import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Users, Router, Wifi, FileText, 
  CreditCard, Wrench, Package, Bell, AlertTriangle,
  Settings, LogOut, Menu, X, ChevronDown, Search,
  Moon, Sun, User, HelpCircle, Map
} from 'lucide-react';
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Customers', icon: Users, page: 'Customers' },
  { 
    name: 'Network', 
    icon: Router, 
    submenu: [
      { name: 'OLT Management', page: 'OLTManagement' },
      { name: 'ONT Management', page: 'ONTManagement' },
      { name: 'Network Map', page: 'NetworkMap' },
      { name: 'Monitoring', page: 'NetworkMonitoring' },
    ]
  },
  { name: 'GIS Dashboard', icon: Map, page: 'GISDashboard' },
  { name: 'Service Plans', icon: Wifi, page: 'ServicePlans' },
  { name: 'Tickets', icon: FileText, page: 'Tickets' },
  { name: 'Billing', icon: CreditCard, page: 'Billing' },
  { name: 'Work Orders', icon: Wrench, page: 'WorkOrders' },
  { name: 'Inventory', icon: Package, page: 'Inventory' },
  { name: 'Alerts', icon: AlertTriangle, page: 'Alerts' },
  { name: 'AI Predictions', icon: Bell, page: 'PredictiveMaintenance' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    loadUser();
    loadAlertCount();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log('User not logged in');
    }
  };

  const loadAlertCount = async () => {
    try {
      const alerts = await base44.entities.NetworkAlert.filter({ status: 'active' });
      setAlertCount(alerts.length);
    } catch (e) {
      console.log('Could not load alerts');
    }
  };

  const toggleSubmenu = (name) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const NavItem = ({ item, isNested = false }) => {
    const isActive = currentPageName === item.page;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.name];

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              hover:bg-slate-800/50 text-slate-400 hover:text-white`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </div>
            {sidebarOpen && (
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          <AnimatePresence>
            {isExpanded && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-8 mt-1 space-y-1 overflow-hidden"
              >
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.name}
                    to={createPageUrl(subItem.page)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${currentPageName === subItem.page 
                        ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/10 text-amber-400 border-l-2 border-amber-500' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${isActive 
            ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/10 text-amber-400 border-l-2 border-amber-500' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
        {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <style>{`
        :root {
          --mboalink-graphite: #1a1a2e;
          --mboalink-midnight: #16213e;
          --mboalink-copper: #d4a574;
          --mboalink-copper-light: #e8c9a8;
        }
      `}</style>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transition-all duration-300 z-40
        ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">MBOALINK</h1>
                <p className="text-xs text-slate-500">OSS/BSS Platform</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* User Section */}
        {user && sidebarOpen && (
          <div className="p-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-sm">
                  {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">MBOALINK</h1>
                    <p className="text-xs text-slate-500">OSS/BSS Platform</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-400"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search customers, ONTs, tickets..." 
                className="w-64 lg:w-80 pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {alertCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
                <div className="p-3 border-b border-slate-800">
                  <h4 className="font-semibold text-white">Notifications</h4>
                </div>
                <div className="p-3 text-sm text-slate-400 text-center">
                  {alertCount > 0 ? `${alertCount} active alerts` : 'No new notifications'}
                </div>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Alerts')} className="text-amber-400 cursor-pointer">
                    View all alerts
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help */}
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <HelpCircle className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-slate-400 hover:text-white">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-sm">
                      {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                <div className="p-3 border-b border-slate-800">
                  <p className="font-medium text-white">{user?.full_name}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}