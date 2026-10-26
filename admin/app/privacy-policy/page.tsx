import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — A2S Cinemas",
  description: "How A2S Cinemas collects, uses and protects your personal data.",
};

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
const UPDATED = "26 October 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-white mt-8 mb-2">{children}</h2>;
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#07070F] text-gray-300">
      <div className="max-w-3xl mx-auto px-5 py-12 leading-7 text-[15px]">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mt-1">A2S Cinemas · Last updated: {UPDATED}</p>

        <p className="mt-6">
          A2S Cinemas (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a movie streaming app where you can watch films
          for a limited period after purchasing access. This policy explains what personal data we collect, why,
          and the choices you have.
        </p>

        <H>1. Information we collect</H>
        <ul className="list-disc pl-6 space-y-1">
          <li><b>Account details:</b> your name, email address and mobile number.</li>
          <li><b>Purchase information:</b> the movies you buy, the amount, date, and payment reference IDs. Card, UPI and bank details are entered on Razorpay&apos;s secure checkout and are <b>never</b> seen or stored by us.</li>
          <li><b>Reviews and ratings</b> you choose to post.</li>
          <li><b>Notification token:</b> a device identifier used to send you push notifications, if you allow them.</li>
          <li><b>Basic technical data:</b> app version and standard server logs (such as IP address and request time) used for security and troubleshooting.</li>
        </ul>
        <p className="mt-2">We do not collect your location, contacts, photos or microphone data.</p>

        <H>2. How we use your information</H>
        <ul className="list-disc pl-6 space-y-1">
          <li>To create your account, verify your email with a one-time code, and keep you signed in.</li>
          <li>To process payments and give you access to the movies you purchased.</li>
          <li>To send important service messages and, if you allow it, announcements about new releases (push notification, WhatsApp or SMS using your mobile number).</li>
          <li>To prevent fraud and abuse, and to improve the app.</li>
        </ul>

        <H>3. Who we share data with</H>
        <p>We do not sell your personal data. We share it only with service providers that help us run the app:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li><b>Razorpay</b> — payment processing.</li>
          <li><b>Brevo</b> — sending verification emails.</li>
          <li><b>Amazon Web Services (S3)</b> — storing and delivering movie files.</li>
          <li><b>MongoDB Atlas, Render and Vercel</b> — database and hosting.</li>
          <li><b>Expo and Google (Firebase Cloud Messaging)</b> — delivering push notifications.</li>
        </ul>
        <p className="mt-2">We may also disclose information if required by law.</p>

        <H>4. Data retention</H>
        <p>
          We keep your account data while your account is active. When you delete your account we remove your
          profile, mobile number, reviews, licenses and notification token. Payment records (order IDs and amounts)
          are kept without any link to your profile for as long as tax and accounting laws require.
        </p>

        <H>5. Your rights and choices</H>
        <ul className="list-disc pl-6 space-y-1">
          <li>You can view and update your name and mobile number in the app under Profile.</li>
          <li>You can turn off push notifications in your phone&apos;s settings at any time.</li>
          <li>
            You can <b>delete your account and data</b> at any time on our{" "}
            <Link href="/delete-account" className="text-[#E50914] underline">account deletion page</Link>.
          </li>
        </ul>

        <H>6. Security</H>
        <p>
          Data is transmitted over encrypted connections (HTTPS). Movie access is protected by time-limited licenses
          and signed links. No system is perfectly secure, but we work to protect your information.
        </p>

        <H>7. Children</H>
        <p>A2S Cinemas is not directed at children under 13, and we do not knowingly collect their personal data.</p>

        <H>8. Changes to this policy</H>
        <p>We may update this policy from time to time. The &quot;Last updated&quot; date above shows the latest version.</p>

        <H>9. Contact us</H>
        <p>
          Questions about this policy or your data?{" "}
          {SUPPORT_EMAIL ? (
            <>Email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#E50914] underline">{SUPPORT_EMAIL}</a>.</>
          ) : (
            <>Contact us through the Help Center in the A2S Cinemas app.</>
          )}
        </p>
      </div>
    </main>
  );
}
