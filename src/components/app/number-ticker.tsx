import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function NumberTicker({ value, format, className, duration = 0.9 }: Props) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    mass: 0.5,
    stiffness: 90,
    damping: 20,
    duration: duration * 1000,
  });
  const text = useTransform(spring, (v) => (format ? format(v) : Math.round(v).toString()));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
