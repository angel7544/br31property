import { CreditCard } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 text-center py-16">
      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 mx-auto">
        <CreditCard className="w-8 h-8 text-purple-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Subscription</h1>
      <p className="text-gray-500 mb-6">You are currently on the Free plan.</p>
      <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
        Upgrade Plan
      </button>
    </div>
  );
}
