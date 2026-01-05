"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SmartAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function SmartAvatar({
  src,
  name,
  size = 128,
  className
}: SmartAvatarProps) {
  const initials =
    name && name.trim().length > 0
      ? name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "PP";

  const [fallbackImg, setFallbackImg] = useState<string>("");

  // Generate real-person fallback only once
  useEffect(() => {
    const gender = Math.random() > 0.5 ? "men" : "women";
    const id = Math.floor(Math.random() * 90) + 1;
    setFallbackImg(`https://randomuser.me/api/portraits/${gender}/${id}.jpg`);
  }, []);

  // Final order:
  const finalSrc =
    src && src !== ""
      ? src
      : fallbackImg || // real looking portrait
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name || "Employee"
        )}&background=0D8ABC&color=fff&size=256&bold=true`;

  return (
    <Avatar
      className={cn(
        "rounded-full ring-4 ring-background shadow-xl overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={finalSrc} alt={name || "avatar"} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
