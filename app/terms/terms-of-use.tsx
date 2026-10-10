import Link from "next/link";
import { Prose } from "@/components/Prose/Prose";
import { CONTACT_EMAIL, OWNER_NAME } from "@/lib/site";

/** The terms of use text. */
export function TermsOfUse() {
  return (
    <Prose title="Terms of use" updated="2026-10-10">
      <h2>What Reelbox is</h2>
      <p>
        A free personal portfolio project by {OWNER_NAME}. It&apos;s provided as
        is, without guarantees that it&apos;s always available or free of
        errors. It may be changed or shut down.
      </p>

      <h2>Not affiliated with Instagram or Meta</h2>
      <p>
        Instagram is a trademark of Meta Platforms, Inc. Reelbox only works with
        the data export Instagram lets you download.
      </p>

      <h2>Your data</h2>
      <p>
        Only upload your own export. It stays yours; I store it only to show it
        to you. How it&apos;s handled is in the{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Fair use</h2>
      <p>
        Don&apos;t try to break the app&apos;s security, overload it, or use it
        to send emails to people who didn&apos;t ask for them. Accounts used
        that way may be deleted.
      </p>

      <h2>Responsibility</h2>
      <p>
        As far as the law allows, I&apos;m not responsible for losses from using
        Reelbox. Nothing here limits your rights as a consumer.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Prose>
  );
}
