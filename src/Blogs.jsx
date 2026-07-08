import { useState, useEffect } from "react";
import Shell from "./components/Shell.jsx";
import RingNav from "./components/RingNav.jsx";
import { fetchList } from "./lib/content.js";

function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt) ? String(d)
        : dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [status, setStatus] = useState('loading');
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        fetchList('blogs')
            .then((rows) => { setBlogs(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrent((c) => Math.min(c + 1, blogs.length - 1));
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrent((c) => Math.max(c - 1, 0));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [blogs.length]);

    const b = blogs[current];

    return (
        <Shell label="NOTEBOOK — OCCASIONAL WRITING">
            {status === 'loading' && <p className="status-line">loading…</p>}
            {status === 'error' && <p className="status-line">couldn't reach the archive. try again later.</p>}
            {status === 'ready' && blogs.length === 0 && (
                <p className="status-line">no entries yet — check back soon.</p>
            )}
            {status === 'ready' && blogs.length > 0 && (
                <div className="ledger">
                    <ol className="ledger-index scroll-fade">
                        {blogs.map((blog, i) => (
                            <li key={blog.id}
                                className={`ledger-row ${i === current ? 'active' : ''}`}
                                onClick={() => setCurrent(i)}>
                                <span className="lg-num">{String(i + 1).padStart(2, '0')}</span>
                                <span className="lg-title">{blog.title}</span>
                                <span className="lg-date">{fmtDate(blog.published_at)}</span>
                            </li>
                        ))}
                    </ol>
                    <RingNav />
                    <article className="ledger-detail scroll-fade">
                        <h1 className="detail-title">{b.title}</h1>
                        <span className="reader-date">{fmtDate(b.published_at)}</span>
                        {b.cover_image_url && <img src={b.cover_image_url} alt="" className="reader-cover" />}
                        <div className="reader-body">
                            {(b.content ?? '').split(/\n{2,}/).map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                        <p className="hint-line">↑↓ to browse</p>
                    </article>
                </div>
            )}
        </Shell>
    );
}

export default Blog;
