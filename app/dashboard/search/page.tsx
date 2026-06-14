"use client";

import { motion, type Variants } from "framer-motion";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchSourceCards } from "@/components/search/SearchSourceCards";
import { SearchExperience } from "@/components/search/SearchExperience";
import { useGlobalSearch } from "@/lib/hooks/useGlobalSearch";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function SearchPage() {
  const data = useGlobalSearch();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <SearchHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SearchSourceCards data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <SearchExperience data={data} />
      </motion.div>
    </div>
  );
}
