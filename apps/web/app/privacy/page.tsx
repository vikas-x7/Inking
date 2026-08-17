import LegalLayout from '@/src/modules/legal/components/LegalLayout';

export const metadata = {
  title: 'Privacy Policy - Inking',
  description: 'Privacy Policy for Inking - Self-hosted LaTeX Editor',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="September 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
        <p>
          Inking is a self-hosted LaTeX editing platform. We collect minimal personal information required to maintain your account and store your document drafts safely.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">2. Document Security & Storage</h2>
        <p>
          Your LaTeX files and compiled assets remain under your ownership. Documents are compiled on secure backend services and are not shared with third parties or used for model training.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">3. Analytics & Cookies</h2>
        <p>
          We use essential session tokens for authentication. We do not place third-party tracking cookies or sell your personal data.
        </p>
      </section>
    </LegalLayout>
  );
}
