import type { Urlaubsstatus } from '@/types';

interface BadgeProps {
  status: Urlaubsstatus;
}

const statusConfig: Record<
  Urlaubsstatus,
  { label: string; className: string }
> = {
  geplant: {
    label: 'Geplant',
    className: 'bg-gray-100 text-gray-700',
  },
  beantragt: {
    label: 'Beantragt',
    className: 'bg-yellow-100 text-yellow-800',
  },
  genehmigt: {
    label: 'Genehmigt',
    className: 'bg-green-100 text-green-800',
  },
  abgelehnt: {
    label: 'Abgelehnt',
    className: 'bg-red-100 text-red-800',
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status] ?? statusConfig.geplant;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
