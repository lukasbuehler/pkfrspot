

export module Spot {
    interface Schema {
        name: string;
        location: [number, number];
        address: string;

        time_created: Date;
        time_updated: Date;
    }
}