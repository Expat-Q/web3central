import React from 'react';
import { ToolLogo } from './ToolLogo';

const CategoryPage = () => {
    return (
        <div>
            {/* Other content */}
            <div className="protocol-card">
                <a href="{tool.twitter}" target="_blank" rel="noreferrer">
                    <ToolLogo />
                </a>
                {/* Other elements */}
            </div>
            {/* Other content */}
            <div className="featured-card">
                <a href="{tool.twitter}" target="_blank" rel="noreferrer">
                    <ToolLogo />
                </a>
                {/* Other elements */}
            </div>
        </div>
    );
};

export default CategoryPage;

/** CSS styles */
.protocol-card a,
.featured-card a {
    transition: transform 0.3s, box-shadow 0.3s;
}
.protocol-card a:hover,
.featured-card a:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
