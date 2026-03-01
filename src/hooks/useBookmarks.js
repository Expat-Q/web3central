import { useState, useEffect } from 'react';

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            const item = window.localStorage.getItem('web3central_bookmarks');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.warn('Error reading localStorage', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('web3central_bookmarks', JSON.stringify(bookmarks));
        } catch (error) {
            console.warn('Error setting localStorage', error);
        }
    }, [bookmarks]);

    const toggleBookmark = (tool) => {
        setBookmarks(prev => {
            const isBookmarked = prev.some(b => b.id === tool.id || b._id === tool._id);
            if (isBookmarked) {
                return prev.filter(b => b.id !== tool.id && b._id !== tool._id);
            } else {
                return [...prev, tool];
            }
        });
    };

    const isBookmarked = (toolId) => {
        return bookmarks.some(b => b.id === toolId || b._id === toolId);
    };

    return { bookmarks, toggleBookmark, isBookmarked };
}
