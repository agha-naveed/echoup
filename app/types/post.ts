export type PostType = {
    id: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        profileImage: string;
    };
    content: string;
    imageUrl: string;
    createdAt: string;
    likes: number;
    comments: any[];
    shares: number;
    isLiked?: boolean;
};