// Liability sits with the signing accountant, not with per-item AI review.
// This banner is the informational checkpoint used at strategic moments
// (documents list, before preview/download/submit) instead of gating the
// workflow on confirming every AI-suggested figure one at a time.
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";

export function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>AI-assisted, not accountant-reviewed by default</AlertTitle>
      <Typography variant="body2">
        {children ?? (
          <>
            Figures and categories suggested by AI are drafts. They don&apos;t
            need to be confirmed one by one to proceed — statutory
            responsibility for what&apos;s filed rests with the accountant who
            reviews and signs it.
          </>
        )}
      </Typography>
    </Alert>
  );
}
