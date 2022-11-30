import { Client } from "@neondatabase/serverless";
interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const client = new Client(env.DATABASE_URL);
    const metrics = { connect: "0ms", query: "0ms" };
    let startTime = Date.now();
    await client.connect();
    let endTime = Date.now();
    metrics.connect = `${endTime - startTime}ms`;
    console.log("connect:", metrics.connect);

    const { longitude, latitude } = (request.cf ?? {}) as any;
    startTime = Date.now();
    const { rows } = await client.query(
      `
  select 
    id_no, name_en, category,
    st_makepoint($1, $2) <-> location as distance
  from whc_sites_2021
  order by distance limit 5`,
      [longitude, latitude]
    );
    endTime = Date.now();
    metrics.query = `${endTime - startTime}ms`;
    console.log("query:", metrics.query);

    ctx.waitUntil(client.end()); // this doesn’t hold up the response
    return new Response(JSON.stringify({ metrics, data: rows }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
