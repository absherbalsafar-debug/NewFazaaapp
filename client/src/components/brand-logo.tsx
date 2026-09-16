type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function BrandLogo({
  className = "h-auto w-32",
  alt = "فزعة — احتياجك .. نوصلك بالشخص المناسب",
}: BrandLogoProps) {
  return (
    <img
      src="/assets/fazaah-logo.png"
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}