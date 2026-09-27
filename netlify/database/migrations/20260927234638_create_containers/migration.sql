CREATE TABLE "containers" (
	"id" serial PRIMARY KEY,
	"container_number" text NOT NULL,
	"origin_port" text NOT NULL,
	"destination_port" text NOT NULL,
	"status" text DEFAULT 'in_transit' NOT NULL,
	"eta" timestamp NOT NULL,
	"arrived_at" timestamp,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
