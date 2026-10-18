import * as XLSX from 'xlsx';
import { Student, StudentRole } from '../types';

export interface ParsedStudentResult {
  students: Student[];
  errors: string[];
  totalRows: number;
}

const VALID_ROLES: StudentRole[] = [
  'Thành viên',
  'Lớp trưởng',
  'Lớp phó học tập',
  'Lớp phó lao động',
  'Tổ trưởng',
  'Tổ phó',
  'Thủ quỹ',
  'Ủy viên'
];

/**
 * Format Excel date (serial number or string) to YYYY-MM-DD
 */
function normalizeBirthDate(rawVal: any): string {
  if (!rawVal) return '2010-01-01';

  // If number (Excel serial date)
  if (typeof rawVal === 'number') {
    // Excel base date is Dec 30 1899
    const dateObj = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(rawVal).trim();
  // Check dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Check yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return '2010-01-01';
}

/**
 * Clean & match role
 */
function normalizeRole(rawVal: any): StudentRole {
  if (!rawVal) return 'Thành viên';
  const str = String(rawVal).trim().toLowerCase();
  for (const r of VALID_ROLES) {
    if (r.toLowerCase() === str) return r;
  }
  if (str.includes('lớp trưởng') || str.includes('lop truong')) return 'Lớp trưởng';
  if (str.includes('học tập') || str.includes('hoc tap')) return 'Lớp phó học tập';
  if (str.includes('lao động') || str.includes('lao dong')) return 'Lớp phó lao động';
  if (str.includes('tổ trưởng') || str.includes('to truong')) return 'Tổ trưởng';
  if (str.includes('tổ phó') || str.includes('to pho')) return 'Tổ phó';
  if (str.includes('thủ quỹ') || str.includes('thu quy')) return 'Thủ quỹ';
  if (str.includes('ủy viên') || str.includes('uy vien')) return 'Ủy viên';
  return 'Thành viên';
}

/**
 * Parse team number 1..4
 */
function normalizeTeam(rawVal: any): number {
  if (!rawVal) return 1;
  const match = String(rawVal).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 4) return num;
  }
  return 1;
}

/**
 * Parse gender
 */
function normalizeGender(rawVal: any): 'Nam' | 'Nữ' {
  if (!rawVal) return 'Nam';
  const str = String(rawVal).trim().toLowerCase();
  if (str.includes('nữ') || str.includes('nu') || str === 'f' || str === 'female') {
    return 'Nữ';
  }
  return 'Nam';
}

/**
 * Parse Excel file (.xlsx, .xls) or CSV file buffer
 */
export async function parseStudentsExcelFile(
  file: File,
  classId: string,
  existingStudentsCount: number = 0
): Promise<ParsedStudentResult> {
  const errors: string[] = [];
  const students: Student[] = [];

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Use first worksheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { students: [], errors: ['Tệp Excel rỗng hoặc không tìm thấy Sheet dữ liệu.'], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Convert sheet to JSON rows as array of arrays or array of objects
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    return { students: [], errors: ['Tệp Excel cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu học sinh.'], totalRows: 0 };
  }

  // Find header row (it could be row 0, 1, or 2 if there are title rows)
  let headerIndex = -1;
  for (let r = 0; r < Math.min(6, rawRows.length); r++) {
    const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('tên') || rowStr.includes('họ') || rowStr.includes('mã hs') || rowStr.includes('student')) {
      headerIndex = r;
      break;
    }
  }

  // Fallback to row 0 if no header found
  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const headers = rawRows[headerIndex].map(h => String(h).trim().toLowerCase());

  // Map header column indices
  let colStt = headers.findIndex(h => h.includes('stt') || h === 'no' || h === '#');
  let colCode = headers.findIndex(h => h.includes('mã') || h.includes('code') || h.includes('id') || h.includes('sbd'));
  let colName = headers.findIndex(h => (h.includes('họ') && h.includes('tên')) || h.includes('họ tên') || h.includes('tên học sinh') || h === 'tên' || h.includes('name'));
  let colDob = headers.findIndex(h => h.includes('ngày sinh') || h.includes('sinh nhật') || h.includes('dob') || h.includes('birth'));
  let colGender = headers.findIndex(h => h.includes('giới tính') || h.includes('phái') || h.includes('gender') || h.includes('nam/nữ'));
  let colTeam = headers.findIndex(h => h.includes('tổ') || h.includes('nhóm') || h.includes('team') || h.includes('group'));
  let colRole = headers.findIndex(h => h.includes('chức vụ') || h.includes('vai trò') || h.includes('role'));
  let colPhone = headers.findIndex(h => (h.includes('sđt') || h.includes('điện thoại') || h.includes('phone')) && !h.includes('phụ huynh') && !h.includes('ph'));
  let colParentPhone = headers.findIndex(h => (h.includes('phụ huynh') || h.includes('bố') || h.includes('mẹ') || h.includes('ph')) && (h.includes('sđt') || h.includes('phone') || h.includes('điện thoại')));
  let colNotes = headers.findIndex(h => h.includes('ghi chú') || h.includes('lưu ý') || h.includes('note'));

  // If colName is still -1, try finding any column with "tên"
  if (colName === -1) {
    colName = headers.findIndex(h => h.includes('tên'));
  }

  // If colName is still -1, fallback to column 1 or 2
  if (colName === -1) {
    colName = headers.length > 2 && colStt === 0 ? 2 : 1;
  }

  const existingCodes = new Set<string>();
  let currentCodeCounter = existingStudentsCount + 1;

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check if empty row
    const rowText = row.map(c => String(c).trim()).join('');
    if (!rowText) continue;

    // Name
    const fullName = colName !== -1 && row[colName] ? String(row[colName]).trim() : '';
    if (!fullName) {
      // Row might be a footer / summary or empty
      continue;
    }

    // Code
    let code = colCode !== -1 && row[colCode] ? String(row[colCode]).trim() : '';
    if (!code) {
      code = `HS${String(currentCodeCounter).padStart(2, '0')}`;
      currentCodeCounter++;
    }

    // Ensure code uniqueness
    if (existingCodes.has(code.toUpperCase())) {
      code = `${code}_${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    }
    existingCodes.add(code.toUpperCase());

    // Dob
    const rawDob = colDob !== -1 ? row[colDob] : '';
    const birthDate = normalizeBirthDate(rawDob);

    // Gender
    const rawGender = colGender !== -1 ? row[colGender] : '';
    const gender = normalizeGender(rawGender);

    // Team
    const rawTeam = colTeam !== -1 ? row[colTeam] : '';
    const team = normalizeTeam(rawTeam);

    // Role
    const rawRole = colRole !== -1 ? row[colRole] : '';
    const role = normalizeRole(rawRole);

    // Phones & notes
    const phone = colPhone !== -1 && row[colPhone] ? String(row[colPhone]).trim() : '';
    const parentPhone = colParentPhone !== -1 && row[colParentPhone] ? String(row[colParentPhone]).trim() : '';
    const notes = colNotes !== -1 && row[colNotes] ? String(row[colNotes]).trim() : '';

    students.push({
      id: 'std_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      classId,
      code,
      fullName,
      birthDate,
      gender,
      team,
      role,
      phone,
      parentPhone,
      notes,
      coins: 0,
      status: 'active'
    });
  }

  return {
    students,
    errors,
    totalRows: rawRows.length - (headerIndex + 1)
  };
}

/**
 * Export students to styled Excel .xlsx file
 */
export function exportStudentsToExcel(students: Student[], className: string): void {
  const data: any[][] = [
    [`DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`],
    [`Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')} · Tổng số: ${students.length} học sinh`],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú', 'Xu thi đua']
  ];

  students.forEach((s, idx) => {
    data.push([
      idx + 1,
      s.code,
      s.fullName,
      s.birthDate,
      s.gender,
      `Tổ ${s.team}`,
      s.role,
      s.phone || '',
      s.parentPhone || '',
      s.notes || '',
      s.coins || 0
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 25 }, // Họ tên
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 8 },  // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 14 }, // SĐT
    { wch: 14 }, // SĐT PH
    { wch: 25 }, // Ghi chú
    { wch: 12 }  // Xu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Học sinh');

  const fileName = `Danh_sach_hoc_sinh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Download sample Excel template for teachers to import students
 */
export function downloadStudentTemplateExcel(): void {
  const data = [
    ['MẪU NHẬP DANH SÁCH HỌC SINH (CLASS PRO)'],
    ['* Thầy cô chỉ cần điền đầy đủ Họ và tên; Mã HS và Tổ nếu để trống hệ thống sẽ tự sinh tự động.'],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú'],
    [1, 'HS01', 'Nguyễn Văn An', '2010-03-15', 'Nam', 1, 'Lớp trưởng', '0912345601', '0987654301', 'Học giỏi Toán, gương mẫu'],
    [2, 'HS02', 'Trần Thị Bình', '2010-07-20', 'Nữ', 1, 'Lớp phó học tập', '0912345602', '0987654302', 'Chăm chỉ, tích cực'],
    [3, 'HS03', 'Lê Hoàng Cường', '2010-11-05', 'Nam', 2, 'Tổ trưởng', '0912345603', '0987654303', 'Nhiệt tình'],
    [4, 'HS04', 'Phạm Ngọc Diệp', '2010-05-18', 'Nữ', 2, 'Thủ quỹ', '0912345604', '0987654304', 'Cẩn thận, minh bạch'],
    [5, 'HS05', 'Vũ Quốc Đạt', '2010-09-09', 'Nam', 3, 'Thành viên', '0912345605', '0987654305', '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Hoc_Sinh');

  XLSX.writeFile(workbook, 'Mau_Nhap_Danh_Sach_Hoc_Sinh.xlsx');
}

/**
 * Export full Class Fund (Quỹ lớp) report to Excel
 */
export function exportFundReportToExcel(
  className: string,
  teacherName: string,
  campaignTitle: string,
  contributions: { code?: string; studentName: string; team: number; amountPaid: number; paidDate: string; status: string; paymentMethod: string; note?: string }[],
  incomes: { title: string; amount: number; date: string; category: string; payerOrReceiver: string; notes?: string }[],
  expenses: { title: string; amount: number; date: string; category: string; payerOrReceiver: string; notes?: string }[]
): void {
  const workbook = XLSX.utils.book_new();

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  // Sheet 1: Báo cáo tổng hợp
  const summaryData: any[][] = [
    [`BÁO CÁO THU CHI QUỸ LỚP ${className.toUpperCase()}`],
    [`Giáo viên chủ nhiệm: ${teacherName} · Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['I. TỔNG QUAN TÀI CHÍNH QUỸ LỚP', 'SỐ TIỀN (VNĐ)'],
    ['1. Tổng nguồn thu', totalIncome],
    ['2. Tổng nguồn chi', totalExpense],
    ['3. TỒN QUỸ HIỆN TẠI', balance],
    [],
    ['II. NGUỒN THU THEO KHOẢN MỤC'],
    ['STT', 'Tên khoản thu', 'Số tiền (VNĐ)', 'Ngày thu', 'Danh mục', 'Người nộp/nguồn thu', 'Ghi chú']
  ];

  incomes.forEach((inc, idx) => {
    summaryData.push([
      idx + 1,
      inc.title,
      inc.amount,
      inc.date,
      inc.category,
      inc.payerOrReceiver,
      inc.notes || ''
    ]);
  });

  summaryData.push(
    [],
    ['III. NGUỒN CHI THEO KHOẢN MỤC'],
    ['STT', 'Tên khoản chi', 'Số tiền (VNĐ)', 'Ngày chi', 'Danh mục chi', 'Người nhận/phụ trách', 'Ghi chú']
  );

  expenses.forEach((exp, idx) => {
    summaryData.push([
      idx + 1,
      exp.title,
      exp.amount,
      exp.date,
      exp.category,
      exp.payerOrReceiver,
      exp.notes || ''
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Bao_Cao_Thu_Chi');

  // Sheet 2: Danh sách đóng tiền quỹ
  if (contributions.length > 0) {
    const contribData: any[][] = [
      [`DANH SÁCH ĐÓNG TIỀN QUỸ: ${campaignTitle.toUpperCase()}`],
      [`Lớp: ${className} · Tổng số: ${contributions.length} học sinh`],
      [],
      ['STT', 'Họ và tên học sinh', 'Tổ', 'Số tiền đã đóng (VNĐ)', 'Ngày nộp', 'Hình thức', 'Trạng thái', 'Ghi chú']
    ];

    contributions.forEach((c, idx) => {
      contribData.push([
        idx + 1,
        c.studentName,
        `Tổ ${c.team}`,
        c.amountPaid,
        c.paidDate || '—',
        c.paymentMethod || 'Tiền mặt',
        c.status === 'paid' ? 'Đã đóng đủ' : c.status === 'partial' ? 'Đóng một phần' : 'Chưa đóng',
        c.note || ''
      ]);
    });

    const wsContrib = XLSX.utils.aoa_to_sheet(contribData);
    wsContrib['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 8 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsContrib, 'Danh_Sach_Dong_Quy');
  }

  const fileName = `Bao_cao_thu_chi_quy_lop_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
