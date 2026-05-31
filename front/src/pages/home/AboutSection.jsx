import aboutBag from "./assets/AboutSectionBag.png";

function AboutSection() {
  return (
    <section className="w-full bg-[#f3f3f1] -mt-[70px]">
      <div className="mx-auto flex max-w-[1512px] items-center justify-between px-[40px] py-[40px]">
        <div className="w-[42%] flex justify-start">
          <img
            src={aboutBag}
            alt="Black handmade beaded bag"
            className="w-full max-w-[520px] object-contain"
          />
        </div>

        <div className="w-[58%] flex flex-col items-center">
          <h2
            className="m-0 text-black text-[138px] leading-[0.9]"
            style={{ fontFamily: "Dorsa, sans-serif" }}
          >
            Uniqueness in the details
          </h2>

          <p
            className="mt-[34px] max-w-[760px] text-center text-black text-[32px] leading-[1.4] tracking-[0.12em]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Unique design, high-quality materials, and eye-catching details.
            A stylish accessory that stands out — for special moments or
            everyday looks.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;