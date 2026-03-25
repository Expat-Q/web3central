const toProgressEntry = (value = {}) => {
    const quizScore = Number(value?.quizScore ?? 0);
    const completedAt = value?.completedAt ? new Date(value.completedAt) : undefined;

    return {
        completed: Boolean(value?.completed),
        quizScore: Number.isFinite(quizScore) ? quizScore : 0,
        ...(completedAt && !Number.isNaN(completedAt.getTime()) ? { completedAt } : {})
    };
};

const normalizeLearningProgressMap = (user) => {
    const raw = user?.learningProgress;

    if (raw instanceof Map) {
        const normalized = new Map();
        let changed = false;

        for (const [key, value] of raw.entries()) {
            const normalizedEntry = toProgressEntry(value);
            normalized.set(String(key), normalizedEntry);

            if (
                value?.completed !== normalizedEntry.completed ||
                Number(value?.quizScore ?? 0) !== normalizedEntry.quizScore ||
                Boolean(value?.completedAt) !== Boolean(normalizedEntry.completedAt)
            ) {
                changed = true;
            }
        }

        if (changed) {
            user.learningProgress = normalized;
            return { map: normalized, changed: true };
        }

        return { map: raw, changed: false };
    }

    const normalized = new Map();

    if (raw && typeof raw === 'object') {
        for (const [key, value] of Object.entries(raw)) {
            normalized.set(String(key), toProgressEntry(value));
        }
    }

    user.learningProgress = normalized;
    return { map: normalized, changed: true };
};

const serializeLearningProgress = (learningProgress) => {
    if (learningProgress instanceof Map) {
        return Object.fromEntries(learningProgress.entries());
    }

    if (learningProgress && typeof learningProgress === 'object') {
        return learningProgress;
    }

    return {};
};

module.exports = {
    normalizeLearningProgressMap,
    serializeLearningProgress,
};
