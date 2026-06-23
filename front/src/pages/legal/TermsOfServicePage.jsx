const sections = [
  {
    title: "Acceptance of Terms",
    body:
      "By accessing and using DARIN'S HANDMADE, you agree to these Terms of Service. If you do not agree, please do not use the site.",
  },
  {
    title: "Products & Custom Orders",
    body:
      "All items are handmade, so slight variations in color, size, and detail are natural and not defects. Custom bags created in the Custom Studio are made to order based on the options you select; prices and estimated production times are shown before you add an item to your cart.",
  },
  {
    title: "Orders & Payment",
    body:
      "Placing an order is an offer to purchase. We confirm orders by email and reserve the right to decline or cancel an order if an item is unavailable. Prices are listed in the currency shown at checkout.",
  },
  {
    title: "Shipping & Pickup",
    body:
      "You may choose delivery or self-pickup at checkout. Handmade and custom items require production time before shipping; estimated timeframes are provided per product. We are not responsible for delays caused by the carrier.",
  },
  {
    title: "Accounts",
    body:
      "You are responsible for keeping your account credentials secure and for all activity under your account. You may sign in with email and password or with Google. Do not share your login with others.",
  },
  {
    title: "Intellectual Property",
    body:
      "All designs, photographs, and content on this site belong to DARIN'S HANDMADE and may not be copied or reused without permission.",
  },
  {
    title: "Changes & Contact",
    body:
      "We may update these terms from time to time. Continued use of the site means you accept the updated terms. For questions, contact us via Instagram (@darins.handmade) or email.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen py-20 px-6 md:px-8">
      <div className="max-w-[820px] mx-auto">
        <h1 className="font-['Dorsa'] text-[52px] md:text-[88px] tracking-[6px] md:tracking-[10px] leading-none text-black mb-4 text-center">
          Terms of Service
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
