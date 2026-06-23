const sections = [
  {
    title: "Information We Collect",
    body:
      "When you create an account, place an order, or sign in with Google, we collect the information you provide: your name, email address, and — for orders — your shipping address and contact details. If you sign in with Google, we receive your name, email, and profile picture from your Google account.",
  },
  {
    title: "How We Use Your Information",
    body:
      "We use your information only to operate the store: to create and secure your account, process and deliver your orders, communicate with you about your purchases, and improve our products and service. We do not sell your personal data to third parties.",
  },
  {
    title: "Google Sign-In",
    body:
      "If you choose to sign in with Google, we use Google's authentication to verify your identity. We only access your basic profile information (name, email, picture) and never your Google password. You can revoke this access at any time from your Google Account settings.",
  },
  {
    title: "Data Storage & Security",
    body:
      "Your data is stored securely in our database. Passwords are encrypted (hashed) and never stored in plain text. We use industry-standard measures including HTTPS encryption and access controls to protect your information.",
  },
  {
    title: "Your Rights",
    body:
      "You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also delete your account, which removes your personal information from our active systems.",
  },
  {
    title: "Contact",
    body:
      "For any questions about this Privacy Policy or your data, contact us through our Instagram (@darins.handmade) or by email.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-20 px-6 md:px-8">
      <div className="max-w-[820px] mx-auto">
        <h1 className="font-['Dorsa'] text-[56px] md:text-[96px] tracking-[6px] md:tracking-[12px] leading-none text-black mb-4 text-center">
          Privacy Policy
        </h1>
        <p className="font-['Centaur'] text-[#888] text-[14px] tracking-[2px] text-center mb-16">
          Last updated: June 2026
        </p>

        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-['Perpetua_Titling_MT'] text-[18px] md:text-[22px] tracking-[2px] uppercase text-black mb-4">
                {s.title}
              </h2>
              <p className="font-['Centaur'] text-[16px] md:text-[18px] tracking-[1px] leading-relaxed text-[#444]">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
