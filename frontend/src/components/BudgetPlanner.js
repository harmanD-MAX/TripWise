"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { Plus, Trash2, PieChart, DollarSign, Loader2 } from "lucide-react";

export default function BudgetPlanner({ tripId, initialBudgetStr }) {
  const { getToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  
  const categories = ["Accommodation", "Food", "Transportation", "Shopping", "Activities", "Other"];

  // Parse budget number from string like "$2000" or "Moderate"
  // For simplicity, if it's not a number, we'll assume a default or 0
  const parseBudget = (str) => {
    if (!str) return 0;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };
  
  const totalBudget = parseBudget(initialBudgetStr);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const token = await getToken();
        const res = await api.get(`/api/trips/${tripId}/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(res.data);
      } catch (err) {
        console.error("Failed to fetch expenses", err);
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, [tripId, getToken]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    setAdding(true);
    try {
      const token = await getToken();
      const res = await api.post(`/api/trips/${tripId}/expenses`, {
        name,
        amount: parseFloat(amount),
        category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setExpenses([...expenses, res.data]);
      setName("");
      setAmount("");
      setCategory("Other");
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const token = await getToken();
      await api.delete(`/api/trips/${tripId}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense");
    }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = totalBudget > 0 ? totalBudget - totalSpent : 0;
  const progressPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="bg-[#2A2B32] rounded-2xl border border-gray-700 overflow-hidden shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="h-6 w-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Budget Planner</h2>
      </div>

      {totalBudget > 0 && (
        <div className="mb-8 bg-[#202123] p-6 rounded-xl border border-gray-700">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Spent</p>
              <h3 className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-400">Remaining Budget</p>
              <h3 className={`text-xl font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                ${remaining.toFixed(2)}
              </h3>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className={`h-3 rounded-full ${progressPercent > 90 ? 'bg-red-500' : progressPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 text-right">Target Budget: ${totalBudget.toFixed(2)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4">Add Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Expense Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Flight to Paris"
                className="w-full bg-[#202123] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                min="0"
                step="0.01"
                className="w-full bg-[#202123] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#202123] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Expense
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Expense List</h3>
          {expenses.length === 0 ? (
            <div className="p-8 text-center bg-[#202123] border border-gray-700 rounded-xl">
              <DollarSign className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 bg-[#202123] border border-gray-700 rounded-xl hover:border-gray-500 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{exp.name}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-300 mt-1 inline-block">{exp.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-white">${exp.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
