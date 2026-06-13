"use client";

import { motion, type Variants } from "framer-motion";
import { QuestionnairesHeader } from "@/components/questionnaires/QuestionnairesHeader";
import { QuestionnaireKpis } from "@/components/questionnaires/QuestionnaireKpis";
import { QuestionnaireLibrary } from "@/components/questionnaires/QuestionnaireLibrary";
import { AnswerAutomation } from "@/components/questionnaires/AnswerAutomation";
import { QuestionnaireTemplates } from "@/components/questionnaires/QuestionnaireTemplates";
import { QuestionnaireProgress } from "@/components/questionnaires/QuestionnaireProgress";
import { QuestionnaireLinkedEvidence } from "@/components/questionnaires/QuestionnaireLinkedEvidence";
import { RecentQuestionnaireActivity } from "@/components/questionnaires/RecentQuestionnaireActivity";
import { useQuestionnaires } from "@/lib/hooks/useQuestionnaires";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function QuestionnairesPage() {
  const data = useQuestionnaires();
  const refetch = () => data.questionnaires.refetch();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <QuestionnairesHeader onUploaded={refetch} />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <QuestionnaireKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestionnaireLibrary data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <AnswerAutomation data={data} onAnswered={refetch} />
          <QuestionnaireProgress data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuestionnaireTemplates data={data} />
        <QuestionnaireLinkedEvidence data={data} />
        <RecentQuestionnaireActivity data={data} />
      </motion.div>
    </div>
  );
}
