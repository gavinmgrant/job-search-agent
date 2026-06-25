import { defineTool } from "eve/tools"
import { z } from "zod"

export default defineTool({
  description: "Search Adzuna for job postings matching the candidate's skills",
  inputSchema: z.object({
    role: z.string(), // e.g. "frontend engineer"
    location: z.string(), // e.g. "San Diego" or "remote"
    experienceLevel: z.string(), // "junior", "mid", or "senior"
  }),
  execute: async ({ role, location, experienceLevel }) => {
    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    const query = `${experienceLevel} ${role}`
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return "No Adzuna results found. Try broadening your search."
    }

    return data.results.map((job: any) => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      salary: job.salary_min
        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
        : "Salary not listed",
      posted: new Date(job.created).toLocaleDateString(),
      url: job.redirect_url,
    }))
  },
})
