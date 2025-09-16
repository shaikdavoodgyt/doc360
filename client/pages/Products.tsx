import { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EditorPage = { id: string; title: string; slug: string; folderId?: string | null; contentHtml: string };

type EditorState = { folders: Array<{ id: string; name: string; parentId?: string | null }>; pages: EditorPage[] };

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function loadEditorState(productId: string): EditorState {
  try {
    const raw = localStorage.getItem(`editor_${productId}`);
    if (!raw) return { folders: [], pages: [] };
    const parsed = JSON.parse(raw);
    return { folders: parsed.folders || [], pages: parsed.pages || [] };
  } catch {
    return { folders: [], pages: [] };
  }
}

function buildStaticHtml(title: string, pages: EditorPage[]) {
  const navLinks = pages.map((p) => `<li><a href="#${p.slug}">${escapeHtml(p.title)}</a></li>`).join("");
  const sections = pages
    .map(
      (p) => `<section id="${p.slug}" style="padding:40px 0;border-top:1px solid #e5e7eb;">
  <h2 style="font-size:24px;margin-bottom:12px;">${escapeHtml(p.title)}</h2>
  <div>${p.contentHtml || ""}</div>
</section>`
    )
    .join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:0;padding:0;color:#111827}
    header{position:sticky;top:0;background:#111827;color:white;padding:16px 24px;z-index:10}
    .container{max-width:960px;margin:0 auto;padding:0 24px}
    nav ul{list-style:none;display:flex;gap:16px;padding:0;margin:0}
    a{color:#2563eb;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <header><div class="container"><strong>${escapeHtml(title)}</strong></div></header>
  <main class="container" style="padding:24px 0;">
    <aside style="float:right;width:240px;padding-left:24px;">
      <nav><ul>${navLinks}</ul></nav>
    </aside>
    <article style="margin-right:264px;">${sections}</article>
  </main>
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function Products() {
  const { products } = useData();
  const q = useQuery();
  const navigate = useNavigate();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const customerId = q.get("customerId");
    return customerId ? products.filter((p) => p.customerId === customerId) : products;
  }, [products, q]);

  function onPreview(productId: string, title: string) {
    const state = loadEditorState(productId);
    const ordered = [...state.pages].sort((a, b) => a.title.localeCompare(b.title));
    const html = buildStaticHtml(title, ordered);
    setPreviewHtml(html);
  }

  function onDownload(productId: string, title: string) {
    const state = loadEditorState(productId);
    const ordered = [...state.pages].sort((a, b) => a.title.localeCompare(b.title));
    const html = buildStaticHtml(title, ordered);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        {q.get("customerId") && (
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => navigate("/customers")}>Back to customers</button>
        )}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No products yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4">
                <div className="mb-1 text-sm text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleString()}</div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.desc || "No description"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-md border px-3 py-1 text-xs hover:bg-accent" onClick={() => navigate(`/editor?productId=${encodeURIComponent(p.id)}`)}>Open editor</button>
                  <button className="rounded-md border px-3 py-1 text-xs hover:bg-accent" onClick={() => onPreview(p.id, p.name)}>Preview</button>
                  <button className="rounded-md border px-3 py-1 text-xs hover:bg-accent" onClick={() => onDownload(p.id, p.name)}>Download HTML</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!previewHtml} onOpenChange={(o) => !o && setPreviewHtml(null)}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe title="preview" className="h-[70vh] w-full rounded-md border" srcDoc={previewHtml} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
