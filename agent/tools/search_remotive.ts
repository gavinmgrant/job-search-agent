import { defineTool } from "eve/tools"
import { z } from "zod"

export default defineTool({
  description:
    "Search Remotive for remote job postings matching the candidate's skills",
  inputSchema: z.object({
    role: z.string(), // e.g. "frontend engineer"
  }),
  execute: async ({ role }) => {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=10`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.jobs || data.jobs.length === 0) {
      return "No Remotive results found for this role."
    }

    return data.jobs.map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: "Remote",
      salary: job.salary || "Salary not listed",
      posted: new Date(job.publication_date).toLocaleDateString(),
      url: job.url,
    }))
  },
})
