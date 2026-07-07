import { useState, useEffect } from "react";
import Shell from "./components/Shell.jsx";
import { fetchList } from "./lib/content.js";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState('loading');
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        fetchList('projects')
            .then((rows) => { setProjects(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrent((c) => Math.min(c + 1, projects.length - 1));
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrent((c) => Math.max(c - 1, 0));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [projects.length]);

    const p = projects[current];
    const label = status === 'ready' && projects.length > 0
        ? `INDEX OF WORKS — ${String(current + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`
        : 'INDEX OF WORKS';

    return (
        <Shell label={label}>
            {status === 'loading' && <p className="status-line">loading…</p>}
            {status === 'error' && <p className="status-line">couldn't reach the archive. try again later.</p>}
            {status === 'ready' && projects.length === 0 && (
                <p className="status-line">nothing catalogued yet.</p>
            )}
            {status === 'ready' && projects.length > 0 && (
                <div className="ledger">
                    <ol className="ledger-index scroll-fade">
                        {projects.map((proj, i) => (
                            <li key={proj.id}
                                className={`ledger-row ${i === current ? 'active' : ''}`}
                                onClick={() => setCurrent(i)}>
                                <span className="lg-num">{String(i + 1).padStart(2, '0')}</span>
                                <span className="lg-title">{proj.title}</span>
                                <span className="lg-date">{proj.date_label}</span>
                            </li>
                        ))}
                    </ol>
                    <article className="ledger-detail scroll-fade">
                        <span className="kicker">
                            <b>{String(current + 1).padStart(2, '0')}</b>
                            {p.date_label ? ` — ${p.date_label}` : ''}
                        </span>
                        <h1 className="detail-title">{p.title}</h1>
                        {p.tech?.length > 0 && (
                            <ul className="tag-row">
                                {p.tech.map((t, i) => <li key={`${t}-${i}`}>{t}</li>)}
                            </ul>
                        )}
                        {p.image_url && <img src={p.image_url} alt="" className="detail-image" />}
                        <p className="detail-body">{p.description}</p>
                        {(p.repo_url || p.live_url || p.links?.length > 0) && (
                            <div className="link-row">
                                {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer">code ↗</a>}
                                {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer">live ↗</a>}
                                {(p.links ?? []).map((l, i) => (
                                    <a key={`${l.url}-${i}`} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>
                                ))}
                            </div>
                        )}
                        <p className="hint-line">↑↓ to browse</p>
                    </article>
                </div>
            )}
        </Shell>
    );
}

export default Projects;
