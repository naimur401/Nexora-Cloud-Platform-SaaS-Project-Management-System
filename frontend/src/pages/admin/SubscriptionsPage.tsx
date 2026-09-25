
import { useEffect, useState } from 'react';
import axios from '../../services/axios.config';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('plans');
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ companyId: '', planId: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [plansRes, subsRes, billRes, compRes] = await Promise.all([
        axios.get('/admin/plans'),
        axios.get('/admin/subscriptions'),
        axios.get('/admin/billing'),
        axios.get('/admin/companies')
      ]);
      setPlans(plansRes.data.data);
      setSubscriptions(subsRes.data.data);
      setBilling(billRes.data.data);
      setCompanies(compRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const assignSubscription = async () => {
    if (!assignData.companyId || !assignData.planId) {
      toast.error('Please select company and plan');
      return;
    }
    try {
      await axios.post('/admin/subscriptions', {
        companyId: parseInt(assignData.companyId),
        planId: parseInt(assignData.planId)
      });
      toast.success('Subscription assigned');
      setShowAssignModal(false);
      setAssignData({ companyId: '', planId: '' });
      fetchAll();
    } catch (error) {
      toast.error('Failed to assign subscription');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const getPlanColor = (planName: string) => {
    if (planName === 'Free') return 'bg-gray-100 text-gray-800';
    if (planName === 'Pro') return 'bg-purple-100 text-purple-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💳 Subscription Management</h1>
        {activeTab === 'subscriptions' && (
          <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            + Assign Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b flex">
          {[
            { id: 'plans', label: '📋 Plans' },
            { id: 'subscriptions', label: '🏢 Company Subscriptions' },
            { id: 'billing', label: '💰 Billing History' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={'px-6 py-3 text-sm font-medium ' + (activeTab === tab.id ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-purple-600 mb-4">
                ${plan.price}<span className="text-sm text-gray-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-4 text-sm">
                <li>✓ {plan.max_users} Users</li>
                <li>✓ {plan.max_projects} Projects</li>
                <li>✓ {plan.features}</li>
              </ul>
              <div className={'text-xs px-2 py-1 rounded inline-block ' + getPlanColor(plan.name)}>
                {subscriptions.filter(s => s.plan_name === plan.name).length} companies
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No subscriptions yet</td></tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 font-medium">{sub.company_name}</td>
                    <td className="px-6 py-4">
                      <span className={'px-2 py-1 rounded text-xs ' + getPlanColor(sub.plan_name)}>{sub.plan_name}</span>
                    </td>
                    <td className="px-6 py-4">${sub.price}/mo</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">{sub.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(sub.started_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billing.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No billing history</td></tr>
              ) : (
                billing.map(bill => (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 font-mono text-xs">{bill.invoice_number}</td>
                    <td className="px-6 py-4">{bill.company_name}</td>
                    <td className="px-6 py-4">{bill.plan_name}</td>
                    <td className="px-6 py-4 font-bold">${bill.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">{bill.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(bill.paid_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Assign Subscription</h3>
            <select value={assignData.companyId} onChange={(e) => setAssignData({ ...assignData, companyId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3">
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={assignData.planId} onChange={(e) => setAssignData({ ...assignData, planId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-4">
              <option value="">Select Plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}/mo</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={assignSubscription} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Assign</button>
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
