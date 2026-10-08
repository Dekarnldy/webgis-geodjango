CREATE TABLE "points" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
