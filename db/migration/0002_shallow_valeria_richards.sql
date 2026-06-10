CREATE TABLE "daily_visitor" (
	"id" serial PRIMARY KEY NOT NULL,
	"count" bigint DEFAULT 0,
	"day_start" timestamp NOT NULL,
	CONSTRAINT "daily_visitor_day_start_unique" UNIQUE("day_start")
);
