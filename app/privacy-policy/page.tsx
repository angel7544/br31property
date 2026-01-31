export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose pblue-blue max-w-none text-gray-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, make a booking, or contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve our services, including processing transactions and sending you related information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
          <p>
            We implement reasonable security measures to protect your personal information.
          </p>
        </section>
      </div>
    </div>
  );
}
