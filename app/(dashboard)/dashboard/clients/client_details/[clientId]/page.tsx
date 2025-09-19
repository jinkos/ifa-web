import ClientDetailsForm from '../ClientDetailsForm';

export default async function ClientDetailsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  return <ClientDetailsForm clientId={clientId} />;
}
