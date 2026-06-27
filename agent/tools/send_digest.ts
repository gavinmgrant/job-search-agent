import { defineTool } from "eve/tools"
import { Resend } from "resend"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function tokenPlaceholder(id: number) {
  return `__DIGEST_HTML_${id}__`
}

function digestToHtml(digest: string) {
  const tokens: string[] = []

  function stash(html: string) {
    const id = tokens.length
    tokens.push(html)
    return tokenPlaceholder(id)
  }

  let text = digest

  // [label](<url>) — angle-bracket markdown links
  text = text.replace(
    /\[([^\]]+)\]\s*\(\s*<(https?:\/\/[^>]+)>\s*\)/gi,
    (_, label, url) =>
      stash(`<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`),
  )

  // [label](url) — standard markdown links; non-greedy URL stops at closing ")"
  text = text.replace(
    /\[([^\]]+)\]\s*\(\s*(https?:\/\/.+?)\s*\)/gi,
    (_, label, url) =>
      stash(`<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`),
  )

  // Remaining bare URLs (skip trailing punctuation from markdown parens, etc.)
  text = text.replace(/https?:\/\/[^\s<>"']+/g, (url) => {
    const clean = url.replace(/[)\]}>,.;:!?*]+$/, "")
    return stash(`<a href="${escapeHtml(clean)}">${escapeHtml(clean)}</a>`)
  })

  text = text.replace(
    /\*\*([^*]+)\*\*/g,
    (_, content) => stash(`<strong>${escapeHtml(content)}</strong>`),
  )

  text = escapeHtml(text)
  for (let id = tokens.length - 1; id >= 0; id--) {
    text = text.replaceAll(tokenPlaceholder(id), tokens[id]!)
  }

  return text
}

export default defineTool({
  description: "Send the compiled job digest to the user's inbox",
  inputSchema: z.object({
    digest: z.string(), // The formatted job listings to send
  }),
  execute: async ({ digest }) => {
    await resend.emails.send({
      from: process.env.DIGEST_EMAIL_FROM!, // Must be a domain you've verified in Resend
      to: process.env.DIGEST_EMAIL_TO!,
      subject: `Your Daily Job Digest — ${new Date().toLocaleDateString()}`,
      html: `<div style="font-family: sans-serif; line-height: 1.6; white-space: pre-wrap">${digestToHtml(digest)}</div>`,
    })

    return "Digest sent successfully."
  },
})
