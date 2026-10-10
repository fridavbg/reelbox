import { Prose } from "@/components/Prose/Prose";
import { DEMO_LIFETIME_HOURS } from "@/lib/demo/demo-settings";
import { CODE_VALID_MINUTES, SESSION_DAYS } from "@/lib/sign-in-settings";
import { CONTACT_EMAIL, OWNER_NAME } from "@/lib/site";

/**
 * The privacy policy text. Durations come from the app's settings, so the
 * policy changes with them.
 */
export function PrivacyPolicy() {
  const contact = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <Prose title="Privacy policy" updated="2026-10-10">
      <h2>Who runs Reelbox</h2>
      <p>
        Reelbox is a personal portfolio project by {OWNER_NAME}, not a company.
        Questions or requests about your data: {contact}.
      </p>

      <h2>What I collect and why</h2>
      <ul>
        <li>
          <strong>Your email address:</strong> to create your account and send
          you sign-in codes. Kept until your account is deleted. Legal basis:
          needed to provide the service you sign up for (GDPR article 6(1)(b)).
        </li>
        <li>
          <strong>Sign-in codes:</strong> stored only as a hash, never readable.
          A code works once and expires after {CODE_VALID_MINUTES} minutes;
          expired codes are deleted.
        </li>
        <li>
          <strong>One session cookie:</strong> keeps you signed in. It&apos;s
          strictly necessary, so there&apos;s no cookie banner. Sessions are
          stored without your IP address or browser. A session ends{" "}
          {SESSION_DAYS} days after you last used it, and ended sessions are
          deleted.
        </li>
        <li>
          <strong>Your IP address, briefly:</strong> to limit how often sign-in
          codes can be requested, so no one can flood an inbox. These counters
          expire within minutes and are cleaned up automatically. Legal basis:
          keeping the service secure (GDPR article 6(1)(f)).
        </li>
        <li>
          <strong>Demo accounts:</strong> &ldquo;Try the demo&rdquo; creates a
          temporary account without an email address. It&apos;s deleted after{" "}
          {DEMO_LIFETIME_HOURS} hours, or right away when you leave the demo.
        </li>
      </ul>

      <h2>Sign-in emails</h2>
      <p>
        Emails are sent by Brevo, which adds a small invisible image that
        records whether an email was opened. Brevo doesn&apos;t let me turn this
        off on its free plan, so I&apos;ve set it to anonymous: opens
        aren&apos;t linked to you. I don&apos;t use this data. Blocking images
        in your email app stops it.
      </p>

      <h2>What I never do</h2>
      <p>
        I never ask for your Instagram password or log in to Instagram for you.
        No ads, no analytics or tracking tools, and I never sell or share your
        data, except with the services below, which run the app.
      </p>

      <h2>Services that process data for me</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">What for</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel</td>
            <td>Hosting the app</td>
            <td>App runs in Frankfurt; content delivery worldwide</td>
          </tr>
          <tr>
            <td>Neon</td>
            <td>Database</td>
            <td>Frankfurt</td>
          </tr>
          <tr>
            <td>Brevo</td>
            <td>Sending sign-in emails</td>
            <td>EU (France, Germany, Belgium)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Vercel and Neon are US companies. Transfers to them are covered by the
        EU-U.S. Data Privacy Framework. Vercel also keeps short-lived request
        logs, which include IP addresses, to run and protect its platform.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, export or delete your data, and you can
        object to how it&apos;s used. Email {contact} and I&apos;ll answer
        within a month. You can also complain to the data protection authority
        in your country.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, the date at the top changes too.</p>
    </Prose>
  );
}
