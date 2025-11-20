import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Ticket, TicketStatus, TicketPriority, User } from '../types';
import { CheckCircle, Clock, AlertCircle, Activity, Calendar, TrendingUp } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  currentUser: User;
}

const COLORS = {
  OPEN: '#3b82f6', // Blue
  IN_PROGRESS: '#eab308', // Yellow
  RESOLVED: '#22c55e', // Green
  CLOSED: '#64748b' // Slate
};

const PRIORITY_COLORS = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
};

export const Dashboard: React.FC<DashboardProps> = ({ tickets, currentUser }) => {
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === TicketStatus.OPEN).length;
    const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
    const critical = tickets.filter(t => t.priority === TicketPriority.CRITICAL && t.status !== TicketStatus.CLOSED).length;
    
    // Data for Status Pie Chart
    const statusData = [
      { name: 'Aberto', value: tickets.filter(t => t.status === TicketStatus.OPEN).length },
      { name: 'Em Andamento', value: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length },
      { name: 'Resolvido', value: tickets.filter(t => t.status === TicketStatus.RESOLVED).length },
      { name: 'Fechado', value: tickets.filter(t => t.status === TicketStatus.CLOSED).length },
    ].filter(d => d.value > 0);

    // Data for Priority Bar Chart
    const priorityData = [
      { name: 'Baixa', value: tickets.filter(t => t.priority === TicketPriority.LOW).length },
      { name: 'Média', value: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length },
      { name: 'Alta', value: tickets.filter(t => t.priority === TicketPriority.HIGH).length },
      { name: 'Crítica', value: tickets.filter(t => t.priority === TicketPriority.CRITICAL).length },
    ];

    // Data for Monthly Trends (Opened vs Resolved)
    const monthlyMap: Record<string, { name: string, opened: number, resolved: number, order: number }> = {};

    tickets.forEach(ticket => {
        // Process Opened Count
        const openDate = new Date(ticket.createdAt);
        // Key format: YYYY-MM to sort correctly
        const openKey = `${openDate.getFullYear()}-${String(openDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[openKey]) {
            const month = String(openDate.getMonth() + 1).padStart(2, '0');
            const year = String(openDate.getFullYear()).slice(-2);
            monthlyMap[openKey] = {
                name: `${month}/${year}`,
                opened: 0,
                resolved: 0,
                order: openDate.getTime() // approximate sorting
            };
        }
        monthlyMap[openKey].opened += 1;

        // Process Resolved Count
        if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
            const resolveDate = new Date(ticket.updatedAt);
            const resolveKey = `${resolveDate.getFullYear()}-${String(resolveDate.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyMap[resolveKey]) {
                const month = String(resolveDate.getMonth() + 1).padStart(2, '0');
                const year = String(resolveDate.getFullYear()).slice(-2);
                monthlyMap[resolveKey] = {
                    name: `${month}/${year}`,
                    opened: 0,
                    resolved: 0,
                    order: resolveDate.getTime()
                };
            }
            monthlyMap[resolveKey].resolved += 1;
        }
    });

    // Sort by date key (YYYY-MM)
    const monthlyData = Object.keys(monthlyMap)
        .sort()
        .map(key => monthlyMap[key]);
    
    // Calculate Efficiency Rate
    const efficiencyRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, open, resolved, critical, statusData, priorityData, monthlyData, efficiencyRate };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Welcome Banner Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-2xl font-bold text-slate-800">
               Olá, {currentUser.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
               {currentUser.role === 'DEV' 
                  ? 'Visão geral do desempenho do suporte técnico e métricas.' 
                  : 'Bem-vindo à sua central de solicitações e acompanhamento.'}
            </p>
         </div>
         
         <div className="flex gap-4 relative z-10">
            <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase opacity-70">Taxa de Resolução</p>
                    <p className="font-bold text-xl">{stats.efficiencyRate}%</p>
                </div>
            </div>
         </div>
         
         {/* Decorative background element */}
         <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none"></div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Chamados" value={stats.total} icon={<Activity className="w-6 h-6 text-blue-600" />} />
        <StatCard title="Chamados Abertos" value={stats.open} icon={<Clock className="w-6 h-6 text-yellow-600" />} />
        <StatCard title="Resolvidos" value={stats.resolved} icon={<CheckCircle className="w-6 h-6 text-green-600" />} />
        
        {/* Only Show Critical for DEV */}
        {currentUser.role === 'DEV' && (
            <StatCard title="Críticos Ativos" value={stats.critical} icon={<AlertCircle className="w-6 h-6 text-red-600" />} isAlert={stats.critical > 0} />
        )}
      </div>

      {/* Monthly Trend Chart - Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Evolução Mensal: Abertos vs Resolvidos</h3>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Abertos
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Resolvidos
                </div>
            </div>
        </div>
        <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="opened" name="Abertos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="resolved" name="Resolvidos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Chamados por Prioridade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.OPEN : index === 1 ? COLORS.IN_PROGRESS : index === 2 ? COLORS.RESOLVED : COLORS.CLOSED} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: number, icon: React.ReactNode, isAlert?: boolean }> = ({ title, value, icon, isAlert }) => (
  <div className={`p-6 rounded-xl shadow-sm border ${isAlert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${isAlert ? 'text-red-700' : 'text-slate-800'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${isAlert ? 'bg-red-100' : 'bg-slate-50'}`}>
        {icon}
      </div>
    </div>
  </div>
);