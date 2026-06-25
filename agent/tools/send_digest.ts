import { defineTool } from "eve/tools"
import { Resend } from "resend"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

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
      html: `<pre style="font-family: sans-serif; line-height: 1.6">${digest}</pre>`,
    })

    return "Digest sent successfully."
  },
})
