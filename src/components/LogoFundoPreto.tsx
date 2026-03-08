import Image from 'next/image';

export default function LogoFundoPreto() {
  return (
    <Image
      src="/logo-eopix.webp"
      alt="E o Pix?"
      width={120}
      height={54}
      priority
      className="logo"
    />
  );
}
