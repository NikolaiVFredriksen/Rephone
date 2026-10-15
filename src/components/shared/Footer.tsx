export default function Footer() {
  return (
    <footer
      className="mt-auto px-6 py-8 text-center text-xs"
      style={{ color: "#8A7A68", borderTop: "1px solid #E9DCCB" }}
    >
      <p>
        Rephone er et demoprosjekt av Nikolai Villanueva Fredriksen. Annonsene
        er eksempler, ikke ekte salg.
      </p>
      <p className="mt-2 flex justify-center gap-4">
        <a
          href="https://github.com/NikolaiVFredriksen"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#C4622E] focus-visible:text-[#C4622E] outline-none"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/nikolai-fredriksen"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#C4622E] focus-visible:text-[#C4622E] outline-none"
        >
          LinkedIn
        </a>
      </p>
    </footer>
  );
}
