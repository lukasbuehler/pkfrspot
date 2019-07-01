import { LatLngLiteral } from '@agm/core';

export interface Location
{
    _lat: number;
    _long: number;
}

export module Spot
{
    export class Class
    {
        constructor(private _id: string, private _data: Spot.Schema) 
        {
            this._paths = this.makePathsFromBounds(_data.bounds);
        }

        private _paths = []
        get paths() {return this._paths}
        set paths(paths) {
            this._paths = paths;
            this._data.bounds = this.makeBoundsFromPaths(paths);
        }

        get id()
        {
            return this._id;
        }

        get data()
        {
            return this._data;
        }

        private makePathsFromBounds(bounds: Location[]): Array<Array<LatLngLiteral>>
        {
            let path: Array<Array<LatLngLiteral>> = [[]];

            for (let point of bounds)
            {
                path[0].push({ lat: point._lat, lng: point._long })
            }
            return path;
        }

        private makeBoundsFromPaths(path: Array<Array<LatLngLiteral>>): Location[]
        {
            let bounds: Location[] = [];

            for(let point of path[0])
            {
                bounds.push({_lat: point.lat, _long: point.lng })
            }

            return bounds;
        }

    }

    export interface Schema
    {
        name: string;
        location: Location;
        address: string;
        image_src: string;
        type: string;

        bounds: Location[];

        time_created: Date;
        time_updated: Date;
    }
}