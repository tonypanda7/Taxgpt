import { cn } from '../utils/cn';

export default function HealthGauge({ score, label, subtitle }) {
    // Calculate SVG dash array for the gauge
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    // Arc is 3/4 of a circle (270 degrees)
    const arcLength = circumference * 0.75;
    const strokeDashoffset = arcLength - (score / 100) * arcLength;

    let colorClass = "text-red-500";
    let bgClass = "bg-red-50 text-red-700";
    if (score >= 75) {
        colorClass = "text-emerald-500";
        bgClass = "bg-emerald-50 text-emerald-700";
    } else if (score >= 50) {
        colorClass = "text-amber-500";
        bgClass = "bg-amber-50 text-amber-700";
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 140 140">
                    {/* Background Arc */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-100"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeLinecap="round"
                    />
                    {/* Progress Arc */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className={cn("transition-all duration-1000 ease-out", colorClass)}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-4xl font-bold tracking-tighter text-gray-900">{score}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">/ 100</span>
                </div>
            </div>

            <div className={cn("px-3 py-1 rounded-full text-sm font-medium mt-2 mb-1", bgClass)}>
                {label}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
