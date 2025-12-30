import { AngularAppEngine, createRequestHandler } from '@angular/ssr'
import { getContext } from '@netlify/angular-runtime/context.mjs'

const angularAppEngine = new AngularAppEngine()

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext()

  // API endpoint for home-content proxy (bypasses CORS)
  const pathname = new URL(request.url).pathname;
  if (pathname === '/api/home-content') {
    try {
      const response = await fetch('https://oakwoodsys.com/wp-content/uploads/2025/12/home-content.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Response.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    } catch (error) {
      return Response.json({ error: 'Failed to fetch external content' }, { status: 500 });
    }
  }

  const result = await angularAppEngine.handle(request, context)
  return result || new Response('Not found', { status: 404 })
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
