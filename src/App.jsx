import { useState } from "react";
import Menu from "./Menu.jsx";
import Blog from "./Blogs.jsx";
import Projects from "./Projects.jsx";

function App(){
    const [currentView, setCurrentView] = useState('menu');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleNavigate = (view) => {
        // Don't navigate if already on that view
        if (view === currentView) {
            return;
        }
        
        if (view === 'blogs' || view === 'projects') {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentView(view);
                setIsTransitioning(false);
            }, 300);
        } else {
            setCurrentView(view);
        }
    };

    return(
        <>
            {currentView === 'menu' && !isTransitioning && <Menu onNavigate={handleNavigate} />}
            {currentView === 'blogs' && <Blog onNavigate={handleNavigate} />}
            {currentView === 'projects' && <Projects onNavigate={handleNavigate} />}
        </>
    )
}
export default App;