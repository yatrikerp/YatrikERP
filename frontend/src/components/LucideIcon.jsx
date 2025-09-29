import * as Icons from "lucide-react";

const LucideIcon = ({ name, ...props }) => {
  const IconComponent = Icons[name];
  return IconComponent ? <IconComponent {...props} /> : null;
};

export default LucideIcon;
