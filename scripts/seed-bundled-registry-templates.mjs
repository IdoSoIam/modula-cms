import 'dotenv/config'

const baseUrl = (process.argv[2] || process.env.CMS_LOCAL_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const token = process.env.CMS_SYSTEM_TEMPLATES_REGISTRY_API_KEY?.trim()
  || process.env.CMS_REGISTRY_API_KEY?.trim()

if (!token) {
  console.error('Missing CMS_REGISTRY_API_KEY or CMS_SYSTEM_TEMPLATES_REGISTRY_API_KEY in environment.')
  process.exit(1)
}

const response = await fetch(`${baseUrl}/api/registry/seed-bundled-templates`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`
  }
})

const data = await response.json().catch(() => null)

if (!response.ok) {
  console.error(JSON.stringify(data || { message: `Request failed with ${response.status}` }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(data, null, 2))
