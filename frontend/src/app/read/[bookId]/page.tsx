import { MainLayout } from '@/components/layout/main-layout';
import { ReadingPage } from '@/components/pages/reading-page';

interface ReadingPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function Reading({ params }: ReadingPageProps) {
  const { bookId } = await params;
  
  return (
    <MainLayout>
      <ReadingPage bookId={bookId} />
    </MainLayout>
  );
}