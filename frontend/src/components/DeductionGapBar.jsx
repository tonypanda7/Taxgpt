import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';

export default function DeductionGapBar({ section, title, used, limit, savingPotential }) {
    const percentage = Math.min(100, Math.max(0, (used / limit) * 100));

    let barColor = "bg-blue-500";
    if (percentage >= 100) barColor = "bg-emerald-500";
    else if (percentage === 0) barColor = "bg-red-400";

    return (
        <div className="mb-5 last:mb-0">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        Section {section}
                        {percentage === 0 && (
                            <span className="flex w-2 h-2 rounded-full bg-red-500" title="Action needed"></span>
                        )}
                        {percentage >= 100 && (
                            <span className="flex w-2 h-2 rounded-full bg-emerald-500" title="Fully utilised"></span>
                        )}
                    </h4>
                    <p className="text-xs text-gray-500">{title}</p>
                </div>
                <div className="text-right">
                    <span className="font-medium text-gray-900">{formatCurrency(used)}</span>
                    <span className="text-gray-400 text-xs ml-1">/ {formatCurrency(limit)}</span>
                </div>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000", barColor)}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {savingPotential > 0 && percentage < 100 && (
                <p className="mt-1.5 text-xs font-medium text-emerald-600">
                    Save an extra {formatCurrency(savingPotential)} in tax by maxing this out.
                </p>
            )}
        </div>
    );
}
