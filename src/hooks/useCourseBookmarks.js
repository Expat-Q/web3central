import { useState, useEffect } from 'react';

export function useCourseBookmarks() {
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            const item = window.localStorage.getItem('web3central_course_bookmarks');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.warn('Error reading localStorage', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('web3central_course_bookmarks', JSON.stringify(bookmarks));
        } catch (error) {
            console.warn('Error setting localStorage', error);
        }
    }, [bookmarks]);

    const toggleBookmark = (course) => {
        setBookmarks(prev => {
            const isBookmarked = prev.some(b => b.id === course.id || b._id === course._id);
            if (isBookmarked) {
                return prev.filter(b => b.id !== course.id && b._id !== course._id);
            } else {
                return [...prev, course];
            }
        });
    };

    const isBookmarked = (courseId) => {
        return bookmarks.some(b => b.id === courseId || b._id === courseId);
    };

    return { bookmarks, toggleBookmark, isBookmarked };
}
