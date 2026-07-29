import { NotImplementedNotice, PageHeader } from '../../../components/ui/Primitives';

export default function SectionPlaceholderPage() {
  return (
    <>
      <PageHeader title="Section placeholder" description="Phase 1C will implement real screens." />
      <NotImplementedNotice feature="Application screen" />
    </>
  );
}
