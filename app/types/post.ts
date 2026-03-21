export type PostType = {
    id: string;
    author: {
        name: string;
        avatar: string;
    };
    content: {
        text?: string;
        image?: string;
    };
    createdAt: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
};