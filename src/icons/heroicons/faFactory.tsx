import type { SVGProps } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type HeroiconProps = SVGProps<SVGSVGElement>;

export function makeFaIcon(icon: IconDefinition) {
  const Icon = ({ className, ...rest }: HeroiconProps) => (
    <FontAwesomeIcon
      icon={icon}
      fixedWidth
      className={className}
      {...(rest as Record<string, unknown>)}
    />
  );

  return Icon;
}
