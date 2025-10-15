'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellRing,
  X,
  Check,
  Search,
  Filter,
  Calendar,
  Briefcase,
  User,
  FileText,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  Trash2,
  MoreVertical,
  Archive,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export interface Notification {
  id: string;
  type: 'application_update' | 'interview_scheduled' | 'interview_reminder' | 'message' | 'deadline' | 'system' | 'offer' | 'rejection';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'applications' | 'interviews' | 'messages' | 'system';
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    applicationId?: string;
    jobTitle?: string;
    companyName?: string;
    interviewDate?: string;
    senderName?: string;
    dueDate?: string;
  };
  starred?: boolean;
  archived?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount?: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  onArchive: (notificationId: string) => void;
  onToggleStar: (notificationId: string) => void;
  onAction: (notification: Notification) => void;
  className?: string;
  showAsPopover?: boolean;
}

export function NotificationCenter({
  notifications,
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onToggleStar,
  onAction,
  className,
  showAsPopover = false
}: NotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [filteredNotifications, setFilteredNotifications] = useState(notifications);

  const getNotificationIcon = (type: string, priority: string) => {
    const priorityColors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-blue-600',
      low: 'text-gray-600'
    };

    const iconClass = cn("w-5 h-5", priorityColors[priority as keyof typeof priorityColors]);

    switch (type) {
      case 'application_update':
        return <Briefcase className={iconClass} />;
      case 'interview_scheduled':
      case 'interview_reminder':
        return <Calendar className={iconClass} />;
      case 'message':
        return <MessageCircle className={iconClass} />;
      case 'deadline':
        return <AlertTriangle className={iconClass} />;
      case 'offer':
        return <CheckCircle2 className={iconClass} />;
      case 'rejection':
        return <X className={iconClass} />;
      case 'system':
        return <Info className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-600 border-gray-200"
    };

    if (priority === 'low') return null;

    return (
      <Badge className={cn("text-xs border capitalize", variants[priority as keyof typeof variants])}>
        {priority}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filter notifications
  useEffect(() => {
    let filtered = notifications.filter(n => !n.archived);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.metadata?.jobTitle?.toLowerCase().includes(query) ||
        n.metadata?.companyName?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, selectedCategory, selectedPriority]);

  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const starredNotifications = filteredNotifications.filter(n => n.starred);

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      className={cn(
        "p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.read ? "bg-blue-50 border-l-blue-500" : "border-l-transparent"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={cn(
                "text-sm font-semibold",
                !notification.read ? "text-gray-900" : "text-gray-700"
              )}>
                {notification.title}
              </h3>
              {getPriorityBadge(notification.priority)}
              {notification.starred && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatTimestamp(notification.timestamp)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.read ? (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark as Read
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      <Bell className="w-4 h-4 mr-2" />
                      Mark as Unread
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => onToggleStar(notification.id)}>
                    <Star className={cn("w-4 h-4 mr-2", notification.starred && "fill-current text-yellow-500")} />
                    {notification.starred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => onArchive(notification.id)}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onDelete(notification.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>

          {notification.metadata && (
            <div className="text-xs text-gray-500 mb-2">
              {notification.metadata.jobTitle && notification.metadata.companyName && (
                <span>{notification.metadata.jobTitle} at {notification.metadata.companyName}</span>
              )}
              {notification.metadata.senderName && (
                <span>From {notification.metadata.senderName}</span>
              )}
              {notification.metadata.interviewDate && (
                <span>Scheduled for {new Date(notification.metadata.interviewDate).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {notification.actionUrl && notification.actionText && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAction(notification);
              }}
              className="text-xs h-7 px-3"
            >
              {notification.actionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const NotificationContent = () => (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">{unreadCount} unread</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="h-7 px-3 text-xs"
          >
            All
          </Button>
          <Button
            variant={selectedCategory === 'applications' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('applications')}
            className="h-7 px-3 text-xs"
          >
            Applications
          </Button>
          <Button
            variant={selectedCategory === 'interviews' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('interviews')}
            className="h-7 px-3 text-xs"
          >
            Interviews
          </Button>
          <Button
            variant={selectedCategory === 'messages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('messages')}
            className="h-7 px-3 text-xs"
          >
            Messages
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1 m-4">
          <TabsTrigger value="all" className="text-xs">
            All ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="starred" className="text-xs">
            Starred ({starredNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="m-0">
          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.length > 0 ? (
              <div className="divide-y">
                {unreadNotifications.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No unread notifications.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="starred" className="m-0">
          <div className="max-h-96 overflow-y-auto">
            {starredNotifications.length > 0 ? (
              <div className="divide-y">
                {starredNotifications.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No starred notifications</h3>
                <p className="text-gray-600">Star important notifications to find them easily.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (showAsPopover) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <BellRing className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          <NotificationContent />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className={cn("border-0 shadow-lg max-w-2xl", className)}>
      <NotificationContent />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Configure your notification preferences here.
            </div>
            <Button className="bg-[#1993e5] hover:bg-[#1680cc]">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Example usage component with sample data
export function NotificationCenterExample() {
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      type: 'application_update',
      title: 'Application Status Update',
      message: 'Your application for Senior Frontend Developer at TechCorp has been reviewed.',
      timestamp: '2024-01-20T10:30:00Z',
      read: false,
      priority: 'high',
      category: 'applications',
      actionUrl: '/applications/123',
      actionText: 'View Application',
      metadata: {
        applicationId: '123',
        jobTitle: 'Senior Frontend Developer',
        companyName: 'TechCorp'
      }
    },
    {
      id: '2',
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your phone interview with Sarah Johnson has been scheduled for tomorrow.',
      timestamp: '2024-01-19T15:45:00Z',
      read: false,
      priority: 'urgent',
      category: 'interviews',
      actionUrl: '/interviews/456',
      actionText: 'View Details',
      metadata: {
        interviewDate: '2024-01-21T14:00:00Z',
        senderName: 'Sarah Johnson'
      },
      starred: true
    },
    {
      id: '3',
      type: 'message',
      title: 'New Message from Recruiter',
      message: 'Hi John, I wanted to follow up on your application...',
      timestamp: '2024-01-18T09:15:00Z',
      read: true,
      priority: 'medium',
      category: 'messages',
      actionUrl: '/messages/789',
      actionText: 'Reply',
      metadata: {
        senderName: 'Mike Chen'
      }
    },
    {
      id: '4',
      type: 'deadline',
      title: 'Application Deadline Approaching',
      message: 'The application deadline for Product Manager role is in 2 days.',
      timestamp: '2024-01-17T12:00:00Z',
      read: true,
      priority: 'medium',
      category: 'applications',
      metadata: {
        dueDate: '2024-01-24T23:59:59Z',
        jobTitle: 'Product Manager',
        companyName: 'StartupXYZ'
      }
    }
  ];

  const [notifications, setNotifications] = useState(sampleNotifications);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: !n.read } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleArchive = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, archived: true } : n
      )
    );
  };

  const handleToggleStar = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, starred: !n.starred } : n
      )
    );
  };

  const handleAction = (notification: Notification) => {
    console.log('Notification action clicked:', notification);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Notification Center Examples</h2>

      <div className="flex space-x-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">As Popover</h3>
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onToggleStar={handleToggleStar}
            onAction={handleAction}
            showAsPopover={true}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">As Card</h3>
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onToggleStar={handleToggleStar}
            onAction={handleAction}
            showAsPopover={false}
          />
        </div>
      </div>
    </div>
  );
}