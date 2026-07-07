import { useState, useEffect } from "react";
import "./style/Blogs.css";
import Menu from "./Menu.jsx";
import { fetchList } from "./lib/content.js";

function Blog({ onNavigate }) {
    const [isListVisible, setIsListVisible] = useState(true);
    const [currentBlog, setCurrentBlog] = useState(0);
    const [blogs, setBlogs] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ready | error

    useEffect(() => {
        fetchList('blogs')
            .then((rows) => { setBlogs(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    const totalBlogs = blogs.length;
    const toggleList = () => setIsListVisible(!isListVisible);
    const handlePrevious = () => { if (totalBlogs === 0) return; setCurrentBlog((p) => (p === 0 ? totalBlogs - 1 : p - 1)); };
    const handleNext = () => { if (totalBlogs === 0) return; setCurrentBlog((p) => (p === totalBlogs - 1 ? 0 : p + 1)); };

    const blog = blogs[currentBlog];

    return (
        <>
            <div className="blog-wrap">
                <span className="page-label">BLOGS</span>
                <div className={`hamburger ${!isListVisible ? 'rotated' : ''}`} onClick={toggleList}></div>
                {isListVisible && (
                    <div className="list">
                        {blogs.map((b, i) => (
                            <div key={b.id}
                                 className={`blogitem ${currentBlog === i ? 'active' : ''}`}
                                 onClick={() => setCurrentBlog(i)}>
                                {b.title}
                            </div>
                        ))}
                    </div>
                )}
                <div className="blogview-container">
                    <div className={`blogview ${!isListVisible ? 'expanded' : ''}`}>
                        <div className="blog-content">
                            {status === 'loading' && <p>Loading…</p>}
                            {status === 'error' && <p>Couldn't load blogs. Try again later.</p>}
                            {status === 'ready' && !blog && <p>No blogs yet — check back soon.</p>}
                            {blog && (
                                <article className="blog-article">
                                    <h2>{blog.title}</h2>
                                    {blog.published_at && (
                                        <span className="blog-date">
                                            {new Date(blog.published_at).toLocaleDateString('en-US', {
                                                month: 'long', day: 'numeric', year: 'numeric',
                                            })}
                                        </span>
                                    )}
                                    {blog.cover_image_url && (
                                        <img src={blog.cover_image_url} alt="" className="blog-cover" />
                                    )}
                                    {(blog.content ?? '').split(/\n{2,}/).map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </article>
                            )}
                        </div>
                    </div>
                    <div className="dock">
                        <button onClick={handlePrevious} aria-label="previous">‹</button>
                        <span className="dock-counter">
                            <b>{totalBlogs ? String(currentBlog + 1).padStart(2, '0') : '00'}</b> / {String(totalBlogs).padStart(2, '0')}
                        </span>
                        <button onClick={handleNext} aria-label="next">›</button>
                    </div>
                </div>
                <div className="menu-in-blog">
                    <Menu onNavigate={onNavigate} />
                </div>
            </div>
        </>
    );
}

export default Blog;