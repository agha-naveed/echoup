// types/database.ts

export interface User {
    id: string;
    first_name: string;
    last_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    email: string;
    username: string | null;
    profile_image: string | null;
    created_at: string;
}

export interface Post {
    id: string;
    content: string;
    image_url: string[] | null;
    author_id: string;
    created_at: string;
    
    // Optional relational fields for when you fetch a post with its author
    author?: User;
    comments?: Comment[];
    likes?: Like[];
}

export interface Comment {
    id: string;
    content: string;
    author_id: string;
    post_id: string;
    photo_index: number | null;
    created_at: string;
    
    author?: User;
}

export interface Like {
    id: string;
    user_id: string;
    post_id: string;
    photo_index: number | null;
    created_at: string;
}

export interface Share {
    id: string;
    user_id: string;
    post_id: string;
    photo_index: number | null;
    created_at: string;
}