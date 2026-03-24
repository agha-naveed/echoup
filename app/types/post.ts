export type PostType = {
    id: string;
    author: {
        firstName: string;
        lastName: string;
        profileImage: string;
    };
    // content: {
    //     text?: string;
    //     image?: string;
    // };
    content: string;
    createdAt: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
};