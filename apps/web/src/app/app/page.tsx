import { NotImplementedNotice, PageHeader, Surface } from '../../components/ui/Primitives';

export default function DoctorDashboardPage() {
  return (
    <>
      <PageHeader
        title="Doctor shell"
        description="Responsive navigation demo. Screens and clinical workflows arrive in Phase 1C+."
      />
      <Surface>
        <NotImplementedNotice feature="Dashboard widgets" />
      </Surface>
    </>
  );
}
