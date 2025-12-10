CREATE TYPE "public"."first_mail_send" AS ENUM('waiting_choice', 'yes', 'no');--> statement-breakpoint
ALTER TABLE "onboarding_states" ALTER COLUMN "first_mail_send" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "onboarding_states"
  ALTER COLUMN "first_mail_send"
  SET DATA TYPE first_mail_send
  USING (
    CASE
      WHEN "first_mail_send" = true THEN 'yes'::first_mail_send
      WHEN "first_mail_send" = false THEN 'no'::first_mail_send
      ELSE 'waiting_choice'::first_mail_send
    END
  );--> statement-breakpoint
ALTER TABLE "onboarding_states" ALTER COLUMN "first_mail_send" SET DEFAULT 'waiting_choice';