import { MainLayout } from '@/components/layout/main-layout';
import { ReadingPage } from '@/components/pages/reading-page';

interface ReadingPageProps {
  params: {
    bookId: string;
  };
}

export default function Reading({ params }: ReadingPageProps) {
  return (
    <MainLayout>
      <ReadingPage bookId={params.bookId} />
    </MainLayout>
  );
}