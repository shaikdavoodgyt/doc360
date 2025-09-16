export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-muted-foreground max-w-prose">{description}</p> : null}
      <p className="mt-4 text-xs text-muted-foreground">Connect your database and continue prompting to flesh out this page.</p>
    </div>
  );
}
