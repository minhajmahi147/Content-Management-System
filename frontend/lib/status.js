export const STATUSES = ["assigned", "in_progress", "pending_review", "approved"];

export const COLUMNS = { assigned: "Not started", in_progress: "Writing", pending_review: "Review", approved: "Approved" };

export const ICONS = { assigned: "📌", in_progress: "✍️", pending_review: "👀", approved: "✅" };

const TEXT = {
  manager: {
    assigned: ["Not started", "Waiting for the writer to start."],
    in_progress: ["Writer working", "The writer is writing or making your requested changes."],
    pending_review: ["Needs your review", "Read it, then approve it or send it back with feedback."],
    approved: ["Approved", "Finished. Nothing left to do."],
  },
  writer: {
    assigned: ["New", "Click \"Start working\" to begin."],
    in_progress: ["In progress", "Write, save your draft, and submit when ready."],
    pending_review: ["In review", "Waiting for your content manager to review it."],
    approved: ["Approved", "Your content manager approved this. Nothing left to do."],
  },
};

export const label = (status, role) => TEXT[role][status][0];
export const hint = (status, role) => TEXT[role][status][1];
