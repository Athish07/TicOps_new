interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="card grid min-h-[220px] place-items-center p-8 text-center">
      <div>
        <h3 className="text-lg font-semibold text-ey-gray-900">{title}</h3>
        {description ? <p className="mt-2 max-w-md text-sm text-ey-gray-500">{description}</p> : null}
      </div>
    </div>
  );
}
