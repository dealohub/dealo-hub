#!/usr/bin/env node
/**
 * UserPromptSubmit hook — design-skill reminder.
 *
 * Reads { prompt } JSON on stdin. If the prompt looks UI/design-shaped,
 * injects a reminder into the model context telling Claude to invoke a
 * design skill (shape / frontend-design / impeccable / polish / critique /
 * /ultrareview) BEFORE writing UI code. See ../../CLAUDE.md for rationale.
 *
 * Silent no-op on non-design prompts or any parse error.
 */

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
});
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(buf || "{}");
    const prompt = String(payload.prompt || "");
    // Arabic + English design/UI keywords. \b works on ASCII only (fine for our triggers).
    const trigger =
      /(تصميم|صمّم|design|\bUI\b|\bUX\b|bento|layout|polish|redesign|styling|\btile\b|hero|landing|typography|spacing|colorize|animate|motion)/i;
    if (!trigger.test(prompt)) return;

    const reminder = [
      "[DESIGN-REMINDER]",
      "This prompt looks UI/design-shaped. Per CLAUDE.md rule:",
      "invoke a design skill BEFORE writing UI code.",
      "Options: shape (plan) · frontend-design or impeccable (build) ·",
      "polish (final pass) · critique (UX audit) · /ultrareview (pre-merge).",
      "Skipping = regression.",
    ].join(" ");

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: reminder,
        },
      }),
    );
  } catch {
    // swallow — never block the prompt
  }
});
