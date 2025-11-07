import { getStatusColorClass } from '../utils/designSystem';

interface BadgeProps {
  status: string;
  children?: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(status)}`}>
      {children || status}
    </span>
  );
}
