type MascotProps = {
  size?: "sm" | "md" | "lg";
  mood?: "happy" | "thinking" | "shopping" | "recipe";
  className?: string;
};

const sizes = {
  sm: "size-7",
  md: "size-11",
  lg: "size-20",
};

export default function Mascot({
  size = "md",
  mood = "happy",
  className = "",
}: MascotProps) {
  const isThinking = mood === "thinking";
  const isShopping = mood === "shopping";
  const isRecipe = mood === "recipe";

  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={`${sizes[size]} shrink-0 ${className}`}
    >
      <circle cx="48" cy="52" r="36" fill="#FFFBEB" />
      <path
        d="M25 47c0-16 10-28 23-28s23 12 23 28v10c0 14-10 24-23 24S25 71 25 57V47Z"
        fill="#FDE68A"
        stroke="#F59E0B"
        strokeWidth="3"
      />
      <path
        d="M28 46c4 3 10 5 20 5s16-2 20-5"
        fill="none"
        stroke="#FBBF24"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M34 29c-4-7 2-14 10-10 2-9 15-9 17 0 8-3 14 5 9 12"
        fill="#FFFFFF"
        stroke="#F59E0B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="38" cy="54" r="3.5" fill="#78350F" />
      <circle cx="58" cy="54" r="3.5" fill="#78350F" />
      <path
        d={isThinking ? "M42 65c4 2 8 2 12 0" : "M40 64c5 6 12 6 17 0"}
        fill="none"
        stroke="#78350F"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="61" r="4" fill="#FDA4AF" opacity="0.75" />
      <circle cx="64" cy="61" r="4" fill="#FDA4AF" opacity="0.75" />
      <path
        d="M23 58c-6 3-8 9-4 13 4 3 9-1 11-6"
        fill="#FED7AA"
        stroke="#F59E0B"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M73 58c6 3 8 9 4 13-4 3-9-1-11-6"
        fill="#FED7AA"
        stroke="#F59E0B"
        strokeLinecap="round"
        strokeWidth="3"
      />
      {isThinking && (
        <>
          <circle cx="73" cy="28" r="3" fill="#38BDF8" />
          <circle cx="81" cy="21" r="4" fill="#38BDF8" />
        </>
      )}
      {isShopping && (
        <path
          d="M68 27h11l-2 13H67l-2-9h-4"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      )}
      {isRecipe && (
        <path
          d="M70 28h12v14H70zM73 34h6"
          fill="#FFF7ED"
          stroke="#F97316"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      )}
      {mood === "happy" && (
        <path
          d="M73 29c4-5 12 0 8 6l-8 8-8-8c-4-6 4-11 8-6Z"
          fill="#FB7185"
        />
      )}
    </svg>
  );
}
