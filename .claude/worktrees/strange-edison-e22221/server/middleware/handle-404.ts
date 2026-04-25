import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  // Check if the request is for the DevTools specific path
  if (event.path?.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
    // Return 404 with empty response for DevTools requests
    return new Response(null, { status: 404 })
  }
})
