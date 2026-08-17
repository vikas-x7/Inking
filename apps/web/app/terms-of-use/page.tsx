import LegalLayout from '@/src/modules/legal/components/LegalLayout';

export const metadata = {
  title: 'Website Terms of Use - Inking',
  description: 'Website Terms of Use for Inking',
};

export default function TermsOfUsePage() {
  return (
    <LegalLayout title="Website Terms of Use" lastUpdated="September 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">1. Permitted Use</h2>
        <p>
          You may access and use this website solely for writing, compiling, previewing, and managing your LaTeX documents and related open-source tools provided by Inking.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">2. Intellectual Property</h2>
        <p>
          All trademarks, logos, and UI components associated with Inking belong to their respective owners. Content authored by you remains your exclusive intellectual property.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">3. Modifications</h2>
        <p>
          We reserve the right to modify or update these terms at any time. Continued use of the website constitutes acceptance of updated terms.
        </p>
      </section>
    </LegalLayout>
  );
}
