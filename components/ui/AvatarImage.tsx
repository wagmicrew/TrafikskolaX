"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
    <Image
      src={resolvedSrc}
      alt={alt}
      width={40}
      height={40}
      className={className}
      onError={() => setResolvedSrc("/avatars/default.jpg")}
      priority={false}
    />
  );
}


