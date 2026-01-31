export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Refunds & Cancellation Policy</h1>
      <div className="prose prose-pink max-w-none text-gray-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Policy</h2>
          <p>
            Cancellation policies vary by property. Please review the specific cancellation terms listed on the property detail page before booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Process</h2>
          <p>
            Refunds, if applicable, will be processed within 5-7 business days to the original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Non-Refundable Items</h2>
          <p>
            Certain booking fees or service charges may be non-refundable.
          </p>
        </section>
      </div>
    </div>
  );
}
