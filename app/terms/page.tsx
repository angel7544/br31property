export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
      <div className="prose pblue-blue max-w-none text-gray-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p>
            Welcome to BR31 PROPERTY MANAGEMENT SYSTEM. By accessing our website and using our services, you agree to be bound by these Terms & Conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Services</h2>
          <p>
            We provide an online platform for booking PG accommodations and flats. We act as an intermediary between property owners and tenants.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Booking & Payments</h2>
          <p>
            All bookings are subject to availability. Payments must be made in accordance with the property's specific payment terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
          <p>
            Users agree to provide accurate information and to use our services only for lawful purposes.
          </p>
        </section>
      </div>
    </div>
  );
}
