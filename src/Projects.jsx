import { useState } from "react";
import "./style/Projects.css";
import Menu from "./Menu.jsx";
import commentIcon from "./assets/comment.png";
import chevronBackward from "./assets/chevron_backward.png";
import fullscreenIcon from "./assets/fullscreen.png";
import chevronForward from "./assets/chevron_forward.png";
import favoriteIcon from "./assets/favorite.png";
import eyeOn from "./assets/Eye.png";
import eyeOff from "./assets/Eye off.png";

function Projects({ onNavigate }) {
    const [currentProject, setCurrentProject] = useState(0);
    const [direction, setDirection] = useState('');
    const [viewMode, setViewMode] = useState('on'); // 'on' or 'off'
    const [isListVisible, setIsListVisible] = useState(true);
    const totalProjects = 5; // You can change this to the actual number of projects

    const getPreviousProject = () => {
        return currentProject === 0 ? totalProjects - 1 : currentProject - 1;
    };

    const getNextProject = () => {
        return currentProject === totalProjects - 1 ? 0 : currentProject + 1;
    };

    const handlePrevious = () => {
        setDirection('slide-right');
        setTimeout(() => {
            setCurrentProject((prev) => (prev === 0 ? totalProjects - 1 : prev - 1));
        }, 300);
        setTimeout(() => {
            setDirection('');
        }, 600);
    };

    const handleNext = () => {
        setDirection('slide-left');
        setTimeout(() => {
            setCurrentProject((prev) => (prev === totalProjects - 1 ? 0 : prev + 1));
        }, 300);
        setTimeout(() => {
            setDirection('');
        }, 600);
    };

    const toggleList = () => {
        setIsListVisible(!isListVisible);
    };

    return (
        <>
            <div className="projects-wrap">
                <div className="view-toggle">
                    <div 
                        className={`view-option ${viewMode === 'on' ? 'active' : ''}`}
                        onClick={() => setViewMode('on')}
                    >
                        <img src={eyeOn} alt="eye on" className="eye-icon" />
                    </div>
                    <div 
                        className={`view-option ${viewMode === 'off' ? 'active' : ''}`}
                        onClick={() => setViewMode('off')}
                    >
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
                                        <div className="preview-number">Project {getPreviousProject() + 1}</div>
                                    </div>
                                </div>
                                <div className={`projectview ${direction}`}>
                                    <div className="project-number">Project {currentProject + 1}</div>
                                </div>
                                <div className="project-side project-right" onClick={handleNext}>
                                    <div className="project-preview-content">
                                        <div className="preview-number">Project {getNextProject() + 1}</div>
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
                                <div className="project-list-item">Project 1</div>
                                <div className="project-list-item">Project 2</div>
                                <div className="project-list-item">Project 3</div>
                                <div className="project-list-item">Project 4</div>
                                <div className="project-list-item">Project 5</div>
                            </div>
                        )}
                        <div className="projectview-list-container">
                            <div className={`projectview-list ${!isListVisible ? 'expanded' : ''}`}>
                                <div className="project-number">Project {currentProject + 1}</div>
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
