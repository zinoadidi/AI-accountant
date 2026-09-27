"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

// The pattern confirmed for every feature that needs more effort than an
// MVP slice can justify yet: ship the manual/streamlined path as the real,
// working default, and surface the fuller-automation version as a visible,
// clickable entry point gated behind this modal — never just hide it.
export function ComingSoonButton({
  label,
  title,
  description,
  className,
}: {
  label: string;
  title: string;
  description: string;
  className?: string;
}) {
  void className;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outlined" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Chip label="Coming soon" size="small" color="primary" sx={{ mb: 1 }} />
          <Typography variant="h6" component="span" sx={{ display: "block" }}>
            {title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="contained" onClick={() => setOpen(false)} fullWidth>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
