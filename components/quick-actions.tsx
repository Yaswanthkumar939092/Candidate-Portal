'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus,
  FileText,
  Calendar,
  Search,
  Bookmark,
  Upload,
  MessageCircle,
  User,
  Settings,
  BarChart3,
  Download,
  Share2,
  Zap,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: () => void;
  badge?: string | number;
  disabled?: boolean;
  shortcut?: string;
  category: 'primary' | 'secondary' | 'utility';
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface QuickActionGroup {
  id: string;
  title: string;
  actions: QuickAction[];
  description?: string;
}

interface QuickActionsProps {
  actionGroups: QuickActionGroup[];
  onActionClick?: (actionId: string) => void;
  className?: string;
  variant?: 'grid' | 'list' | 'compact' | 'floating';
  showSearch?: boolean;
  showCategories?: boolean;
}

export function QuickActions({
  actionGroups,
  onActionClick,
  className,
  variant = 'grid',
  showSearch = true,
  showCategories = true
}: QuickActionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllActions, setShowAllActions] = useState(false);

  // Flatten all actions for search and filtering
  const allActions = actionGroups.flatMap(group => group.actions);

  const filteredActions = allActions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;

    action.action();
    onActionClick?.(action.id);
  };

  const renderActionButton = (action: QuickAction, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'h-16 flex-col space-y-1',
      medium: 'h-20 flex-col space-y-2',
      large: 'h-24 flex-col space-y-2'
    };

    const iconSizes = {
      small: 'w-4 h-4',
      medium: 'w-5 h-5',
      large: 'w-6 h-6'
    };

    return (
      <Button
        key={action.id}
        variant="outline"
        onClick={() => handleActionClick(action)}
        disabled={action.disabled}
        className={cn(
          "relative border-2 transition-all duration-200 hover:shadow-md",
          sizeClasses[size],
          action.disabled && "opacity-50 cursor-not-allowed",
          !action.disabled && "hover:scale-105"
        )}
        style={{
          borderColor: action.color + '20',
          backgroundColor: action.bgColor + '10'
        }}
      >
        <div className={cn("flex items-center justify-center rounded-full p-2", action.bgColor)}>
          <div className={action.color}>
            {React.cloneElement(action.icon as React.ReactElement, {
              className: iconSizes[size]
            })}
          </div>
        </div>

        <div className="text-center">
          <p className={cn(
            "font-semibold text-gray-900 line-clamp-1",
            size === 'small' ? "text-xs" : size === 'medium' ? "text-sm" : "text-base"
          )}>
            {action.title}
          </p>
          {size !== 'small' && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {action.estimatedTime || action.description}
            </p>
          )}
        </div>

        {action.badge && (
          <Badge className="absolute -top-1 -right-1 h-5 px-1.5 text-xs bg-red-500 text-white border-none">
            {action.badge}
          </Badge>
        )}

        {action.priority === 'high' && (
          <div className="absolute top-1 left-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}

        {action.shortcut && size === 'large' && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs px-1">
              {action.shortcut}
            </Badge>
          </div>
        )}
      </Button>
    );
  };

  const renderGridView = () => (
    <div className="space-y-6">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {showCategories && (
        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          <Button
            variant={selectedCategory === 'primary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('primary')}
          >
            Primary
          </Button>
          <Button
            variant={selectedCategory === 'secondary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('secondary')}
          >
            Secondary
          </Button>
          <Button
            variant={selectedCategory === 'utility' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('utility')}
          >
            Utilities
          </Button>
        </div>
      )}

      {searchQuery ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results ({filteredActions.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredActions.map(action => renderActionButton(action, 'medium'))}
          </div>
        </div>
      ) : (
        actionGroups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {group.actions
                .filter(action => selectedCategory === 'all' || action.category === selectedCategory)
                .map(action => renderActionButton(action, 'medium'))
              }
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCompactView = () => {
    const topActions = allActions
      .filter(action => action.priority === 'high' || action.category === 'primary')
      .slice(0, 8);

    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#1993e5]" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {topActions.map(action => renderActionButton(action, 'small'))}
          </div>

          {allActions.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              onClick={() => setShowAllActions(true)}
            >
              View All Actions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderListView = () => (
    <div className="space-y-3">
      {filteredActions.map((action) => (
        <Card
          key={action.id}
          className={cn(
            "border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleActionClick(action)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                <div className={action.color}>
                  {React.cloneElement(action.icon as React.ReactElement, {
                    className: "w-6 h-6"
                  })}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  {action.badge && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {action.badge}
                    </Badge>
                  )}
                  {action.priority === 'high' && (
                    <Zap className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
                {action.estimatedTime && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {action.estimatedTime}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {action.shortcut && (
                  <Badge variant="secondary" className="text-xs">
                    {action.shortcut}
                  </Badge>
                )}
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFloatingView = () => {
    const primaryActions = allActions.filter(action =>
      action.category === 'primary' && action.priority === 'high'
    ).slice(0, 4);

    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-3">
          {primaryActions.map((action, index) => (
            <Button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                "transform hover:scale-110",
                action.color.includes('blue') && "bg-blue-600 hover:bg-blue-700",
                action.color.includes('green') && "bg-green-600 hover:bg-green-700",
                action.color.includes('purple') && "bg-purple-600 hover:bg-purple-700"
              )}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {React.cloneElement(action.icon as React.ReactElement, {
                className: "w-6 h-6 text-white"
              })}
            </Button>
          ))}
        </div>

        {/* Main FAB */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-16 h-16 rounded-full bg-[#1993e5] hover:bg-[#1680cc] shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 mt-4">
              <Plus className="w-8 h-8 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Quick Actions</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <QuickActions
                actionGroups={actionGroups}
                onActionClick={onActionClick}
                variant="grid"
                showSearch={true}
                showCategories={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  if (variant === 'compact') {
    return <div className={className}>{renderCompactView()}</div>;
  }

  if (variant === 'list') {
    return <div className={className}>{renderListView()}</div>;
  }

  if (variant === 'floating') {
    return renderFloatingView();
  }

  return <div className={className}>{renderGridView()}</div>;
}

// Example usage component with sample data
export function QuickActionsExample() {
  const sampleActionGroups: QuickActionGroup[] = [
    {
      id: 'applications',
      title: 'Applications & Jobs',
      description: 'Manage your job applications and search',
      actions: [
        {
          id: 'new-application',
          title: 'New Application',
          description: 'Start a new job application',
          icon: <FileText />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          category: 'primary',
          priority: 'high',
          estimatedTime: '5-10 min',
          shortcut: 'Ctrl+N',
          action: () => console.log('New application')
        },
        {
          id: 'search-jobs',
          title: 'Search Jobs',
          description: 'Find your next opportunity',
          icon: <Search />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          category: 'primary',
          priority: 'high',
          estimatedTime: '2 min',
          action: () => console.log('Search jobs')
        },
        {
          id: 'saved-jobs',
          title: 'Saved Jobs',
          description: 'View your bookmarked positions',
          icon: <Bookmark />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          category: 'secondary',
          priority: 'medium',
          badge: '12',
          action: () => console.log('Saved jobs')
        },
        {
          id: 'application-status',
          title: 'Check Status',
          description: 'Track application progress',
          icon: <BarChart3 />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          category: 'secondary',
          priority: 'medium',
          action: () => console.log('Application status')
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile & Documents',
      description: 'Manage your professional profile',
      actions: [
        {
          id: 'update-profile',
          title: 'Update Profile',
          description: 'Keep your profile current',
          icon: <User />,
          color: 'text-teal-600',
          bgColor: 'bg-teal-100',
          category: 'primary',
          priority: 'high',
          estimatedTime: '3-5 min',
          action: () => console.log('Update profile')
        },
        {
          id: 'upload-resume',
          title: 'Upload Resume',
          description: 'Add your latest resume',
          icon: <Upload />,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          category: 'primary',
          priority: 'medium',
          estimatedTime: '1 min',
          action: () => console.log('Upload resume')
        },
        {
          id: 'profile-views',
          title: 'Profile Views',
          description: 'See who viewed your profile',
          icon: <Eye />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          category: 'secondary',
          priority: 'low',
          badge: '5',
          action: () => console.log('Profile views')
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Stay connected with recruiters',
      actions: [
        {
          id: 'schedule-interview',
          title: 'Schedule Interview',
          description: 'Book your next interview',
          icon: <Calendar />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          category: 'primary',
          priority: 'high',
          estimatedTime: '2 min',
          badge: '2',
          action: () => console.log('Schedule interview')
        },
        {
          id: 'messages',
          title: 'Messages',
          description: 'Check recruiter messages',
          icon: <MessageCircle />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          category: 'primary',
          priority: 'high',
          badge: '3',
          action: () => console.log('Messages')
        }
      ]
    },
    {
      id: 'utilities',
      title: 'Utilities',
      description: 'Tools and settings',
      actions: [
        {
          id: 'export-data',
          title: 'Export Data',
          description: 'Download your data',
          icon: <Download />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          category: 'utility',
          priority: 'low',
          action: () => console.log('Export data')
        },
        {
          id: 'share-profile',
          title: 'Share Profile',
          description: 'Share your profile link',
          icon: <Share2 />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          category: 'utility',
          priority: 'low',
          action: () => console.log('Share profile')
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'Configure preferences',
          icon: <Settings />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          category: 'utility',
          priority: 'low',
          shortcut: 'Ctrl+,',
          action: () => console.log('Settings')
        }
      ]
    }
  ];

  const handleActionClick = (actionId: string) => {
    console.log('Action clicked:', actionId);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Quick Actions Examples</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Compact View</h3>
          <QuickActions
            actionGroups={sampleActionGroups}
            onActionClick={handleActionClick}
            variant="compact"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">List View</h3>
          <div className="max-h-96 overflow-y-auto">
            <QuickActions
              actionGroups={sampleActionGroups}
              onActionClick={handleActionClick}
              variant="list"
              showSearch={false}
              showCategories={false}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Grid View (Full)</h3>
        <QuickActions
          actionGroups={sampleActionGroups}
          onActionClick={handleActionClick}
          variant="grid"
          showSearch={true}
          showCategories={true}
        />
      </div>

      {/* Floating Actions will appear in bottom right corner */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Floating Actions</h3>
        <p className="text-gray-600 text-sm">
          Check the bottom-right corner for floating action buttons.
        </p>
        <QuickActions
          actionGroups={sampleActionGroups}
          onActionClick={handleActionClick}
          variant="floating"
        />
      </div>
    </div>
  );
}