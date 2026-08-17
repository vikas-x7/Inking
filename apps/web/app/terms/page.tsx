import LegalLayout from '@/src/modules/legal/components/LegalLayout';

export const metadata = {
  title: 'Terms of Service - Inking',
  description: 'Terms of Service for Inking',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="September 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
        <p>
          By creating an account or using Inking, you agree to these Terms of Service. If you do not agree, please do not use the application.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">2. User Responsibilities</h2>
        <p>
          You are responsible for keeping your login credentials confidential and for all activity taking place under your account. Do not upload malicious code or illegal content.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">3. Service Availability</h2>
        <p>
          Inking is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We strive for high uptime but do not guarantee uninterrupted access.
        </p>
      </section>
    </LegalLayout>
  );
}
