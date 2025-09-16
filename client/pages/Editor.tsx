import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

type Folder = { id: string; name: string; parentId?: string | null };

type PageDoc = { id: string; title: string; slug: string; folderId?: string | null; contentHtml: string; createdAt: string; updatedAt: string; description?: string; published?: boolean; tags?: string[] };

type EditorState = { folders: Folder[]; pages: PageDoc[] };

function loadState(productId: string): EditorState {
  try {
    const raw = localStorage.getItem(`editor_${productId}`);
    if (!raw) return { folders: [], pages: [] };
    const parsed = JSON.parse(raw);
    return { folders: parsed.folders || [], pages: parsed.pages || [] };
  } catch {
    return { folders: [], pages: [] };
  }
}

function saveState(productId: string, state: EditorState) {
  localStorage.setItem(`editor_${productId}`, JSON.stringify(state));
}

function getDescendantFolderIds(rootId: string, folders: Folder[]): Set<string> {
  const ids = new Set<string>();
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    ids.add(id);
    folders.filter((f) => f.parentId === id).forEach((f) => queue.push(f.id));
  }
  return ids;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildStaticHtml(title: string, pages: PageDoc[]) {
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

function importHtmlToPages(html: string): Array<{ title: string; content: string }> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sections: Array<{ title: string; content: string }> = [];
  const headings = Array.from(doc.querySelectorAll("h1, h2"));
  if (headings.length > 0) {
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const next = headings[i + 1];
      const title = h.textContent?.trim() || `Section ${i + 1}`;
      const range = doc.createRange();
      range.setStartAfter(h);
      if (next) range.setEndBefore(next);
      else range.setEndAfter(doc.body.lastChild as ChildNode);
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());
      sections.push({ title, content: container.innerHTML });
    }
  } else {
    const bodyHtml = doc.body.innerHTML;
    sections.push({ title: "Imported", content: bodyHtml });
  }
  return sections;
}

function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html
    .split(/\n{2,}/)
    .map((para) => (/^<h[1-6]>/.test(para.trim()) ? para : `<p>${para.trim()}</p>`))
    .join('\n');
  return html;
}

async function importIntoPage(file: File, onDone: (html: string) => void) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "docx") {
    alert("DOCX import is not supported in this local editor. Please convert to HTML or Markdown and import again.");
    return;
  }
  const text = await file.text();
  let html = '';
  if (ext === 'md' || ext === 'markdown') html = markdownToHtml(text);
  else html = new DOMParser().parseFromString(text, 'text/html').body.innerHTML;
  onDone(html);
}

function FolderNode({ folder, depth, state, selectedFolderId, setSelectedFolderId, renamingFolderId, setRenamingFolderId, renameFolder, deleteFolder }: {
  folder: Folder;
  depth: number;
  state: EditorState;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  renamingFolderId: string | null;
  setRenamingFolderId: (id: string | null) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}) {
  const children = state.folders.filter((f) => f.parentId === folder.id);
  return (
    <li className="group">
      <div className={`flex items-center justify-between rounded-md px-2 py-1 ${selectedFolderId === folder.id ? "bg-accent" : "hover:bg-accent"}`} style={{ paddingLeft: Math.min(depth, 4) * 8 }}>
        {renamingFolderId === folder.id ? (
          <input
            className="w-full rounded-sm border bg-background px-2 py-0.5 text-sm"
            autoFocus
            defaultValue={folder.name}
            onBlur={(e) => {
              renameFolder(folder.id, e.target.value.trim() || folder.name);
              setRenamingFolderId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const el = e.target as HTMLInputElement;
                renameFolder(folder.id, el.value.trim() || folder.name);
                setRenamingFolderId(null);
              }
            }}
          />
        ) : (
          <button className="flex-1 text-left text-sm" onClick={() => setSelectedFolderId(folder.id)}>{folder.name}</button>
        )}
        <div className="flex items-center gap-1 opacity-80">
          <button className="rounded border px-1 text-[11px]" title="Rename" onClick={() => setRenamingFolderId(folder.id)}>✏️</button>
          <button className="rounded border px-1 text-[11px]" title="Delete" onClick={() => deleteFolder(folder.id)}>🗑️</button>
        </div>
      </div>
      {children.length > 0 && (
        <ul className="pl-2">
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              state={state}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              renamingFolderId={renamingFolderId}
              setRenamingFolderId={setRenamingFolderId}
              renameFolder={renameFolder}
              deleteFolder={deleteFolder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Editor() {
  const { products } = useData();
  const q = useQuery();
  const navigate = useNavigate();
  const productId = q.get("productId") || "";
  const product = products.find((p) => p.id === productId);

  const [state, setState] = useState<EditorState>(() => loadState(productId));
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productId) saveState(productId, state);
  }, [productId, state]);

  useEffect(() => {
    if (!productId) return;
    const loaded = loadState(productId);
    setState(loaded);
  }, [productId]);

  const selectedPage = useMemo(() => state.pages.find((p) => p.id === selectedPageId) || null, [state.pages, selectedPageId]);

  function createFolder() {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, folders: [...s.folders, { id, name: `Folder ${s.folders.length + 1}`, parentId: selectedFolderId || null }] }));
    setSelectedFolderId(id);
    setRenamingFolderId(id);
  }

  function renameFolder(id: string, name: string) {
    setState((s) => ({ ...s, folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) }));
  }

  function deleteFolder(id: string) {
    setState((s) => ({
      ...s,
      folders: s.folders.filter((f) => {
        const toDelete = getDescendantFolderIds(id, s.folders);
        return !toDelete.has(f.id);
      }),
      pages: s.pages.map((p) => {
        const toDelete = getDescendantFolderIds(id, s.folders);
        return p.folderId && toDelete.has(p.folderId) ? { ...p, folderId: null } : p;
      }),
    }));
    if (selectedFolderId === id) setSelectedFolderId(null);
  }

  function createPage() {
    if (!selectedFolderId) {
      alert("Please create and select a folder first.");
      return;
    }
    const id = crypto.randomUUID();
    const title = `Page ${state.pages.length + 1}`;
    const now = new Date().toISOString();
    const page: PageDoc = { id, title, slug: slugify(title), folderId: selectedFolderId, contentHtml: "", createdAt: now, updatedAt: now };
    setState((s) => ({ ...s, pages: [...s.pages, page] }));
    setSelectedPageId(id);
  }

  function deletePage(id: string) {
    setState((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) }));
    if (selectedPageId === id) setSelectedPageId(null);
  }

  function updatePage(patch: Partial<PageDoc>) {
    if (!selectedPage) return;
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) => (p.id === selectedPage.id ? { ...p, ...patch, updatedAt: new Date().toISOString(), slug: patch.title && !patch.slug ? slugify(patch.title) : p.slug } : p)),
    }));
  }

  function onInsertImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      insertHTML(`<img src="${src}" alt="image" style="max-width:100%;height:auto;"/>`);
    };
    reader.readAsDataURL(file);
  }

  function onInsertFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const href = reader.result as string;
      const name = file.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      insertHTML(`<p><a href="${href}" download="${file.name}">Download ${name}</a></p>`);
    };
    reader.readAsDataURL(file);
  }

  function insertHTML(html: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false, html);
    const htmlContent = editorRef.current.innerHTML;
    updatePage({ contentHtml: htmlContent });
  }

  function applyFormat(cmd: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    const htmlContent = editorRef.current.innerHTML;
    updatePage({ contentHtml: htmlContent });
  }

  function openPreview() {
    const ordered = [...state.pages].sort((a, b) => a.title.localeCompare(b.title));
    const html = buildStaticHtml(product?.name || "Document", ordered);
    setPreviewHtml(html);
  }

  async function importDocument(file: File) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === "docx") {
      alert("DOCX import is not supported in this local editor. Please convert to HTML or Markdown and import again.");
      return;
    }
    const text = await file.text();
    let pages: Array<{ title: string; content: string }> = [];
    if (ext === "md" || ext === "markdown") {
      const html = markdownToHtml(text);
      const firstHeading = (text.match(/^\s*#\s+(.+)$/m) || [])[1];
      const title = firstHeading ? firstHeading.trim() : (product?.name ? `${product.name} - Imported` : "Imported Markdown");
      pages = [{ title, content: html }];
    } else {
      pages = importHtmlToPages(text);
    }
    let folderId = selectedFolderId;
    let willSelectPageId: string | null = null;
    if (!folderId) {
      folderId = crypto.randomUUID();
      setState((s) => ({ ...s, folders: [...s.folders, { id: folderId!, name: "Imported", parentId: null }] }));
      setSelectedFolderId(folderId);
    }
    const now = new Date().toISOString();
    const newPages = pages.map((pg, idx) => {
      const id = crypto.randomUUID();
      if (idx === 0) willSelectPageId = id;
      return { id, title: pg.title, slug: slugify(pg.title), folderId, contentHtml: pg.content, createdAt: now, updatedAt: now } as PageDoc;
    });
    setState((s) => ({ ...s, pages: [...s.pages, ...newPages] }));
    if (willSelectPageId) setSelectedPageId(willSelectPageId);
  }

  function exportPdf() {
    const ordered = [...state.pages].sort((a, b) => a.title.localeCompare(b.title));
    const html = buildStaticHtml(product?.name || "Document", ordered);
    const w = window.open("")!;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  function downloadHtml() {
    const ordered = [...state.pages].sort((a, b) => a.title.localeCompare(b.title));
    const html = buildStaticHtml(product?.name || "Document", ordered);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(product?.name || "document").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (editorRef.current && selectedPage) {
      editorRef.current.innerHTML = selectedPage.contentHtml || "";
    }
  }, [selectedPageId]);

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => navigate("/products")}>Back</button>
        </div>
        <div className="rounded-xl border bg-card p-6">Product not found. Please navigate from Products page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="text-sm text-muted-foreground">Project Document. Create Topics and pages.</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm">
            Import Document
            <input type="file" accept=".html,.htm,.md,.markdown,.docx" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importDocument(file);
              e.currentTarget.value = "";
            }} />
          </label>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => navigate(`/products?customerId=${encodeURIComponent(product.customerId)}`)}>Back to products</button>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={openPreview}>Preview</button>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={exportPdf}>Export PDF</button>
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={downloadHtml}>Publish (Export HTML)</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-3 rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium"></div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border px-2 py-1 text-xs" onClick={createFolder}>{selectedFolderId ? "New subfolder" : "New folder"}</button>
              <button className="rounded-md border px-2 py-1 text-xs disabled:opacity-50" disabled={!selectedFolderId} title={!selectedFolderId ? "Select a folder first" : undefined} onClick={createPage}>New page</button>
              <label className="cursor-pointer rounded-md border px-2 py-1 text-xs">
                Import into folder
                <input type="file" accept=".html,.htm,.md,.markdown,.docx" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importDocument(file);
                  e.currentTarget.value = "";
                }} />
              </label>
            </div>
          </div>
          <ul className="space-y-1">
            <li>
              <button className={`w-full rounded-md px-2 py-1 text-left text-sm ${selectedFolderId === null ? "bg-accent" : "hover:bg-accent"}`} onClick={() => setSelectedFolderId(null)}>All Folders</button>
            </li>
            {state.folders.filter((f) => !f.parentId).map((root) => (
              <FolderNode
                key={root.id}
                folder={root}
                depth={0}
                state={state}
                selectedFolderId={selectedFolderId}
                setSelectedFolderId={setSelectedFolderId}
                renamingFolderId={renamingFolderId}
                setRenamingFolderId={setRenamingFolderId}
                renameFolder={renameFolder}
                deleteFolder={deleteFolder}
              />
            ))}
          </ul>

          <div className="mt-4">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Pages</div>
            <ul className="space-y-1">
              {state.pages
                .filter((p) => {
                  if (!selectedFolderId) return true;
                  const ids = getDescendantFolderIds(selectedFolderId, state.folders);
                  ids.add(selectedFolderId);
                  return p.folderId ? ids.has(p.folderId) : false;
                })
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((p) => (
                  <li key={p.id} className="group">
                    <div className={`flex items-center justify-between rounded-md px-2 py-1 ${selectedPageId === p.id ? "bg-accent" : "hover:bg-accent"}`}>
                      <button className="flex-1 text-left text-sm" onClick={() => setSelectedPageId(p.id)}>{p.title}</button>
                      <div className="flex items-center gap-1 opacity-80">
                        <button className="rounded border px-1 text-[11px]" title="Rename" onClick={() => {
                          const title = prompt("Rename page", p.title);
                          if (title) updatePage({ id: p.id } as any);
                          setState((s) => ({ ...s, pages: s.pages.map((pg) => (pg.id === p.id ? { ...pg, title, slug: slugify(title) } : pg)) }));
                        }}>✏️</button>
                        <button className="rounded border px-1 text-[11px]" title="Delete" onClick={() => deletePage(p.id)}>🗑️</button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>

        <main className="col-span-9 rounded-xl border bg-card">
          {!selectedPage ? (
            <div className="p-6">
              {state.pages.length === 0 ? (
                <div className="rounded-lg border bg-background p-6 text-sm">
                  <div className="mb-2 text-xs uppercase text-muted-foreground">Product Document Page</div>
                  <div className="mb-3 font-medium">Create topics and pages. Folders can be nested.</div>
                  <div className="mb-3 text-xs text-muted-foreground">Flow: Create folder → Update folder → Create pages inside → Write content.</div>
                  <div className="mb-3 font-medium">Import your existing document</div>
                  <p className="mb-3 text-muted-foreground">Create a folder, then import .html or .md to auto-create pages, or start adding pages manually.</p>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border px-3 py-1 text-xs" onClick={createFolder}>Create folder</button>
                    <label className="cursor-pointer rounded-md border px-3 py-1 text-xs">
                      Import Document
                      <input type="file" accept=".html,.htm,.md,.markdown,.docx" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) importDocument(file);
                        e.currentTarget.value = "";
                      }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Select a page or create a new one to start editing.</div>
              )}
            </div>
          ) : (
            <div className="flex h-[70vh] flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b p-2">
                <input
                  className="mr-2 min-w-[200px] flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                  value={selectedPage.title}
                  onChange={(e) => setState((s) => ({ ...s, pages: s.pages.map((p) => (p.id === selectedPage.id ? { ...p, title: e.target.value } : p)) }))}
                  onBlur={(e) => updatePage({ title: e.target.value })}
                  placeholder="Page title"
                />
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => applyFormat("bold")}>Bold</button>
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => applyFormat("italic")}>Italic</button>
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => applyFormat("formatBlock", "H2")}>H2</button>
                <label className="cursor-pointer rounded-md border px-2 py-1 text-xs">
                  Insert image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && onInsertImage(e.target.files[0])} />
                </label>
                <label className="cursor-pointer rounded-md border px-2 py-1 text-xs">
                  Attach file
                  <input type="file" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && onInsertFile(e.target.files[0])} />
                </label>
                <label className="cursor-pointer rounded-md border px-2 py-1 text-xs">
                  Import into page
                  <input type="file" accept=".html,.htm,.md,.markdown,.docx" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importIntoPage(f, (html) => updatePage({ contentHtml: html }));
                    e.currentTarget.value = "";
                  }} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-b p-2">
                <select
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                  value={selectedPage.folderId || ""}
                  onChange={(e) => updatePage({ folderId: e.target.value || null })}
                >
                  <option value="">No folder</option>
                  {state.folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <input
                  className="min-w-[200px] flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  placeholder="Description"
                  value={selectedPage.description || ""}
                  onChange={(e) => updatePage({ description: e.target.value })}
                />
                <input
                  className="min-w-[200px] flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  placeholder="Tags (comma separated)"
                  defaultValue={(selectedPage.tags || []).join(", ")}
                  onBlur={(e) => updatePage({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={!!selectedPage.published} onChange={(e) => updatePage({ published: e.target.checked })} /> Published
                </label>
              </div>
              <div
                ref={editorRef}
                className="min-h-0 flex-1 overflow-auto p-4 prose max-w-none"
                contentEditable
                onInput={(e) => updatePage({ contentHtml: (e.target as HTMLDivElement).innerHTML })}
                suppressContentEditableWarning
              />
            </div>
          )}
        </main>
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
