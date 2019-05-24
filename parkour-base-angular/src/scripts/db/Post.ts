

export class Post {

}

export interface PostSchema
{
    title: string;
    body: string;
    image_src: string;

    likes: number;

    time_posted: Date;
}