'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Home,
  Briefcase,
  FileText,
  User,
  Bell,
  Settings,
  LogOut,
  Search,
  Bookmark,
  Calendar,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from 'next/navigation';
import { NotificationCenter } from './notification-center';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  description?: string;
  subItems?: NavigationSubItem[];
}

interface NavigationSubItem {
  id: string;
  label: string;
  href: string;
  badge?: string | number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  profileCompletion: number;
}

interface MobileNavigationProps {
  user?: User;
  unreadNotifications?: number;
  onSignOut?: () => void;
  className?: string;
}

export function MobileNavigation({
  user,
  unreadNotifications = 0,
  onSignOut,
  className
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />,
      description: 'Overview and quick actions'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      href: '/jobs',
      icon: <Search className="w-5 h-5" />,
      description: 'Search and discover opportunities',
      subItems: [
        { id: 'browse', label: 'Browse Jobs', href: '/jobs' },
        { id: 'saved', label: 'Saved Jobs', href: '/jobs/saved', badge: '12' },
        { id: 'recommendations', label: 'Recommendations', href: '/jobs/recommendations', badge: 'New' }
      ]
    },
    {
      id: 'applications',
      label: 'Applications',
      href: '/applications',
      icon: <FileText className="w-5 h-5" />,
      badge: '3',
      description: 'Track your job applications',
      subItems: [
        { id: 'active', label: 'Active Applications', href: '/applications', badge: '3' },
        { id: 'drafts', label: 'Draft Applications', href: '/applications/drafts', badge: '1' },
        { id: 'archived', label: 'Archived', href: '/applications/archived' }
      ]
    },
    {
      id: 'interviews',
      label: 'Interviews',
      href: '/interviews',
      icon: <Calendar className="w-5 h-5" />,
      badge: '1',
      description: 'Upcoming and past interviews'
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/messages',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: '2',
      description: 'Chat with recruiters'
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your profile and resume'
    }
  ];

  const secondaryItems = [
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />
    },
    {
      id: 'help',
      label: 'Help & Support',
      href: '/help',
      icon: <HelpCircle className="w-5 h-5" />
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setActiveSection(null);
  };

  const toggleSubSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, isSecondary = false) => (
    <div key={item.id}>
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
          isActive(item.href)
            ? "bg-[#1993e5] text-white"
            : "hover:bg-gray-50",
          isSecondary && "text-gray-600"
        )}
        onClick={() => {
          if (item.subItems && item.subItems.length > 0) {
            toggleSubSection(item.id);
          } else {
            handleNavigation(item.href);
          }
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={cn(
            "flex-shrink-0",
            isActive(item.href) ? "text-white" : isSecondary ? "text-gray-500" : "text-gray-700"
          )}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={cn(
                "font-medium truncate",
                isActive(item.href) ? "text-white" : "text-gray-900"
              )}>
                {item.label}
              </p>
              {item.badge && (
                <Badge
                  className={cn(
                    "text-xs",
                    isActive(item.href)
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-[#1993e5] text-white border-[#1993e5]"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            {item.description && !isSecondary && (
              <p className={cn(
                "text-sm truncate mt-0.5",
                isActive(item.href) ? "text-white/80" : "text-gray-500"
              )}>
                {item.description}
              </p>
            )}
          </div>
        </div>

        {item.subItems && item.subItems.length > 0 && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform flex-shrink-0",
              activeSection === item.id && "rotate-90",
              isActive(item.href) ? "text-white" : "text-gray-400"
            )}
          />
        )}
      </div>

      {/* Sub Items */}
      {item.subItems && activeSection === item.id && (
        <div className="ml-8 mt-2 space-y-1">
          {item.subItems.map((subItem) => (
            <div
              key={subItem.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                isActive(subItem.href)
                  ? "bg-blue-50 text-[#1993e5]"
                  : "hover:bg-gray-50 text-gray-700"
              )}
              onClick={() => handleNavigation(subItem.href)}
            >
              <span className="text-sm font-medium">{subItem.label}</span>
              {subItem.badge && (
                <Badge className="text-xs bg-[#1993e5] text-white border-[#1993e5]">
                  {subItem.badge}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative md:hidden", className)}
        >
          <Menu className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#1993e5] rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">CandidatePortal</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-[#1993e5] text-white">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-600 truncate">{user.role}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1993e5] h-2 rounded-full transition-all"
                      style={{ width: `${user.profileCompletion}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{user.profileCompletion}%</span>
                </div>
              </div>
            </div>
            {user.profileCompletion < 100 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNavigation('/profile')}
                className="w-full mt-3 text-[#1993e5] border-[#1993e5] hover:bg-[#1993e5] hover:text-white"
              >
                Complete Profile
              </Button>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Main Navigation
            </h3>
            {navigationItems.map((item) => renderNavigationItem(item))}
          </div>

          <Separator className="mx-4" />

          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Other
            </h3>
            {secondaryItems.map((item) => renderNavigationItem(item, true))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="space-y-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            )}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Version 1.0.0 • Made with ❤️
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Example usage component with sample data
export function MobileNavigationExample() {
  const sampleUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Frontend Developer',
    profileCompletion: 85,
    avatar: '/api/placeholder/32/32'
  };

  const handleSignOut = () => {
    console.log('User signed out');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mobile Navigation</h2>
      <div className="flex items-center space-x-4">
        <MobileNavigation
          user={sampleUser}
          unreadNotifications={5}
          onSignOut={handleSignOut}
        />
        <span className="text-gray-600">← Click the menu icon to open the mobile navigation</span>
      </div>
    </div>
  );
}