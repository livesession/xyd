import React, {useState} from 'react';

export interface Guide {
    icon: JSX.Element;

    title: string;

    description: string;
}

export interface GuidesProps {
    guides: Guide[];
}

const ArrowIcon = ({isVisible}: { isVisible: boolean }) => (
    <span
        className={`px-2 inline-block transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-1'}`}>
    →
  </span>
);

export function Guides(props: GuidesProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-6" style={{}}>
            {props.guides.map((guide, index) => (
                <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-300"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                        {guide.icon}
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-normal flex items-center space-x-2">
                            <span>{guide.title}</span>
                            <ArrowIcon isVisible={hoveredIndex === index}/>
                        </h3>
                        <p className="text-gray-600">{guide.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}