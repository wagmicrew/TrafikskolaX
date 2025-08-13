"use client";

import { useEffect, useState } from "react";

interface AvatarImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function AvatarImage({ src, alt = "Avatar", className = "w-10 h-10 rounded-full object-cover" }: AvatarImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(src || "/avatars/default.jpg");

  useEffect(() => {
    setResolvedSrc(src || "/avatars/default.jpg");
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setResolvedSrc("/avatars/default.jpg")}
      loading="lazy"
    />
  );
}


