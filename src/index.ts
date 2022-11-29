import { Client } from "@neondatabase/serverless";
interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const client = new Client(env.DATABASE_URL);
    await client.connect();

    const { longitude, latitude } = (request.cf ?? {}) as any;
    const { rows } = await client.query(
      `
  select 
    id_no, name_en, category,
    st_makepoint($1, $2) <-> location as distance
  from whc_sites_2021
  order by distance limit 10`,
      [longitude, latitude]
    );

    ctx.waitUntil(client.end()); // this doesn’t hold up the response
    return new Response(JSON.stringify(rows), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
