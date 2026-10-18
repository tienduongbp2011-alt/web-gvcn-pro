import React from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  CalendarCheck, 
  MessageSquareQuote, 
  UsersRound, 
  Network, 
  Trophy, 
  BookOpenCheck, 
  Grid3X3, 
  Clock, 
  Wallet, 
  Disc, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { sound } from '../utils/audio';

export type NavItemKey = 
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'remarks'
  | 'groups'
  | 'teams'
  | 'emulation'
  | 'grades'
  | 'seating'
  | 'timetable'
  | 'fund'
  | 'wheel'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS: { key: NavItemKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { key: 'classes', label: 'Lớp học', icon: School },
  { key: 'students', label: 'Học sinh', icon: Users },
  { key: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
  { key: 'remarks', label: 'Thông báo & Nhận xét', icon: MessageSquareQuote },
  { key: 'groups', label: 'Chia nhóm học tập', icon: UsersRound },
  { key: 'teams', label: 'Chia tổ học sinh', icon: Network },
  { key: 'emulation', label: 'Thi đua lớp', icon: Trophy },
  { key: 'grades', label: 'Sổ điểm cá nhân', icon: BookOpenCheck },
  { key: 'seating', label: 'Sơ đồ lớp', icon: Grid3X3 },
  { key: 'timetable', label: 'Thời khóa biểu', icon: Clock },
  { key: 'fund', label: 'Quỹ lớp', icon: Wallet },
  { key: 'wheel', label: 'Vòng quay may mắn', icon: Disc },
  { key: 'reports', label: 'Báo cáo thống kê', icon: BarChart3 },
  { key: 'settings', label: 'Cài đặt và dữ liệu', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                  CLASS PRO
                </span>
                <span className="text-[11px] font-medium text-teal-700 block tracking-wide">
                  TRỢ LÝ CHỦ NHIỆM
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectView(item.key);
                  onCloseMobile();
                  sound.playClick();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!collapsed && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            <div className="text-[11px] text-slate-500 text-center leading-relaxed">
              Phiên bản 1.0.0 · Thiết kế cho THCS
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
