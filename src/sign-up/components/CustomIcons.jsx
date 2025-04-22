import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export function SitemarkIcon() {
  return (
    <SvgIcon sx={{ height: 21, width: 130 }}>
      <text
        x="0"
        y="15"
        fill="#4876EE"
        fontSize="14"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        mangotango
      </text>
    </SvgIcon>
  );
}


export function MangoTangoIcon(props) {
    return (
        <SvgIcon
            {...props}
            viewBox="0 0 350 100"
            sx={{ width: 180, height: 60 }}
        >
        <g>
          {/* 귀여운 망고 캐릭터 */}
          <ellipse cx="50" cy="50" rx="30" ry="40" fill="#FFD54F" stroke="#F57F17" strokeWidth="4" />
          <circle cx="40" cy="45" r="4" fill="#000" />
          <circle cx="60" cy="45" r="4" fill="#000" />
          <path d="M42 60 Q50 68 58 60" stroke="#000" strokeWidth="3" fill="none" />
          <path d="M50 20 Q52 10 60 10 Q65 10 68 14" fill="#81C784" stroke="#388E3C" strokeWidth="2" />
          <circle cx="68" cy="14" r="3" fill="#388E3C" />
  
          {/* 귀여운 MangoTango 텍스트 */}
          <text
            x="100"
            y="58"
            fill="#FF8A65"
            fontSize="22"
            fontFamily="'Comic Sans MS', cursive"
            fontWeight="bold"
          >
            MangoTango
          </text>
        </g>
      </SvgIcon>
    );
  }
  