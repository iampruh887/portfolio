import { useState, useEffect, useRef } from "react";
import "./style/Projects.css";
import Menu from "./Menu.jsx";
import { fetchList } from "./lib/content.js";
import commentIcon from "./assets/comment.png";
import chevronBackward from "./assets/chevron_backward.png";
import fullscreenIcon from "./assets/fullscreen.png";
import chevronForward from "./assets/chevron_forward.png";
import favoriteIcon from "./assets/favorite.png";
import eyeOn from "./assets/Eye.png";
import eyeOff from "./assets/Eye off.png";

function ProjectCard({ project }) {
    if (!project) return null;
    return (
        <div className="project-card">
            {project.date_label && <span className="project-date">{project.date_label}</span>}
            <h2 className="project-title">{project.title}</h2>
            {project.tech?.length > 0 && (
                <div className="project-tech">
                    {project.tech.map((t, i) => <span key={`${t}-${i}`} className="tech-chip">{t}</span>)}
                </div>
            )}
            {project.image_url && <img src={project.image_url} alt="" className="project-image" />}
            <p className="project-desc">{project.description}</p>
            {(project.repo_url || project.live_url) && (
                <div className="project-links">
                    {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer">Code ↗</a>}
                    {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">Live ↗</a>}
                </div>
            )}
        </div>
    );
}

function Projects({ onNavigate }) {
    const [currentProject, setCurrentProject] = useState(0);
    const [direction, setDirection] = useState('');
    const [viewMode, setViewMode] = useState('on');
    const [isListVisible, setIsListVisible] = useState(true);
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        fetchList('projects')
            .then((rows) => { setProjects(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    const timersRef = useRef([]);
    const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
    useEffect(() => clearTimers, []);

    const totalProjects = projects.length;
    const getPreviousProject = () => (currentProject === 0 ? totalProjects - 1 : currentProject - 1);
    const getNextProject = () => (currentProject === totalProjects - 1 ? 0 : currentProject + 1);

    const handlePrevious = () => {
        if (totalProjects < 2) return;
        clearTimers();
        setDirection('slide-right');
        timersRef.current.push(setTimeout(() => setCurrentProject((p) => (p === 0 ? projects.length - 1 : p - 1)), 300));
        timersRef.current.push(setTimeout(() => setDirection(''), 600));
    };

    const handleNext = () => {
        if (totalProjects < 2) return;
        clearTimers();
        setDirection('slide-left');
        timersRef.current.push(setTimeout(() => setCurrentProject((p) => (p === projects.length - 1 ? 0 : p + 1)), 300));
        timersRef.current.push(setTimeout(() => setDirection(''), 600));
    };

    const toggleList = () => setIsListVisible(!isListVisible);

    if (status !== 'ready' || totalProjects === 0) {
        return (
            <div className="projects-wrap">
                <div className="projects-empty">
                    {status === 'loading' ? 'Loading…' :
                     status === 'error' ? "Couldn't load projects." : 'No projects yet.'}
                </div>
                <div className="menu-in-projects"><Menu onNavigate={onNavigate} /></div>
            </div>
        );
    }

    return (
        <>
            <div className="projects-wrap">
                <div className="view-toggle">
                    <div className={`view-option ${viewMode === 'on' ? 'active' : ''}`} onClick={() => setViewMode('on')}>
                        <img src={eyeOn} alt="eye on" className="eye-icon" />
                    </div>
                    <div className={`view-option ${viewMode === 'off' ? 'active' : ''}`} onClick={() => setViewMode('off')}>
                        <img src={eyeOff} alt="eye off" className="eye-icon" />
                    </div>
                </div>

                {viewMode === 'on' ? (
                    <>
                        <div className="menu-in-projects">
                            <Menu onNavigate={onNavigate} />
                        </div>
                        <div className="projectview-container">
                            <div className="project-carousel">
                                <div className="project-side project-left" onClick={handlePrevious}>
                                    <div className="project-preview-content">
                                        <span className="preview-hint">‹</span>
                                        <div className="preview-number">{projects[getPreviousProject()]?.title}</div>
                                    </div>
                                </div>
                                <div className={`projectview ${direction}`}>
                                    <ProjectCard project={projects[currentProject]} />
                                </div>
                                <div className="project-side project-right" onClick={handleNext}>
                                    <div className="project-preview-content">
                                        <span className="preview-hint">›</span>
                                        <div className="preview-number">{projects[getNextProject()]?.title}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="project-icon-bar">
                                <img src={commentIcon} alt="comment" className="project-icon" />
                                <img src={chevronBackward} alt="backward" className="project-icon" onClick={handlePrevious} />
                                <img src={fullscreenIcon} alt="fullscreen" className="project-icon" />
                                <img src={chevronForward} alt="forward" className="project-icon" onClick={handleNext} />
                                <img src={favoriteIcon} alt="favorite" className="project-icon" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="projects-list-view">
                        <div className={`hamburger ${!isListVisible ? 'rotated' : ''}`} onClick={toggleList}></div>
                        {isListVisible && (
                            <div className="project-list">
                                {projects.map((p, i) => (
                                    <div key={p.id}
                                         className={`project-list-item ${i === currentProject ? 'active' : ''}`}
                                         onClick={() => setCurrentProject(i)}>
                                        {p.title}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="projectview-list-container">
                            <div className={`projectview-list ${!isListVisible ? 'expanded' : ''}`}>
                                <ProjectCard project={projects[currentProject]} />
                            </div>
                            <div className="project-list-icon-bar">
                                <img src={commentIcon} alt="comment" className="project-icon" />
                                <img src={chevronBackward} alt="backward" className="project-icon" onClick={handlePrevious} />
                                <img src={fullscreenIcon} alt="fullscreen" className="project-icon" />
                                <img src={chevronForward} alt="forward" className="project-icon" onClick={handleNext} />
                                <img src={favoriteIcon} alt="favorite" className="project-icon" />
                            </div>
                        </div>
                        <div className="menu-in-projects-list">
                            <Menu onNavigate={onNavigate} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Projects;
