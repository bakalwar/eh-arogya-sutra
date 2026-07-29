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
      width={size}
      height={size}
      priority={priority}
      style={{ width: size, height: 'auto', objectFit: 'contain' }}
    />
  );
}
