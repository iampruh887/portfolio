import { useState } from "react";
import "./style/Blogs.css";
import Menu from "./Menu.jsx";
import commentIcon from "./assets/comment.png";
import chevronBackward from "./assets/chevron_backward.png";
import fullscreenIcon from "./assets/fullscreen.png";
import chevronForward from "./assets/chevron_forward.png";
import favoriteIcon from "./assets/favorite.png";

function Blog({ onNavigate }) {
    const [isListVisible, setIsListVisible] = useState(true);
    const [currentBlog, setCurrentBlog] = useState(0);
    const totalBlogs = 10;

    const toggleList = () => {
        setIsListVisible(!isListVisible);
    };

    const handlePrevious = () => {
        setCurrentBlog((prev) => (prev === 0 ? totalBlogs - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentBlog((prev) => (prev === totalBlogs - 1 ? 0 : prev + 1));
    };

    const handleBlogClick = (index) => {
        setCurrentBlog(index);
    };

    return (
        <>
            <div className="blog-wrap">
                <div className={`hamburger ${!isListVisible ? 'rotated' : ''}`} onClick={toggleList}></div>
                {isListVisible && (
                    <div className="list">
                        <div className={`blogitem ${currentBlog === 0 ? 'active' : ''}`} onClick={() => handleBlogClick(0)}>blogitem1</div>
                        <div className={`blogitem ${currentBlog === 1 ? 'active' : ''}`} onClick={() => handleBlogClick(1)}>blogitem2</div>
                        <div className={`blogitem ${currentBlog === 2 ? 'active' : ''}`} onClick={() => handleBlogClick(2)}>blogitem3</div>
                        <div className={`blogitem ${currentBlog === 3 ? 'active' : ''}`} onClick={() => handleBlogClick(3)}>blogitem4</div>
                        <div className={`blogitem ${currentBlog === 4 ? 'active' : ''}`} onClick={() => handleBlogClick(4)}>blogitem5</div>
                        <div className={`blogitem ${currentBlog === 5 ? 'active' : ''}`} onClick={() => handleBlogClick(5)}>blogitem6</div>
                        <div className={`blogitem ${currentBlog === 6 ? 'active' : ''}`} onClick={() => handleBlogClick(6)}>blogitem7</div>
                        <div className={`blogitem ${currentBlog === 7 ? 'active' : ''}`} onClick={() => handleBlogClick(7)}>blogitem8</div>
                        <div className={`blogitem ${currentBlog === 8 ? 'active' : ''}`} onClick={() => handleBlogClick(8)}>blogitem9</div>
                        <div className={`blogitem ${currentBlog === 9 ? 'active' : ''}`} onClick={() => handleBlogClick(9)}>blogitem10</div>
                    </div>
                )}
                <div className="blogview-container">
                    <div className={`blogview ${!isListVisible ? 'expanded' : ''}`}>
                        <div className="blog-content">
                            <h2>Blog Post {currentBlog + 1}</h2>
                            <p>This is the content for blog post {currentBlog + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                        </div>
                    </div>
                    <div className="icon-bar">
                        <img src={commentIcon} alt="comment" className="icon" />
                        <img src={chevronBackward} alt="backward" className="icon" onClick={handlePrevious} />
                        <img src={fullscreenIcon} alt="fullscreen" className="icon" />
                        <img src={chevronForward} alt="forward" className="icon" onClick={handleNext} />
                        <img src={favoriteIcon} alt="favorite" className="icon" />
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