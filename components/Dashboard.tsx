
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Bill, BillStatus, User } from '../types';
import { DollarSign, AlertCircle, CheckCircle, TrendingDown, Wallet, Calendar } from 'lucide-react';

interface DashboardProps {
  bills: Bill[];
  currentUser: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({ bills, currentUser }) => {
  
  const stats = useMemo(() => {
    const totalAmount = bills.reduce((acc, bill) => acc + bill.amount, 0);
    const paidAmount = bills
        .filter(b => b.status === BillStatus.PAID)
        .reduce((acc, bill) => acc + bill.amount, 0);
    
    const pendingAmount = bills
        .filter(b => b.status === BillStatus.PENDING || b.status === BillStatus.OVERDUE)
        .reduce((acc, bill) => acc + bill.amount, 0);

    const overdueCount = bills.filter(b => b.status === BillStatus.OVERDUE).length;

    // Category Data for Pie Chart
    const categoryMap: Record<string, number> = {};
    bills.forEach(bill => {
        categoryMap[bill.category] = (categoryMap[bill.category] || 0) + bill.amount;
    });
    
    const categoryData = Object.keys(categoryMap).map(key => ({
        name: key,
        value: categoryMap[key]
    }));

    // Monthly Data for Bar Chart (Due Date)
    const monthlyMap: Record<string, { name: string, total: number }> = {};
    bills.forEach(bill => {
        const date = new Date(bill.dueDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
        
        if (!monthlyMap[key]) {
            monthlyMap[key] = { name: label, total: 0 };
        }
        monthlyMap[key].total += bill.amount;
    });

    const monthlyData = Object.keys(monthlyMap).sort().map(k => monthlyMap[k]);

    return { totalAmount, paidAmount, pendingAmount, overdueCount, categoryData, monthlyData };
  }, [bills]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-2xl font-bold text-slate-800">
               Finanças do Apê 🏠
            </h1>
            <p className="text-slate-500 mt-1">
               Olá, {currentUser.name.split(' ')[0]}. Aqui está o resumo das suas contas.
            </p>
         </div>
         <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none"></div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
            title="Total Pago" 
            value={`R$ ${stats.paidAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} 
            color="bg-emerald-50 text-emerald-700"
        />
        <StatCard 
            title="A Pagar (Pendente)" 
            value={`R$ ${stats.pendingAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            icon={<ClockIcon className="w-6 h-6 text-yellow-600" />} 
            color="bg-yellow-50 text-yellow-700"
        />
        <StatCard 
            title="Contas Vencidas" 
            value={stats.overdueCount} 
            icon={<AlertCircle className="w-6 h-6 text-red-600" />} 
            color="bg-red-50 text-red-700"
            isAlert={stats.overdueCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <Calendar className="w-5 h-5 text-slate-400" /> Fluxo de Gastos Mensal
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <Wallet className="w-5 h-5 text-slate-400" /> Gastos por Categoria
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon for pending
const ClockIcon = ({className}: {className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string, isAlert?: boolean }> = ({ title, value, icon, color, isAlert }) => (
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
