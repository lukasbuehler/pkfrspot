

export module Spot {
    interface Schema {
        name: string;
        location: [number, number];
        address: string;
        image_src: string;
        type: string;

        bounds: [number, number][];

        time_created: Date;
        time_updated: Date;
    }
}