import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { DocsChrome } from "./DocsChrome";
import { DocsSearchDialog } from "./DocsSearchDialog";
import { DOCS_PAGES } from "./docs-pages";

export default function PublicApiDocs() {
  const params = useParams();
  const slug = (params["*"] ?? "").replace(/\/$/, "");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (slug === "introducao") {
    return <Navigate to="/docs" replace />;
  }

  const page = DOCS_PAGES[slug];
  if (!page) {
    return <Navigate to="/docs" replace />;
  }

  return (
    <>
      <DocsChrome
        slug={slug}
        page={page}
        onOpenSearch={() => setSearchOpen(true)}
      >
        {page.body}
      </DocsChrome>
      <DocsSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
