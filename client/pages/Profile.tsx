import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user, role } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="mt-1 text-lg font-medium">{user?.name} <span className="ml-2 rounded-full border px-2 py-0.5 text-xs align-middle">{role}</span></div>
        <div className="mt-2">{user?.email}</div>
      </div>
    </div>
  );
}
