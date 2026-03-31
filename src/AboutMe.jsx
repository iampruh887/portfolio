import "./style/AboutMe.css";
import Menu from "./Menu.jsx";

function AboutMe({ onNavigate }) {
    return (
        <div className="about-me">
            {/* Background image rotated 90deg */}
            <div className="image-21"></div>

            {/* Menu component */}
            <div className="about-menu">
                <Menu onNavigate={onNavigate} />
            </div>

            {/* Profile image */}
            <div className="image-4"></div>

            {/* Changing image text */}
            <div className="changing-image-text">this image will keep changing</div>

            {/* Top banner image */}
            <div className="image-22"></div>

            {/* Profile picture with decorative elements */}
            <div className="image-23"></div>
            <div className="image-25"></div>
            <div className="image-27"></div>
            <div className="image-28"></div>
            <div className="image-29"></div>

            {/* Small profile image */}
            <div className="rectangle-12"></div>

            {/* Languages section */}
            <div className="rectangle-15"></div>
            <div className="language-english">English</div>
            <div className="language-hindi">Hindi</div>
            <div className="language-telugu">Telugu</div>
            <div className="language-assamese">Assamese</div>

            {/* Star ratings for languages */}
            {/* English - 4 stars */}
            <div className="star-1"></div>
            <div className="star-2"></div>
            <div className="star-3"></div>
            <div className="star-4"></div>
            <div className="star-5"></div>

            {/* Hindi - 4 stars */}
            <div className="star-6"></div>
            <div className="star-7"></div>
            <div className="star-8"></div>
            <div className="star-9"></div>
            <div className="star-10"></div>

            {/* Telugu - 2 stars */}
            <div className="star-11"></div>
            <div className="star-12"></div>
            <div className="star-22"></div>
            <div className="star-21"></div>
            <div className="star-15"></div>

            {/* Assamese - 1 star */}
            <div className="star-16"></div>
            <div className="star-23"></div>
            <div className="star-25"></div>
            <div className="star-24"></div>
            <div className="star-20"></div>

            {/* Tech stack icons */}
            <div className="image-1"></div>
            <div className="rectangle-27"></div>
            <div className="rectangle-28"></div>
            <div className="image-2"></div>
            <div className="rectangle-23"></div>
            <div className="rectangle-21"></div>
            <div className="rectangle-22"></div>
            <div className="rectangle-24"></div>
            <div className="rectangle-25"></div>
            <div className="image-3"></div>
            <div className="rectangle-29"></div>

            {/* Experience section */}
            <div className="group-1">
                <div className="rectangle-26"></div>
                <div className="image-12"></div>
                <div className="image-6"></div>
                <div className="image-7"></div>
                <div className="image-10"></div>
                <div className="image-11"></div>
                <div className="image-9"></div>
                <div className="image-8"></div>
                <div className="exp-1">AI Intern @ StealthStartup</div>
                <div className="exp-2">AI Intern @ StealthStartup</div>
                <div className="exp-3">Python Intern @ Jobmato</div>
                <div className="exp-4">Research Intern @ DLRL</div>
                <div className="exp-5">Coordinator @ overBOOKED</div>
                <div className="exp-6">Tech head @ INIZIO '25</div>
                <div className="exp-7">Coordinator @ Mavericks society</div>
            </div>

            {/* Projects section */}
            <div className="rectangle-16"></div>
            <div className="music-note"></div>
            <div className="image-13"></div>
            <div className="image-14"></div>
            <div className="image-16"></div>
            <div className="image-17"></div>
            <div className="image-18"></div>
            <div className="image-19"></div>
            <div className="project-1">Deepfake audio detection (comsys6 hackathon)</div>
            <div className="project-2">nanoGPT on Hindi literature</div>
            <div className="project-3">Implementing CLIP from Scratch</div>
            <div className="project-4">Visually Controlled Robotic Arm</div>
            <div className="project-5">Lunar Lander Optimization</div>
            <div className="project-6">Fashion MNIST Classifier</div>
            <div className="project-7">Bigram Language Model</div>
            <div className="project-8">Facial Recognition and Classification Model</div>
        </div>
    );
}

export default AboutMe;
