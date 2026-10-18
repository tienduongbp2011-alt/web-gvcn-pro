import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole, Student, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  students: Student[];
  currentClass: ClassInfo;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSelectRole,
  students,
  currentClass
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Find leaders
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const leaders: Record<number, Student | undefined> = {
    1: classStudents.find(s => s.team === 1 && s.role === 'Tổ trưởng'),
    2: classStudents.find(s => s.team === 2 && s.role === 'Tổ trưởng'),
    3: classStudents.find(s => s.team === 3 && s.role === 'Tổ trưởng'),
    4: classStudents.find(s => s.team === 4 && s.role === 'Tổ trưởng'),
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Default PIN is 123456, or allow direct login if PIN is empty or 123456
    if (pinInput.trim() && pinInput.trim() !== '123456') {
      setErrorMessage('Mã PIN không đúng (Mặc định: 123456)');
      sound.playError();
      return;
    }

    onSelectRole(selectedRole);
    sound.playSuccess();
    onClose();
  };

  const handleQuickLoginRole = (role: UserRole) => {
    setSelectedRole(role);
    onSelectRole(role);
    sound.playSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Đăng Nhập / Phân Quyền Tài Khoản
              </h3>
              <p className="text-xs text-slate-500">
                Lớp {currentClass.name} · Phân quyền chấm thi đua cho Tổ trưởng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-1">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            Quy định phân quyền & bảo mật tài khoản:
          </div>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            • <strong>Tài khoản Tổ trưởng</strong>: Chỉ được phép đăng nhập để <strong>chấm điểm thi đua chéo</strong> giữa các tổ. Hệ thống sẽ <strong>khóa hoàn toàn tất cả các tính năng khác</strong> (học sinh, điểm danh, sổ điểm, quỹ lớp, báo cáo...).
            <br />
            • <strong>Tài khoản GVCN</strong>: Toàn quyền truy cập mọi tính năng quản trị lớp học.
          </p>
        </div>

        {/* Account Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn tài khoản đăng nhập:
          </label>

          {/* GVCN Option */}
          <div 
            onClick={() => setSelectedRole('gvcn')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedRole === 'gvcn'
                ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400/50 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  Giáo viên chủ nhiệm
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                    Toàn quyền
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentClass.teacherName || 'Cô Mai Hoa'} · Quản lý đầy đủ sổ lớp
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUserRole === 'gvcn' && (
                <span className="text-[11px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                  Đang dùng
                </span>
              )}
              <input
                type="radio"
                name="user_role"
                checked={selectedRole === 'gvcn'}
                onChange={() => setSelectedRole('gvcn')}
                className="text-teal-600 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Team Leaders Options */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Tài khoản Tổ trưởng (Chỉ chấm thi đua):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map(tNum => {
                const roleKey = `to_${tNum}` as UserRole;
                const leader = leaders[tNum];
                const isSelected = selectedRole === roleKey;
                const isCurrent = currentUserRole === roleKey;

                return (
                  <div
                    key={tNum}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all text-left ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-900 flex items-center justify-center text-[11px] font-black">
                          {tNum}
                        </span>
                        Tổ trưởng Tổ {tNum}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          Đang dùng
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {leader ? leader.fullName : `Học sinh Tổ ${tNum}`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Chỉ truy cập: Thi đua lớp
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PIN Authentication Input */}
        <form onSubmit={handleLogin} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Mã PIN xác thực (Mặc định: <strong>123456</strong>):
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPin ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <input
              type={showPin ? 'text' : 'password'}
              placeholder="Nhập 123456 hoặc để trống để đăng nhập nhanh"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden tracking-widest font-mono"
            />
          </div>

          {errorMessage && (
            <div className="text-rose-600 font-semibold text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Đóng
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLoginRole(selectedRole)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-teal-800 rounded-xl font-bold flex items-center gap-1 transition-all"
                title="Bỏ qua nhập PIN và đăng nhập ngay"
              >
                Đăng nhập 1 chạm
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                Xác nhận đăng nhập
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
