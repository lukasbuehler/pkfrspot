import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import { keys } from "src/environments/keys";

@Injectable({
  providedIn: "root",
})
export class MapsApiService {
  constructor(private http: HttpClient) {}

  reverseGeocoding(location: google.maps.LatLngLiteral): Observable<any> {
    return this.http.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        latlng: `${location.lat},${location.lng}`,
        key: keys.google_maps,
      },
    });
  }

  getAddressComponents(latLng: google.maps.LatLngLiteral): Observable<any> {
    return new Observable<any>((observer) => {
      this.reverseGeocoding(latLng).subscribe(
        (data) => {
          console.log(data);
        },
        (error) => {
          console.error(error);
        }
      );
    });
  }
}
