export default function AboutUsPage() {
    return (
        <>
        <PageHero
        title="About Us"
        bgImage="/images/events/events-banner.webp"
      />
      <AgentRegisterForm />

        </>
    )
}
import AgentRegisterForm from '@/components/GeneralFormsComponents/AgentRegisterForm';
import PageHero from '@/components/PageHero';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Agent Registration | JnS Education',
  description: 'Join our Agent team and Learn more about our company and earn rewards.',
};