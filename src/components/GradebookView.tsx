import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Plus, 
  Trash2, 
  Printer, 
  FileDown, 
  Search, 
  Filter, 
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { GradeEntry, Student, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface GradebookViewProps {
  currentClass: ClassInfo;
  students: Student[];
  grades: GradeEntry[];
  onAddGrade: (grade: Omit<GradeEntry, 'id'>) => void;
  onDeleteGrade: (id: string) => void;
}

const SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'KHTN (Khoa học tự nhiên)',
  'Lịch sử & Địa lý',
  'Giáo dục công dân (GDCD)',
  'Tin học',
  'Công nghệ',
  'Nghệ thuật (Âm nhạc/Mỹ thuật)',
  'Giáo dục thể chất (GDTC)',
  'Hoạt động trải nghiệm, hướng nghiệp'
];

const GRADE_TYPES: GradeEntry['gradeType'][] = [
  'ĐGTX 1',
  'ĐGTX 2',
  'ĐGTX 3',
  'ĐGTX 4',
  'Giữa kỳ',
  'Cuối kỳ'
];

export const GradebookView: React.FC<GradebookViewProps> = ({
  currentClass,
  students,
  grades,
  onAddGrade,
  onDeleteGrade
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classGrades = grades.filter(g => g.classId === currentClass.id);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  // Add Grade Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState<string>(classStudents[0]?.id || '');
  const [subject, setSubject] = useState<string>('Toán');
  const [gradeType, setGradeType] = useState<GradeEntry['gradeType']>('ĐGTX 1');
  const [score, setScore] = useState<number>(8.5);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    onAddGrade({
      classId: currentClass.id,
      studentId,
      subject,
      gradeType,
      score: Math.min(10, Math.max(0, Number(score))),
      date,
      note: note.trim()
    });

    sound.playSuccess();
    setShowAddModal(false);
    setNote('');
  };

  // Filtered grades
  const filteredGrades = classGrades.filter(g => {
    const matchSubject = selectedSubject === 'all' || g.subject === selectedSubject;
    const matchStudent = selectedStudentFilter === 'all' || g.studentId === selectedStudentFilter;
    return matchSubject && matchStudent;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['STT', 'Mã HS', 'Họ và tên', 'Môn học', 'Loại điểm', 'Điểm số', 'Ngày ghi', 'Ghi chú'];
    const rows = filteredGrades.map((g, idx) => {
      const st = classStudents.find(s => s.id === g.studentId);
      return [
        idx + 1,
        `"${st?.code || ''}"`,
        `"${st?.fullName || ''}"`,
        `"${g.subject}"`,
        `"${g.gradeType}"`,
        g.score,
        `"${g.date}"`,
        `"${(g.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_diem_ca_nhan_${currentClass.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-teal-600" />
            Sổ Điểm Cá Nhân & Theo Dõi Tiến Bộ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sổ ghi chép nội bộ giúp giáo viên chủ nhiệm theo dõi kết quả kiểm tra thường xuyên và định kỳ của học sinh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nhập kết quả điểm
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Xuất bảng điểm ra CSV"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In bảng điểm"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Môn học:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả môn học</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Học sinh:</span>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer max-w-[200px]"
            >
              <option value="all">Tất cả học sinh</option>
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          Hiển thị: <strong>{filteredGrades.length}</strong> bản ghi
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-3">Môn học</th>
                <th className="py-3 px-3">Loại điểm</th>
                <th className="py-3 px-3 text-center w-24">Điểm số</th>
                <th className="py-3 px-3 w-28">Ngày ghi</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-3 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpenCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
                    Chưa có điểm nào được ghi. Nhấn "Nhập kết quả điểm" để thêm.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => {
                  const st = classStudents.find(s => s.id === g.studentId);
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st?.fullName || 'Học sinh đã xóa'}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {st?.code} · Tổ {st?.team}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {g.subject}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {g.gradeType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-extrabold tabular-nums text-xs ${
                          g.score >= 8.0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : g.score >= 6.5 
                            ? 'bg-teal-100 text-teal-800' 
                            : g.score >= 5.0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {g.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 tabular-nums">
                        {g.date}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {g.note || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteGrade(g.id);
                            sound.playClick();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Xóa cột điểm này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-teal-600" />
                Ghi điểm kiểm tra học sinh
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                >
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.fullName} (Tổ {s.team})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại kiểm tra</label>
                  <select
                    value={gradeType}
                    onChange={(e) => setGradeType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {GRADE_TYPES.map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Điểm số (Thang 10) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-extrabold text-teal-800 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kiểm tra</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú của giáo viên</label>
                <input
                  type="text"
                  placeholder="VD: Kiểm tra 15 phút phần hình học, cần ôn lại lý thuyết..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
