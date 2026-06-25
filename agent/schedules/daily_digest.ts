import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 17 * * 1-5", // Weekdays at 10:00 AM Pacific (PDT). Vercel uses UTC — use "0 18 * * 1-5" during PST.
  markdown: `Search for frontend software engineer roles in San Diego and remote. 
           Use both search_adzuna and search_remotive. 
           Combine the results, remove duplicates, and compile the top 10 
           most relevant roles including title, company, location, salary 
           if available, and a direct link to apply.
           Then use send_digest to email the results.`,
})
