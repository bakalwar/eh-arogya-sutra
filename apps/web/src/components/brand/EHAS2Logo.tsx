import Image from 'next/image';
import { brandAssets } from '@ehas2/design-system';

type EHAS2LogoProps = {
  size?: number;
  priority?: boolean;
};

export function EHAS2Logo({ size = 40, priority = false }: EHAS2LogoProps) {
  return (
    <Image
      src={brandAssets.logoPath}
      alt={brandAssets.logoAlt}
      width={brandAssets.logoWidth}
      height={brandAssets.logoHeight}
      priority={priority}
      sizes={`${size}px`}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
