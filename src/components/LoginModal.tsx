import React, { useState, useEffect } from 'react';
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
  EyeOff,
  Delete,
  CheckCircle2,
  RefreshCw
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
  // Tab: 'team_leader' (default) or 'gvcn'
  const [activeTab, setActiveTab] = useState<'team_leader' | 'gvcn'>('team_leader');

  // Selected team: 1, 2, 3, 4
  const [selectedTeam, setSelectedTeam] = useState<number>(() => {
    if (currentUserRole !== 'gvcn') {
      const parsed = parseInt(currentUserRole.replace('to_', ''), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) return parsed;
    }
    return 1;
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom password stored in localStorage (default is 123456)
  const [savedPassword, setSavedPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('classpro_team_password') || '123456';
    } catch {
      return '123456';
    }
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setErrorMessage(null);
      setChangePasswordSuccess(false);
      setShowChangePassword(false);
      if (currentUserRole !== 'gvcn') {
        setActiveTab('team_leader');
        const num = parseInt(currentUserRole.replace('to_', ''), 10);
        if (!isNaN(num)) setSelectedTeam(num);
      }
    }
  }, [isOpen, currentUserRole]);

  if (!isOpen) return null;

  // Find team leaders from student list
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const leaders: Record<number, Student | undefined> = {
    1: classStudents.find(s => s.team === 1 && s.role === 'Tổ trưởng'),
    2: classStudents.find(s => s.team === 2 && s.role === 'Tổ trưởng'),
    3: classStudents.find(s => s.team === 3 && s.role === 'Tổ trưởng'),
    4: classStudents.find(s => s.team === 4 && s.role === 'Tổ trưởng'),
  };

  // Target team rotation preview (e.g. Tổ 1 chấm Tổ 2, Tổ 2 chấm Tổ 3...)
  const targetTeam = selectedTeam === 4 ? 1 : selectedTeam + 1;

  // Keypad press handler
  const handleKeypadPress = (val: string) => {
    sound.playClick();
    setErrorMessage(null);
    if (val === 'C') {
      setPasswordInput('');
    } else if (val === 'BACK') {
      setPasswordInput(prev => prev.slice(0, -1));
    } else {
      if (passwordInput.length < 16) {
        setPasswordInput(prev => prev + val);
      }
    }
  };

  // Submit Login
  const handleLoginTeamLeader = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const entered = passwordInput.trim().toLowerCase();
    const validConfigured = savedPassword.trim().toLowerCase();
    const teamSpecificShort = `to${selectedTeam}`; // e.g. "to1", "to2"

    // Allow configured password, default 123456, or team shortcuts like "to1", "to2"
    const isValid = 
      entered === validConfigured || 
      entered === '123456' || 
      entered === teamSpecificShort ||
      entered === ''; // empty also accepted if teacher didn't require strict lock

    if (!isValid) {
      setErrorMessage(`Mật khẩu không chính xác! (Mặc định: 123456 hoặc to${selectedTeam})`);
      sound.playError();
      return;
    }

    const roleKey = `to_${selectedTeam}` as UserRole;
    onSelectRole(roleKey);
    sound.playFanfare();
    onClose();
  };

  // Login as Homeroom Teacher (GVCN)
  const handleLoginGVCN = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSelectRole('gvcn');
    sound.playSuccess();
    onClose();
  };

  // Handle Save New Password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    try {
      localStorage.setItem('classpro_team_password', newPassword.trim());
      setSavedPassword(newPassword.trim());
      setChangePasswordSuccess(true);
      setShowChangePassword(false);
      setNewPassword('');
      sound.playSuccess();
      setTimeout(() => setChangePasswordSuccess(false), 4000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Đăng Nhập Tổ Trưởng – Chấm Thi Đua Chéo
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lớp {currentClass.name} · Phân quyền vào thẳng giao diện chấm điểm chéo các tổ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('team_leader');
              setErrorMessage(null);
              sound.playClick();
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'team_leader'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tổ trưởng chấm chéo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gvcn');
              setErrorMessage(null);
              sound.playClick();
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gvcn'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Giáo viên chủ nhiệm</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {activeTab === 'team_leader' ? (
            <>
              {/* Security Rule Information */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  Quy định chấm thi đua chéo khách quan:
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Khi đăng nhập với quyền Tổ trưởng, bạn sẽ được <strong>vào thẳng mục Thi đua lớp</strong>. Để bảo mật dữ liệu lớp học, các chức năng quản trị khác (học sinh, điểm danh, sổ điểm, quỹ lớp...) sẽ được khóa lại.
                </p>
              </div>

              {/* Step 1: Select Team */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bước 1: Chọn tổ của bạn
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map(tNum => {
                    const isSelected = selectedTeam === tNum;
                    const leader = leaders[tNum];
                    const nextTeam = tNum === 4 ? 1 : tNum + 1;

                    return (
                      <div
                        key={tNum}
                        onClick={() => {
                          setSelectedTeam(tNum);
                          sound.playClick();
                        }}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all text-left relative ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-500 shadow-xs ring-2 ring-amber-300/60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-[11px] font-black">
                              {tNum}
                            </span>
                            Tổ {tNum}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800 truncate">
                          {leader ? leader.fullName : `Tổ trưởng Tổ ${tNum}`}
                        </div>

                        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-900 font-semibold">
                          <span>Chấm chéo:</span>
                          <span className="bg-amber-100 px-1.5 py-0.2 rounded font-extrabold text-amber-950">
                            👉 Tổ {nextTeam}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Password Input */}
              <form onSubmit={handleLoginTeamLeader} className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      Bước 2: Mật khẩu xác thực Tổ trưởng
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Ẩn' : 'Hiện'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mặc định: 123456 (hoặc để trống)"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden font-bold"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Mật khẩu mặc định: <strong className="text-slate-600 font-mono">123456</strong> hoặc <strong className="text-slate-600 font-mono">to{selectedTeam}</strong></span>
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="text-amber-700 hover:text-amber-900 font-semibold underline"
                    >
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>

                {/* Keypad for Quick Touch Entry */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1.5 text-center">
                    BÀN PHÍM SỐ CẢM ỨNG (TIỆN CHO ĐIỆN THOẠI & MÁY TÍNH BẢNG)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleKeypadPress(k)}
                        className={`py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-2xs ${
                          k === 'C'
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                            : k === 'BACK'
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center'
                            : 'bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {k === 'BACK' ? <Delete className="w-3.5 h-3.5" /> : k}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {changePasswordSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã cập nhật mật khẩu Tổ trưởng mới thành công!</span>
                  </div>
                )}

                {/* Change Password Form Drawer */}
                {showChangePassword && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="font-bold text-amber-900 text-xs">
                      Cài đặt mật khẩu mới cho các Tổ trưởng:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mật khẩu mới..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewPassword}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                      >
                        Lưu lại
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                  >
                    Đóng
                  </button>

                  <button
                    type="submit"
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <span>VÀO THẲNG MỤC THI ĐUA CHÉO</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Tab GVCN */
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-950 text-sm">
                      {currentClass.teacherName || 'Giáo viên chủ nhiệm'}
                    </h4>
                    <p className="text-[11px] text-teal-800">
                      Tài khoản Quản trị toàn quyền · Lớp {currentClass.name} ({currentClass.grade})
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed pt-2 border-t border-teal-200/60">
                  Truy cập đầy đủ tất cả các phân hệ: Hồ sơ học sinh, Điểm danh chuyên cần, Sổ điểm cá nhân, Sơ đồ lớp, Quỹ lớp, Báo cáo và Cài đặt hệ thống.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleLoginGVCN}
                  className="flex-1 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Đăng nhập quyền GVCN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
