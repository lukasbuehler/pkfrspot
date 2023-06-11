import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable, catchError, map, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MapsApiService {
  isApiLoaded$: Observable<boolean>;

  constructor(private http: HttpClient) {
    this.isApiLoaded$ = http
      .jsonp(
        "https://maps.googleapis.com/maps/api/js?key=" +
          environment.keys.google_maps,
        "callback"
      )
      .pipe(
        map(() => true),
        catchError((err) => {
          console.error("error loading google maps API", err);
          return of(false);
        })
      );
  }

  reverseGeocoding(location: google.maps.LatLngLiteral): Observable<any> {
    return this.http.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        latlng: `${location.lat},${location.lng}`,
        key: environment.keys.google_maps,
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

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  watchLocation(
    successCallback: PositionCallback,
    errorCallback: PositionErrorCallback,
    options?: PositionOptions
  ) {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        options
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  showPosition(position) {
    console.log(position);
  }
}
