import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable, BehaviorSubject, catchError, map, of, take } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MapsApiService {
  private _isApiLoaded$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isApiLoaded$: Observable<boolean> = this._isApiLoaded$;

  constructor(private http: HttpClient) {
    this.loadGoogleMapsApi();
  }

  loadGoogleMapsApi() {
    // Load the Google Maps API if it is not already loaded
    if (this._isApiLoaded$.value) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.keys.google_maps}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      this._isApiLoaded$.next(true);
    };
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
}
