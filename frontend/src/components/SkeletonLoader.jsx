import './SkeletonLoader.css';

/**
 * SkeletonLoader — animated loading placeholders.
 *
 * Props:
 *   type  : "cards" | "repair-rows" | "table-rows"
 *   count : number of skeleton rows/cards to render  (default 3)
 *   cols  : number of columns for "table-rows" type  (default 4)
 */
const SkeletonLoader = ({ type = 'cards', count = 3, cols = 4 }) => {
    const arr = Array.from({ length: count });

    if (type === 'cards') {
        return (
            <div className="sk-cards-wrap">
                {arr.map((_, i) => (
                    <div key={i} className="sk-card">
                        <div className="sk-card-left">
                            <div className="skeleton-base sk-line sk-line-lg sk-line-80" />
                            <div className="skeleton-base sk-line sk-line-full" />
                            <div className="skeleton-base sk-line sk-line-sm" />
                            <div className="skeleton-base sk-line sk-line-xs" />
                        </div>
                        <div className="sk-card-right">
                            <div className="skeleton-base sk-btn" />
                            <div className="skeleton-base sk-btn" style={{ width: 90 }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'repair-rows') {
        return (
            <div className="sk-repair-rows-wrap">
                {arr.map((_, i) => (
                    <div key={i} className="sk-repair-row">
                        <div className="sk-repair-left">
                            <div className="skeleton-base sk-icon-circle" />
                            <div className="sk-repair-info">
                                <div className="skeleton-base sk-line sk-line-lg sk-line-80" />
                                <div className="skeleton-base sk-line sk-line-sm" />
                                <div className="skeleton-base sk-line sk-line-xs" />
                            </div>
                        </div>
                        <div className="sk-repair-right">
                            <div className="skeleton-base sk-btn" />
                            <div className="skeleton-base sk-btn" style={{ width: 90 }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'table-rows') {
        return (
            <div className="sk-table-wrap">
                {arr.map((_, i) => (
                    <div key={i} className="sk-table-row">
                        {Array.from({ length: cols }).map((__, j) => (
                            <div key={j} className="sk-table-cell">
                                <div className="skeleton-base sk-cell-line" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

export default SkeletonLoader;
