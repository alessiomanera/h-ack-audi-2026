// STUB (stream A replaces it).
export default {
  async fetch(): Promise<Response> {
    return Response.json({ error: 'not_found', message: 'Risorsa non trovata.' }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
