import Placeholder from "@/components/Placeholder";

export default function Editor() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
      <Placeholder title="Editor" description="Folder tree on the left, WYSIWYG center, metadata and actions on the right. We'll integrate a rich text editor and live preview next." />
    </div>
  );
}
