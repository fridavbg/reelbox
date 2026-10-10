-- Data only: sessions are no longer stored with an IP address or browser
-- (see sessionPrivacyHooks in lib/auth.ts). This clears them from sessions
-- created before that change, which stay active as long as they're used.
UPDATE "sessions" SET "ip_address" = NULL, "user_agent" = NULL;
