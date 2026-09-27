import type { Config } from "@netlify/functions";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { containers } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method === "GET") {
    const all = await db.select().from(containers).orderBy(desc(containers.updatedAt));
    return Response.json(all);
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { containerNumber, originPort, destinationPort, eta, notes, status } = body;

    if (!containerNumber || !originPort || !destinationPort || !eta) {
      return Response.json(
        { error: "containerNumber, originPort, destinationPort and eta are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(containers)
      .values({
        containerNumber,
        originPort,
        destinationPort,
        eta: new Date(eta),
        status: status || "in_transit",
        notes: notes || "",
      })
      .returning();

    return Response.json(created, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/containers",
};
