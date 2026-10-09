import type { ReactNode } from "react";
import { Hammer } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { Card, EmptyState, PageHeader } from "./shared";

// The titled stand-in used for facilitator screens before they were built
// (M05 frontend plan, Phase F0). Every screen has since been replaced by its
// real page: Learner Detail in F2 (FacilitatorLearnerDetail.tsx), Curriculum in
// F3 (FacilitatorCurriculum.tsx), My Cohorts in F5 (FacilitatorMyCohorts.tsx),
// and Strand Tests in F6 (FacilitatorTests.tsx, FacilitatorTestDetail.tsx).
// Nothing imports this file any more; it holds no data, real or mock.

interface PlaceholderProps extends PageProps {
  /** The sidebar entry to highlight and the top bar title to show. */
  currentPage: string;
  title: string;
  subtitle: ReactNode;
  eyebrow: string;
  phase: string;
}

export function Placeholder({ navigate, user, onLogout, currentPage, title, subtitle, eyebrow, phase }: PlaceholderProps) {
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage={currentPage}>
      <div className="p-5 space-y-5">
        <PageHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
        <Card padding="none">
          <EmptyState
            icon={Hammer}
            title="This screen is not built yet"
            description={`It arrives in phase ${phase} of the M05 frontend plan.`}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
