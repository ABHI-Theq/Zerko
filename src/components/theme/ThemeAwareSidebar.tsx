'use client';

import React from 'react';
import { 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from '@/components/ui/sidebar';
import { ThemeToggleSimple } from './ThemeToggleSimple';
import { User, Settings } from 'lucide-react';

interface ThemeAwareSidebarFooterProps {
  showThemeToggle?: boolean;
  showUserInfo?: boolean;
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  children?: React.ReactNode;
}

export function ThemeAwareSidebarFooter({ 
  showThemeToggle = true, 
  showUserInfo = false,
  userInfo,
  children 
}: ThemeAwareSidebarFooterProps) {
  return (
    <SidebarFooter>
      <SidebarMenu>
        {showUserInfo && userInfo && (
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userInfo.name}</span>
                <span className="text-xs text-muted-foreground">{userInfo.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        
        {children}
        
        {showThemeToggle && (
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Theme</span>
              </div>
              <ThemeToggleSimple />
            </div>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarFooter>
  );
}