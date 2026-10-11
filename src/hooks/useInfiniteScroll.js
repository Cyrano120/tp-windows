import { useState, useEffect } from "react";

export default function useInfiniteScroll(items, perPage = 8) {
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const displayed = items.slice(0, page * perPage);
  const hasMore = displayed.length < items.length;

  useEffect(() => {
    const onScroll = () => {
      if (loadingMore || !hasMore) return;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
      if (nearBottom) {
        setLoadingMore(true);
        setTimeout(() => {
          setPage((p) => p + 1);
          setLoadingMore(false);
        }, 300);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadingMore, hasMore]);

  return { displayed, hasMore, loadingMore };
}
