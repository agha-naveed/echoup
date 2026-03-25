export type PostType = {
    id: string;
    author: {
        firstName: string;
        lastName: string;
        username: string;
        profileImage: string;
    };
    content: string;
    imageUrl: string;
    createdAt: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
};