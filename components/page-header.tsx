export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-white/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}
