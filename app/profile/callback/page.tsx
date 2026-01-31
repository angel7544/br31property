import { PhoneCall } from "lucide-react";

export default function CallbackPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Request a Call Back</h1>
      <p className="text-gray-500 mb-8">
        Leave your number and our support team will call you within 24 hours.
      </p>
      
      <form className="max-w-md space-y-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
           <input 
             type="tel" 
             placeholder="+91" 
             className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
           />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
           <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
              <option>Morning (9 AM - 12 PM)</option>
              <option>Afternoon (12 PM - 4 PM)</option>
              <option>Evening (4 PM - 8 PM)</option>
           </select>
        </div>
        <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors w-full">
           Request Call
        </button>
      </form>
    </div>
  );
}
