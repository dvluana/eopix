'use client';

// SVG paths inline para evitar dependências externas
const svgPaths = {
  p1f518a00: "M68.8 34.4a34.4 34.4 0 1 0 0 68.8 34.4 34.4 0 0 0 0-68.8Z",
  p235ceff0: "M68.8 39.2a29.6 29.6 0 1 0 0 59.2 29.6 29.6 0 0 0 0-59.2Z",
  p3ff4cf00: "M68.8 56a12.8 12.8 0 1 0 0 25.6 12.8 12.8 0 0 0 0-25.6Z",
  p2b42e200: "M68.8 60a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z",
  p2ebd5f80: "M68.8 42.4a26.4 26.4 0 1 0 0 52.8 26.4 26.4 0 0 0 0-52.8Z"
};

function Group() {
  return (
    <div className="absolute inset-[6%_14%_14%_6%]">
      <div className="absolute inset-[0_-7.5%_-7.5%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 137.6 137.6">
          <g>
            <path d={svgPaths.p1f518a00} fill="#2A2A2A" />
            <path d="M94.4 94.4L128 128" stroke="#2A2A2A" strokeLinecap="round" strokeWidth="19.2" />
            <path d={svgPaths.p235ceff0} fill="#1A1A1A" stroke="#F0EFEB" strokeWidth="4.8" />
            <g>
              <path d={svgPaths.p3ff4cf00} fill="white" />
              <path d={svgPaths.p2b42e200} fill="#FFD600" />
            </g>
            <path d={svgPaths.p2ebd5f80} opacity="0.1" stroke="#F0EFEB" strokeWidth="0.64" />
            <path d="M92.8 92.8L124.8 124.8" stroke="#F0EFEB" strokeLinecap="round" strokeWidth="8" />
            <path d="M113.6 113.6L126.4 126.4" stroke="#FFD600" strokeLinecap="round" strokeWidth="8" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LogoSymbol() {
  return (
    <div className="relative shrink-0 size-[48px]">
      <div className="relative size-full">
        <Group />
      </div>
    </div>
  );
}

function LogoText() {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="font-['Zilla_Slab',sans-serif] font-bold leading-[1.2] text-[#f0efeb] text-[22px] tracking-[-0.5px]">
        E o Pix?
      </p>
      <div className="bg-[#ffd600] h-[2px] rounded-[2px] w-[80%]" />
    </div>
  );
}

export default function LogoFundoPreto() {
  return (
    <div className="flex gap-3 items-center">
      <LogoSymbol />
      <LogoText />
    </div>
  );
}
