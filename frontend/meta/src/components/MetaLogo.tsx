import { motion } from 'motion/react';

interface MetaLogoProps {
  size?: number;
  className?: string;
}

export function MetaLogo({ size = 40, className = '' }: MetaLogoProps) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="metaBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0064E0" />
            <stop offset="50%" stopColor="#0095F6" />
            <stop offset="100%" stopColor="#0064E0" />
          </linearGradient>
        </defs>
        <path
          d="M50,20 C35,20 25,35 25,50 C25,65 35,80 50,80 C58,80 65,75 70,67 L80,52 C82,49 85,48 88,50 C91,52 91,56 89,59 L79,74 C72,85 62,92 50,92 C30,92 13,75 13,50 C13,25 30,8 50,8 C62,8 72,15 79,26 L89,41 C91,44 91,48 88,50 C85,52 82,51 80,48 L70,33 C65,25 58,20 50,20 Z"
          fill="url(#metaBlueGradient)"
        />
        <path
          d="M50,80 C65,80 75,65 75,50 C75,35 65,20 50,20 C42,20 35,25 30,33 L20,48 C18,51 15,52 12,50 C9,48 9,44 11,41 L21,26 C28,15 38,8 50,8 C70,8 87,25 87,50 C87,75 70,92 50,92 C38,92 28,85 21,74 L11,59 C9,56 9,52 12,50 C15,48 18,49 20,52 L30,67 C35,75 42,80 50,80 Z"
          fill="url(#metaBlueGradient)"
        />
      </svg>
    </motion.div>
  );
}
