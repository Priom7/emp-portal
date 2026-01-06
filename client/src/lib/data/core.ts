import {
  Users,
  Clock,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Home,
  Briefcase,
  TrendingUp,
  Mail,
  PieChart,
  Download,
  Upload,
  CalendarDays,
  Wrench,
  ShieldCheck,
  Package,
  Boxes,
  KeyRound,
  GitBranch,
} from "lucide-react";

export const mockUser = {
  name: "Sarah Jenkins",
  role: "Senior UX Designer",
  id: "EMP-2024-001",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
  department: "Design Team",
  email: "sarah.j@company.com",
  startDate: "2022-03-15",
  manager: "David Chen",
  phone: "+44 7700 900000",
  address: "123 Creative Lane, London, UK",
  emergencyContact: "Michael Jenkins (Spouse) - +44 7700 900001"
};

export const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: CalendarDays, label: "Team Calendar", href: "/manager/calendar", managerOnly: true },
  { icon: ShieldCheck, label: "Manager Hub", href: "/manager", managerOnly: true },
  { icon: Clock, label: "Time & Attendance", href: "/attendance" },
  { icon: Calendar, label: "My Holidays", href: "/holidays" },
  { icon: Users, label: "My Team", href: "/team", managerOnly: true },
  { icon: Briefcase, label: "Employment", href: "/employment" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: TrendingUp, label: "Analytics", href: "/analytics" },
  { icon: Wrench, label: "Dev Tools", href: "/dev" },
];

export const announcements = [
  {
    id: 1,
    title: "New Health & Safety Guidelines",
    date: "2025-12-08",
    priority: "high",
    content: "Please review the updated safety protocols for the office."
  },
  {
    id: 2,
    title: "Annual Leave Carry Over",
    date: "2025-12-01",
    priority: "medium",
    content: "Remember to book your remaining holidays before end of March."
  }
];

export const teamMembers = [
  { id: "44014", name: "Alex Thompson", status: "Present", clockIn: "08:45 AM", role: "Frontend Dev", department: "Engineering", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100" },
  { id: "44092", name: "Maria Garcia", status: "Present", clockIn: "09:00 AM", role: "Product Manager", department: "Product", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100" },
  { id: "44251", name: "James Wilson", status: "Half Day", clockIn: "09:15 AM", role: "Backend Dev", department: "Engineering", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100" },
  { id: "45023", name: "Sarah Parker", status: "On Leave", clockIn: "-", role: "Designer", department: "Design", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100" },
  { id: "45024", name: "Emily Blunt", status: "Late", clockIn: "09:45 AM", role: "QA Engineer", department: "Engineering", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100" },
];

export const holidayStats = {
  entitlement: 25,
  taken: 12.5,
  pending: 2,
  remaining: 10.5
};

export const upcomingHolidays = [
  { date: "2025-12-25", name: "Christmas Day", type: "Public" },
  { date: "2025-12-26", name: "Boxing Day", type: "Public" },
  { date: "2026-01-01", name: "New Year's Day", type: "Public" }
];

export const employmentHistory = [
  { role: "Senior UX Designer", company: "Planet Education Networks", startDate: "2022-03-15", endDate: "Present", type: "Full-time" },
  { role: "UX Designer", company: "TechSolutions Ltd", startDate: "2019-06-01", endDate: "2022-03-01", type: "Full-time" },
  { role: "Junior Designer", company: "Creative Agency", startDate: "2018-01-10", endDate: "2019-05-30", type: "Full-time" }
];

export const documents = [
  { id: 1, name: "Employment Contract.pdf", category: "Contracts", date: "2022-03-15", size: "2.4 MB" },
  { id: 2, name: "Employee Handbook 2025.pdf", category: "Policies", date: "2025-01-01", size: "5.1 MB" },
  { id: 3, name: "Health & Safety Policy.pdf", category: "Policies", date: "2024-06-12", size: "1.2 MB" },
  { id: 4, name: "Payslip_Nov_2025.pdf", category: "Payroll", date: "2025-11-28", size: "0.5 MB" },
  { id: 5, name: "Payslip_Oct_2025.pdf", category: "Payroll", date: "2025-10-28", size: "0.5 MB" }
];

export const analyticsData = [
  { month: 'Jan', attendance: 98, leaves: 2, late: 1 },
  { month: 'Feb', attendance: 95, leaves: 5, late: 3 },
  { month: 'Mar', attendance: 97, leaves: 3, late: 0 },
  { month: 'Apr', attendance: 92, leaves: 8, late: 4 },
  { month: 'May', attendance: 96, leaves: 4, late: 2 },
  { month: 'Jun', attendance: 94, leaves: 6, late: 1 },
];

export const teamLeaveEvents = [
  { id: 1, userId: "44014", name: "Alex Thompson", type: "Full Day", status: "Approved", start: "2025-12-24", end: "2025-12-26" },
  { id: 2, userId: "45023", name: "Sarah Parker", type: "Full Day", status: "Approved", start: "2025-12-10", end: "2025-12-15" },
  { id: 3, userId: "44251", name: "James Wilson", type: "Half Day AM", status: "Approved", start: "2025-12-12", end: "2025-12-12" },
  { id: 4, userId: "44092", name: "Maria Garcia", type: "Half Day PM", status: "Pending", start: "2025-12-18", end: "2025-12-18" },
  { id: 5, userId: "45024", name: "Emily Blunt", type: "Full Day", status: "Rejected", start: "2025-12-20", end: "2025-12-20" },
];