CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"gender" varchar(10) NOT NULL,
	"date_of_birth" date NOT NULL,
	"email" "citext" NOT NULL,
	"password" text NOT NULL,
	"username" "citext" NOT NULL,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
