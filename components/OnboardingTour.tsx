
import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import DatabaseIcon from './icons/DatabaseIcon';

interface OnboardingTourProps {
    onFinish: () => void;
}

const steps = [
    {
        title: "Welcome to the Ultimate Proxy Suite!",
        content: "This quick tour will guide you through the core workflow of the application. Let's get started!",
        icon: <span className="text-5xl">🚀</span>
    },
    {
        title: "Step 1: Scrape Proxies",
        content: "Start by gathering proxies from dozens of public sources. Head to the 'Scraper' tab and hit 'Start Scraping'.",
        icon: <SearchIcon className="w-12 h-12 text-accent" />
    },
    {
        title: "Step 2: Check Your List",
        content: "Once you have a list, go to the 'Checker' tab. Here you can run high-speed tests to find the valid and high-quality proxies.",
        icon: <ShieldCheckIcon className="w-12 h-12 text-accent" />
    },
    {
        title: "Step 3: Manage Your Database",
        content: "All your validated proxies live in the 'Database' tab. You can filter, sort, export, and analyze your curated list here.",
        icon: <DatabaseIcon className="w-12 h-12 text-accent" />
    },
    {
        title: "You're All Set!",
        content: "You're now ready to build your elite proxy collection. Explore the 'Sources' and 'Settings' tabs for more customization.",
        icon: <span className="text-5xl">🎉</span>
    }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[fadeIn_0.5s_ease-out]">
            <div className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-md w-full text-center flex flex-col items-center">
                <div className="mb-6">{step.icon}</div>
                <h2 className="text-3xl font-bold text-accent mb-4">{step.title}</h2>
                <p className="text-text-primary mb-8">{step.content}</p>

                <div className="flex items-center justify-center w-full">
                    {currentStep < steps.length - 1 && (
                         <button onClick={onFinish} className="text-sm text-text-secondary hover:text-text-primary absolute bottom-4 left-8">Skip Tour</button>
                    )}
                    <button 
                        onClick={handleNext}
                        className="w-1/2 bg-accent text-primary font-bold py-3 rounded-lg hover:brightness-110 transition-colors shadow-neon-accent"
                    >
                        {currentStep < steps.length - 1 ? 'Next' : 'Finish Tour'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
