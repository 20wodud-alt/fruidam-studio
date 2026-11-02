/* eslint-disable @next/next/no-img-element */
import type { MouseEventHandler } from "react";
import styles from "./brand-logo.module.css";

export function BrandLogo({ className = "", compact = false, onClick }: { className?: string; compact?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return <a href="/" aria-label="열매담 홈" className={`${styles.logo} ${compact ? styles.compact : ""} ${className}`} onClick={onClick}>
    <img className={styles.image} src="/fruitdam-logo.png" alt="열매담 FRUIDAM" width={1774} height={887}/>
  </a>;
}
