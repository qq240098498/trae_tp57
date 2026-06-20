import { useState } from "react";
import { StudyStats } from "@/components/learning/StudyStats";
import { RankingBoard } from "@/components/learning/RankingBoard";
import { MemberReportModal } from "@/components/learning/MemberReportModal";
import type { MemberStudyStats } from "@/store/selectors";

export default function Learning() {
  const [selectedStats, setSelectedStats] = useState<MemberStudyStats | null>(null);

  return (
    <div className="space-y-6">
      <StudyStats />
      <RankingBoard onSelectMember={(stats) => setSelectedStats(stats)} />
      <MemberReportModal
        open={selectedStats != null}
        onClose={() => setSelectedStats(null)}
        stats={selectedStats}
      />
    </div>
  );
}
