import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { points } from "../../db/schema.js";

export default async (req: Request) => {
  const user = await getUser();
  if (!user) {
    return Response.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }

  if (req.method === "GET") {
    const rows = await db.select().from(points).orderBy(asc(points.id));
    return Response.json({
      type: "FeatureCollection",
      features: rows.map((p) => ({
        type: "Feature",
        id: p.id,
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
        properties: { name: p.name, description: p.description },
      })),
    });
  }

  if (req.method === "POST") {
    let data: Record<string, unknown>;
    try {
      data = await req.json();
    } catch {
      return Response.json({ status: "error", message: "Invalid JSON body" }, { status: 400 });
    }

    const name = String(data.name ?? "").trim() || "Unnamed Point";
    const description = String(data.description ?? "");
    const longitude = Number(data.longitude);
    const latitude = Number(data.latitude);

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return Response.json({ status: "error", message: "Longitude must be between -180 and 180" }, { status: 400 });
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return Response.json({ status: "error", message: "Latitude must be between -90 and 90" }, { status: 400 });
    }

    const [point] = await db
      .insert(points)
      .values({ name: name.slice(0, 100), description, longitude, latitude, createdBy: user.id })
      .returning();

    return Response.json(
      { status: "success", id: point.id, message: "Point added successfully!" },
      { status: 201 },
    );
  }

  return Response.json({ status: "error", message: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/points",
  method: ["GET", "POST"],
};
