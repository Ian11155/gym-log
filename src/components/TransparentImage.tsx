import React from "react";

interface TransparentImageProps {
  src: string;
  alt?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export default function TransparentImage({ src, alt, className, referrerPolicy }: TransparentImageProps) {
  return (
    <img
      src={src}
      alt={alt || "Transparent image"}
      className={className}
      referrerPolicy={referrerPolicy}
      decoding="async"
      loading="lazy"
    />
  );
}
