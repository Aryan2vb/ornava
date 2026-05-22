import { PublicShowcaseView } from "@/components/PublicShowcaseView";

type ShowcasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShowcasePage({ params }: ShowcasePageProps) {
  const { id } = await params;
  return <PublicShowcaseView showcaseId={id} />;
}
