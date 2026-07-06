"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { Plus, Trash2, PieChart, DollarSign, Loader2, Sparkles, TrendingUp, TrendingDown, Target, Edit2, Check, AlertTriangle, ThumbsUp } from "lucide-react";

export default function BudgetPlanner({ tripId, initialBudgetStr, trip }) {
  const { getToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const predictionFetchedRef = useRef(false);

  const parsePredictionStr = (data) => {
    if (!data) return null;
    try {
      if (typeof data === 'string') {
        const startIdx = data.indexOf('{');
        const endIdx = data.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          return JSON.parse(data.substring(startIdx, endIdx + 1));
        }
        return JSON.parse(data);
      }
      return data;
    } catch (e) {
      return null;
    }
  };

  const initialPrediction = useMemo(() => parsePredictionStr(trip?.budgetPredictionJson || trip?.budget_prediction_json), [trip]);
  const [prediction, setPrediction] = useState(initialPrediction);
  const predicting = false; // Never predicting on mount anymore, rely entirely on the DB
  
  useEffect(() => {
    setPrediction(initialPrediction);
  }, [initialPrediction]);

  const categories = ["Accommodation", "Food", "Transportation", "Shopping", "Activities", "Other"];
  const categoryColors = {
    "Accommodation": "#FF3366",
    "Food": "#1CFEBA",
    "Transportation": "#00B4D8",
    "Shopping": "#9B51E0",
    "Activities": "#FF8A00",
    "Other": "#9CA3AF"
  };

  const [expenseInputs, setExpenseInputs] = useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: "" }), {})
  );
  const [addingCategory, setAddingCategory] = useState(null);

  const parseBudget = (str) => {
    if (!str) return 0;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const [userBudget, setUserBudget] = useState(parseBudget(initialBudgetStr));
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");

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
      }
    }

    async function initData() {
      await fetchExpenses();
      setLoading(false);
    }

    initData();
  }, [tripId, getToken]);

  const handleSaveBudget = async () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) {
      setUserBudget(val);
      try {
        const token = await getToken();
        await api.put(`/api/trips/${tripId}/budget`, { budget: val.toString() }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to save budget", err);
      }
    }
    setIsEditingBudget(false);
  };

  const handleAddPresetExpense = async (category) => {
    const amt = parseFloat(expenseInputs[category]);
    if (isNaN(amt) || amt <= 0) return;

    setAddingCategory(category);
    try {
      const token = await getToken();
      const res = await api.post(`/api/trips/${tripId}/expenses`, {
        name: category,
        amount: amt,
        category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExpenses([...expenses, res.data]);
      setExpenseInputs(prev => ({ ...prev, [category]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    } finally {
      setAddingCategory(null);
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
  const expectedSpend = prediction?.expected_spend || prediction?.expectedSpend || 0;
  const currency = prediction?.currency_symbol || prediction?.currencySymbol || '$';

  // Calculate expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    const grouped = categories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {});
    expenses.forEach(e => {
      if (grouped[e.category] !== undefined) {
        grouped[e.category] += e.amount;
      } else {
        grouped["Other"] += e.amount;
      }
    });
    return grouped;
  }, [expenses]);

  const pieChartBackground = useMemo(() => {
    if (totalSpent === 0) return "conic-gradient(#374151 0deg, #374151 360deg)";
    let currentAngle = 0;
    const gradients = [];
    categories.forEach(cat => {
      const amount = expensesByCategory[cat];
      if (amount > 0) {
        const percentage = amount / totalSpent;
        const degrees = percentage * 360;
        gradients.push(`${categoryColors[cat]} ${currentAngle}deg ${currentAngle + degrees}deg`);
        currentAngle += degrees;
      }
    });
    return `conic-gradient(${gradients.join(', ')})`;
  }, [expensesByCategory, totalSpent]);

  // Recommendation logic
  let recommendation = null;
  if (!predicting && expectedSpend > 0 && userBudget > 0) {
    const diff = userBudget - expectedSpend;
    if (diff >= 0) {
      recommendation = {
        icon: <ThumbsUp className="h-8 w-8 text-green-400 mb-2" />,
        title: "Yes, Do It!",
        text: `You have a comfortable buffer of ${currency}${diff.toFixed(2)}. The expected spend fits nicely within your pocket!`,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/30"
      };
    } else {
      recommendation = {
        icon: <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />,
        title: "Warning: Over Budget",
        text: `You are projected to be over budget by ${currency}${Math.abs(diff).toFixed(2)}. Consider increasing your budget or looking for cheaper alternatives to make this trip viable.`,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30"
      };
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="bg-[#2A2B32] rounded-2xl border border-gray-700 overflow-hidden shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="h-6 w-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Budget & Predictions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* User Budget (Left) */}
        <div className="bg-[#202123] p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Set Budget</p>
              </div>
              {!isEditingBudget && (
                <button onClick={() => { setTempBudget(userBudget.toString()); setIsEditingBudget(true); }} className="text-gray-400 hover:text-white p-1">
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {isEditingBudget ? (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-3xl font-black text-gray-400">{currency}</span>
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="bg-black/40 text-4xl font-black text-white w-40 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={handleSaveBudget} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg ml-2 transition-colors">
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <h3 className="text-4xl font-black text-white mb-6">{currency}{userBudget.toFixed(2)}</h3>
            )}
          </div>

          <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Actual spending so far</p>
            <h4 className="text-2xl font-bold text-white">
              {currency}{totalSpent.toFixed(2)}
            </h4>
          </div>
        </div>

        {/* AI Prediction (Right) */}
        <div className="relative p-6 rounded-xl border border-indigo-500/50 overflow-hidden flex flex-col justify-between shadow-[0_0_15px_rgba(99,102,241,0.15)] group">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"
              alt="Finance"
              className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c20]/95 to-[#1c1c20]/80"></div>
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider">AI Expected Spend</p>
              </div>
              {!predicting && prediction && (
                <div className="bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-md">
                  <p className="text-xs font-bold text-indigo-300">{prediction.confidence}% Confidence</p>
                </div>
              )}
            </div>

            {predicting ? (
              <div className="flex flex-col h-full animate-pulse mt-8">
                <div className="flex items-end gap-3 mb-4">
                  <div className="h-10 bg-indigo-500/30 rounded w-40"></div>
                  <div className="h-5 bg-indigo-500/20 rounded w-16 mb-1"></div>
                </div>
                <div className="h-14 bg-indigo-500/20 rounded w-full border-l-2 border-indigo-500/50"></div>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3 mb-4 mt-2">
                  <h3 className="text-4xl font-black text-white">{currency}{expectedSpend.toFixed(2)}</h3>
                  {userBudget > 0 && expectedSpend > userBudget ? (
                    <span className="flex items-center text-red-400 text-sm font-bold mb-1"><TrendingUp className="h-4 w-4 mr-1" /> Over</span>
                  ) : (
                    <span className="flex items-center text-green-400 text-sm font-bold mb-1"><TrendingDown className="h-4 w-4 mr-1" /> Under</span>
                  )}
                </div>

                <p className="text-sm text-indigo-200/80 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3">
                  "{prediction?.explanation || 'Based on real-time data for your destination and travel style.'}"
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {recommendation && (
        <div className={`mb-10 p-6 rounded-xl border ${recommendation.border} ${recommendation.bg} flex items-center gap-6`}>
          <div className="hidden sm:block">{recommendation.icon}</div>
          <div>
            <h3 className={`text-xl font-bold ${recommendation.color} mb-1`}>{recommendation.title}</h3>
            <p className="text-gray-300">{recommendation.text}</p>
          </div>
        </div>
      )}

      {/* Expenses Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Quick Add Presets */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Quick Add Expenses</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat} className="bg-[#202123] border border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[cat] }}></div>
                  <span className="font-semibold text-gray-200 text-sm truncate">{cat}</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currency}</span>
                    <input
                      type="number"
                      value={expenseInputs[cat]}
                      onChange={(e) => setExpenseInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg pl-6 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-green-400"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={() => handleAddPresetExpense(cat)}
                    disabled={addingCategory === cat || !expenseInputs[cat]}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center w-10"
                  >
                    {addingCategory === cat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4">Expense Log</h3>
            {expenses.length === 0 ? (
              <div className="p-8 text-center bg-[#202123] border border-gray-700 rounded-xl border-dashed">
                <DollarSign className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No expenses recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-[#202123] border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[exp.category] }}></div>
                      <h4 className="font-semibold text-white text-sm">{exp.category}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white text-sm">{currency}{exp.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1 flex flex-col items-center justify-start bg-[#202123] border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 w-full text-left">Spending Breakdown</h3>

          <div className="relative w-48 h-48 mb-8">
            <div
              className="w-full h-full rounded-full"
              style={{ background: pieChartBackground, transition: "background 0.5s ease" }}
            ></div>
            {/* Inner circle to make it a donut chart */}
            <div className="absolute inset-[15%] bg-[#202123] rounded-full flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total</span>
              <span className="text-xl font-black text-white">{currency}{totalSpent.toFixed(0)}</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {categories.map(cat => {
              const amount = expensesByCategory[cat];
              if (amount === 0 && totalSpent > 0) return null;
              const percent = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
              return (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[cat] }}></div>
                    <span className="text-gray-300">{cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{currency}{amount.toFixed(0)}</span>
                    <span className="text-gray-500 text-xs w-8 text-right">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
