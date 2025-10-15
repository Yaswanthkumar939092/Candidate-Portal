'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  RefreshCw,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ToggleLeft
} from 'lucide-react'
import { signOut } from '@/lib/supabase'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and profiles',
    badge: 'New'
  },
  {
    title: 'Jobs',
    href: '/admin/jobs',
    icon: Briefcase,
    description: 'Manage job postings'
  },
  {
    title: 'Applications',
    href: '/admin/applications',
    icon: FileText,
    description: 'Review applications'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Reports and insights'
  },
  {
    title: 'RefreshCw',
    href: '/admin/sync',
    icon: RefreshCw,
    description: 'Frappe data sync'
  },
  {
    title: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: ToggleLeft,
    description: 'Manage feature toggles',
    badge: 'Beta'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

interface AdminNavigationProps {
  className?: string
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Mobile menu button
  const MobileMenuButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSidebar}
      className="md:hidden fixed top-4 left-4 z-50"
    >
      {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
    </Button>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CP</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Candidate Portal</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Button
              key={item.href}
              variant={active ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                router.push(item.href)
                closeSidebar()
              }}
            >
              <div className="flex items-center w-full">
                <Icon className="w-5 h-5 mr-3" />
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    active ? 'text-primary-foreground/80' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </Button>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-6 border-t border-gray-200">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/sync')}
            className="w-full justify-start"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            RefreshCw Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/notifications')}
            className="w-full justify-start relative"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.png" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Admin User</div>
                  <div className="text-xs text-gray-500">admin@company.com</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <Users className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              User Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      <MobileMenuButton />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidebar}
          />

          {/* Sidebar */}
          <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}