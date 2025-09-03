// src/components/Button.jsx
import { Button } from "@/components/ui/button";

export function ButtonDemo({ label, bgColor, onClick, children }) {
  const styles = {
    green: "bg-[#2F674A] text-white hover:bg-green-700",
    black: "bg-black text-white hover:bg-gray-800",
    red: "bg-red-600 text-white hover:bg-red-700",
    white: "bg-white text-black hover:bg-gray-200"
  };

  const btnClass = styles[bgColor] || styles.green;

  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row mt-2">
      <Button
        className={`${btnClass} px-4 py-2 rounded cursor-pointer`}
        onClick={(e) => {
          console.log("🖱️ Button clicked!");
          if (onClick) onClick(e); // ✅ forward event to RazorpayButton
        }}
      >
        {label}
        {children}
      </Button>
    </div>
  );
}
